;; bitpay-treasury
;; Treasury contract for fee collection and management

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u500))
(define-constant ERR_INSUFFICIENT_BALANCE (err u501))
(define-constant ERR_INVALID_AMOUNT (err u502))
(define-constant ERR_PAUSED (err u503))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u504))
(define-constant ERR_ALREADY_APPROVED (err u505))
(define-constant ERR_ALREADY_EXECUTED (err u506))
(define-constant ERR_INSUFFICIENT_APPROVALS (err u507))
(define-constant ERR_PROPOSAL_EXPIRED (err u508))
(define-constant ERR_TIMELOCK_NOT_ELAPSED (err u509))
(define-constant ERR_NOT_ADMIN (err u510))
(define-constant ERR_ALREADY_ADMIN (err u511))
(define-constant ERR_EXCEEDS_DAILY_LIMIT (err u512))

;; Fee percentage (basis points: 100 = 1%, 50 = 0.5%)
(define-constant DEFAULT_FEE_BPS u50) ;; 0.5% fee

;; Multi-sig configuration (3-of-5 institutional standard)
(define-constant REQUIRED_SIGNATURES u3)
(define-constant TOTAL_ADMIN_SLOTS u5)
(define-constant TIMELOCK_BLOCKS u144) ;; ~24 hours (144 blocks)
(define-constant PROPOSAL_EXPIRY_BLOCKS u1008) ;; ~7 days
(define-constant DAILY_WITHDRAWAL_LIMIT u100000000) ;; 100 sBTC per day

;; Data vars
(define-data-var treasury-balance uint u0)
(define-data-var fee-bps uint DEFAULT_FEE_BPS)
(define-data-var total-fees-collected uint u0)
(define-data-var admin principal CONTRACT_OWNER) ;; Legacy admin (will migrate to multi-sig)
(define-data-var pending-admin (optional principal) none)
(define-data-var next-proposal-id uint u0)
(define-data-var last-withdrawal-block uint u0)
(define-data-var withdrawn-today uint u0)
(define-data-var active-admin-count uint u1) ;; Start with 1 (CONTRACT_OWNER)

;; Maps
(define-map fee-recipients
    principal
    uint
)

;; Multi-sig admins (5 slots for institutional governance)
(define-map multisig-admins
    principal
    bool
)

;; Withdrawal proposals
(define-map withdrawal-proposals
    uint ;; proposal-id
    {
        proposer: principal,
        amount: uint,
        recipient: principal,
        approvals: (list 10 principal),
        executed: bool,
        proposed-at: uint,
        expires-at: uint,
        description: (string-ascii 256),
    }
)

;; Admin management proposals
(define-map admin-proposals
    uint ;; proposal-id
    {
        proposer: principal,
        action: (string-ascii 10), ;; "add" or "remove"
        target-admin: principal,
        approvals: (list 10 principal),
        executed: bool,
        proposed-at: uint,
        expires-at: uint,
    }
)

;; Initialize first admin (deployer)
(map-set multisig-admins CONTRACT_OWNER true)

;; Authorization checks

;; Check if caller is the legacy admin
;; @returns: true if caller is admin
(define-private (is-admin)
    (is-eq tx-sender (var-get admin))
)

;; Check if a user is a multisig admin
;; @param user: Principal to check
;; @returns: true if user is multisig admin
(define-private (is-multisig-admin (user principal))
    (default-to false (map-get? multisig-admins user))
)

;; Check if caller is either multisig admin or legacy admin
;; @returns: true if caller has admin privileges
(define-private (is-multisig-admin-or-legacy)
    (or (is-multisig-admin tx-sender) (is-admin))
)

;; Helper: Check if principal is in approval list
;; @param item: Principal to search for
;; @param lst: List of principals
;; @returns: true if item is in list
(define-private (is-in-list
        (item principal)
        (lst (list 10 principal))
    )
    (is-some (index-of? lst item))
)

;; Helper: Count active multisig admins
;; @returns: (ok admin-count)
(define-read-only (count-admins)
    (ok (var-get active-admin-count))
)

