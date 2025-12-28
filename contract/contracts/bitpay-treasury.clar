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