;; Helper: Get total available admin slots
;; @returns: (ok total-slots)
(define-read-only (get-total-admin-slots)
    (ok TOTAL_ADMIN_SLOTS)
)

;; Check if protocol is paused via access-control
;; @returns: (ok true) if not paused, error if paused
(define-private (check-not-paused)
    (let ((paused-check (contract-call? .bitpay-access-control-v4 is-paused)))
        (asserts! (not paused-check) ERR_PAUSED)
        (ok true)
    )
)

;; Calculate fee amount based on basis points
;; @param amount: Gross amount to calculate fee on
;; @returns: (ok fee-amount)
(define-read-only (calculate-fee (amount uint))
    (let ((fee (/ (* amount (var-get fee-bps)) u10000)))
        (ok fee)
    )
)

;; Collect fee from a stream (called by bitpay-core)
;; @param amount: Amount to collect as fee
;; @returns: (ok fee-amount) on success
;; #[allow(unchecked_data)]
(define-public (collect-fee (amount uint))
    (begin
        (try! (check-not-paused))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)

        (let ((fee (unwrap-panic (calculate-fee amount))))
            ;; Transfer fee from sender to treasury
            (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-to-vault fee
                tx-sender
            ))

            ;; Update treasury balance
            (var-set treasury-balance (+ (var-get treasury-balance) fee))
            (var-set total-fees-collected (+ (var-get total-fees-collected) fee))

            (print {
                event: "treasury-fee-collected",
                amount: fee,
                caller: tx-sender,
                new-balance: (var-get treasury-balance),
            })

            (ok fee)
        )
    )
)

;; Collect cancellation fee from vault (called by bitpay-core after stream cancellation)
;; This transfers sBTC from the vault to treasury and updates accounting
;; @param amount: Amount of cancellation fee to collect from vault
;; @returns: (ok amount) on success
;; #[allow(unchecked_data)]
(define-public (collect-cancellation-fee (amount uint))
    (begin
        (try! (check-not-paused))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)

        ;; Only authorized contracts (bitpay-core) can collect cancellation fees
        (try! (contract-call? .bitpay-access-control-v4 assert-authorized-contract
            contract-caller
        ))

        ;; Transfer sBTC from vault to this treasury contract
        (try! (as-contract (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault amount
            tx-sender
        )))

        ;; Update treasury balance
        (var-set treasury-balance (+ (var-get treasury-balance) amount))
        (var-set total-fees-collected (+ (var-get total-fees-collected) amount))

        (print {
            event: "treasury-cancellation-fee-collected",
            amount: amount,
            caller: contract-caller,
            new-balance: (var-get treasury-balance),
        })

        (ok amount)
    )
)

;; Collect marketplace fee (called by bitpay-marketplace after NFT sale)
;; This updates treasury accounting after receiving marketplace fee payment
;; NOTE: Payment already sent via direct sBTC transfer, this just updates accounting
;; @param amount: Amount of marketplace fee received
;; @returns: (ok amount) on success
;; #[allow(unchecked_data)]
(define-public (collect-marketplace-fee (amount uint))
    (begin
        (try! (check-not-paused))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)

        ;; Only authorized contracts (bitpay-marketplace) can collect marketplace fees
        (try! (contract-call? .bitpay-access-control-v4 assert-authorized-contract
            contract-caller
        ))

        ;; Update treasury balance (sBTC already received via direct transfer)
        (var-set treasury-balance (+ (var-get treasury-balance) amount))
        (var-set total-fees-collected (+ (var-get total-fees-collected) amount))

        (print {
            event: "treasury-marketplace-fee-collected",
            amount: amount,
            caller: contract-caller,
            new-balance: (var-get treasury-balance),
        })

        (ok amount)
    )
)

;; Withdraw from treasury (admin only)
;; @param amount: Amount to withdraw in sats
;; @param recipient: Principal to receive funds
;; @returns: (ok amount) on success
;; #[allow(unchecked_data)]
(define-public (withdraw
        (amount uint)
        (recipient principal)
    )
    (begin
        (asserts! (is-admin) ERR_UNAUTHORIZED)
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= amount (var-get treasury-balance)) ERR_INSUFFICIENT_BALANCE)

        ;; Transfer from treasury to recipient
        (try! (as-contract (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault amount
            recipient
        )))

        ;; Update treasury balance
        (var-set treasury-balance (- (var-get treasury-balance) amount))

        (print {
            event: "treasury-withdrawal",
            amount: amount,
            recipient: recipient,
            admin: tx-sender,
            new-balance: (var-get treasury-balance),
        })

        (ok amount)
    )
)

;; Distribute fees to recipients
;; @param recipient: Principal to receive distribution
;; @param amount: Amount to distribute in sats
;; @returns: (ok amount) on success
;; #[allow(unchecked_data)]
(define-public (distribute-to-recipient
        (recipient principal)
        (amount uint)
    )
    (begin
        (asserts! (is-admin) ERR_UNAUTHORIZED)
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= amount (var-get treasury-balance)) ERR_INSUFFICIENT_BALANCE)

        ;; Transfer to recipient
        (try! (as-contract (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault amount
            recipient
        )))

        ;; Update balances
        (var-set treasury-balance (- (var-get treasury-balance) amount))
        (map-set fee-recipients recipient
            (+ (default-to u0 (map-get? fee-recipients recipient)) amount)
        )

        (print {
            event: "treasury-distribution",
            amount: amount,
            recipient: recipient,
            admin: tx-sender,
            new-balance: (var-get treasury-balance),
        })

        (ok amount)
    )
)

;; Update fee percentage (admin only)
;; @param new-fee-bps: New fee in basis points (max 1000 = 10%)
;; @returns: (ok new-fee-bps) on success
;; #[allow(unchecked_data)]
(define-public (set-fee-bps (new-fee-bps uint))
    (begin
        (asserts! (is-admin) ERR_UNAUTHORIZED)
        (asserts! (<= new-fee-bps u1000) ERR_INVALID_AMOUNT) ;; Max 10% fee

        (let ((old-fee (var-get fee-bps)))
            (var-set fee-bps new-fee-bps)

            (print {
                event: "treasury-fee-updated",
                old-fee-bps: old-fee,
                new-fee-bps: new-fee-bps,
                admin: tx-sender,
            })

            (ok new-fee-bps)
        )
    )
)

;; Propose admin transfer (step 1 of 2)
;; @param new-admin: Principal to transfer admin role to
;; @returns: (ok new-admin) on success
;; #[allow(unchecked_data)]
(define-public (propose-admin-transfer (new-admin principal))
    (begin
        (asserts! (is-admin) ERR_UNAUTHORIZED)
        (asserts! (not (is-eq new-admin (var-get admin))) ERR_INVALID_AMOUNT)

        (var-set pending-admin (some new-admin))

        (print {
            event: "treasury-admin-transfer-proposed",
            current-admin: (var-get admin),
            proposed-admin: new-admin,
        })

        (ok new-admin)
    )
)

;; Accept admin transfer (step 2 of 2)
;; @returns: (ok tx-sender) on success
;; #[allow(unchecked_data)]
(define-public (accept-admin-transfer)
    (let ((pending (var-get pending-admin)))
        (asserts! (is-some pending) ERR_UNAUTHORIZED)
        (asserts! (is-eq tx-sender (unwrap-panic pending)) ERR_UNAUTHORIZED)

        (let ((old-admin (var-get admin)))
            (var-set admin tx-sender)
            (var-set pending-admin none)

            (print {
                event: "treasury-admin-transfer-completed",
                old-admin: old-admin,
                new-admin: tx-sender,
            })

            (ok tx-sender)
        )
    )
)

;; Cancel pending admin transfer
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (cancel-admin-transfer)
    (begin
        (asserts! (is-admin) ERR_UNAUTHORIZED)
        (asserts! (is-some (var-get pending-admin)) ERR_INVALID_AMOUNT)

        (var-set pending-admin none)

        (print {
            event: "treasury-admin-transfer-cancelled",
            cancelled-by: tx-sender,
        })

        (ok true)
    )
)

;; Read-only functions

;; Get current treasury balance
;; @returns: (ok balance)
(define-read-only (get-treasury-balance)
    (ok (var-get treasury-balance))
)

;; Get current fee in basis points
;; @returns: (ok fee-bps)
(define-read-only (get-fee-bps)
    (ok (var-get fee-bps))
)

;; Get total fees collected all-time
;; @returns: (ok total-fees)
(define-read-only (get-total-fees-collected)
    (ok (var-get total-fees-collected))
)

;; Get current admin
;; @returns: (ok admin)
(define-read-only (get-admin)
    (ok (var-get admin))
)

;; Get pending admin transfer
;; @returns: (ok optional-pending-admin)
(define-read-only (get-pending-admin)
    (ok (var-get pending-admin))
)

;; Get total distributed to a recipient
;; @param recipient: Principal to check
;; @returns: (ok amount)
(define-read-only (get-recipient-total (recipient principal))
    (ok (default-to u0 (map-get? fee-recipients recipient)))
)

;; Calculate net amount after fee deduction
;; @param gross-amount: Amount before fee
;; @returns: (ok net-amount)
(define-read-only (get-amount-after-fee (gross-amount uint))
    (let ((fee (unwrap-panic (calculate-fee gross-amount))))
        (ok (- gross-amount fee))
    )
)

;; =============================================================================
;; MULTI-SIG TREASURY FUNCTIONS (Professional Grade)
;; =============================================================================

;; ==========================================
;; WITHDRAWAL PROPOSALS (With Timelock & Limits)
;; ==========================================

;; Propose a withdrawal (requires 3-of-5 approval + 24h timelock)
;; @param amount: Amount to withdraw in sats
;; @param recipient: Principal to receive funds
;; @param description: Description of withdrawal purpose
;; @returns: (ok proposal-id) on success
;; #[allow(unchecked_data)]
(define-public (propose-multisig-withdrawal
        (amount uint)
        (recipient principal)
        (description (string-ascii 256))
    )
    (let (
            (proposal-id (var-get next-proposal-id))
            (expiry (+ stacks-block-height PROPOSAL_EXPIRY_BLOCKS))
        )
        ;; Only multisig admins can propose
        (asserts! (is-multisig-admin tx-sender) ERR_UNAUTHORIZED)
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= amount (var-get treasury-balance)) ERR_INSUFFICIENT_BALANCE)

        ;; Create proposal
        (map-set withdrawal-proposals proposal-id {
            proposer: tx-sender,
            amount: amount,
            recipient: recipient,
            approvals: (list tx-sender), ;; Proposer auto-approves
            executed: false,
            proposed-at: stacks-block-height,
            expires-at: expiry,
            description: description,
        })

        (var-set next-proposal-id (+ proposal-id u1))

        (print {
            event: "treasury-withdrawal-proposed",
            proposal-id: proposal-id,
            amount: amount,
            recipient: recipient,
            proposer: tx-sender,
            description: description,
            expires-at: expiry,
        })

        (ok proposal-id)
    )
)

;; Approve a withdrawal proposal
;; @param proposal-id: ID of the proposal to approve
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (approve-multisig-withdrawal (proposal-id uint))
    (let (
            (proposal (unwrap! (map-get? withdrawal-proposals proposal-id)
                ERR_PROPOSAL_NOT_FOUND
            ))
            (current-approvals (get approvals proposal))
        )
        ;; Checks
        (asserts! (is-multisig-admin tx-sender) ERR_UNAUTHORIZED)
        (asserts! (not (is-in-list tx-sender current-approvals))
            ERR_ALREADY_APPROVED
        )
        (asserts! (not (get executed proposal)) ERR_ALREADY_EXECUTED)
        (asserts! (< stacks-block-height (get expires-at proposal))
            ERR_PROPOSAL_EXPIRED
        )

        ;; Add approval
        (map-set withdrawal-proposals proposal-id
            (merge proposal { approvals: (unwrap! (as-max-len? (append current-approvals tx-sender) u10)
                ERR_INVALID_AMOUNT
            ) }
            ))