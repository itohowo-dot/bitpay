;; bitpay-core
;; Core streaming payment protocol for BitPay
;; Handles stream creation, vesting calculation, withdrawals, and cancellations

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u300))
(define-constant ERR_STREAM_NOT_FOUND (err u301))
(define-constant ERR_INVALID_AMOUNT (err u302))
(define-constant ERR_INVALID_DURATION (err u303))
(define-constant ERR_STREAM_ALREADY_CANCELLED (err u304))
(define-constant ERR_NOTHING_TO_WITHDRAW (err u305))
(define-constant ERR_INVALID_RECIPIENT (err u306))
(define-constant ERR_START_BLOCK_IN_PAST (err u307))
(define-constant ERR_STREAM_CANCELLED (err u308))
(define-constant ERR_INSUFFICIENT_BALANCE (err u309))

;; Minimum stream duration (10 blocks ~100 minutes on Bitcoin)
(define-constant MIN_STREAM_DURATION u10)

;; Cancellation fee in basis points (100 = 1%, 50 = 0.5%)
;; This fee discourages frivolous cancellations and compensates recipients
;; Fee is charged on the unvested amount being returned to sender
(define-constant CANCELLATION_FEE_BPS u100) ;; 1% cancellation fee

;; data vars
;;

;; Counter for stream IDs
(define-data-var next-stream-id uint u1)

;; data maps
;;

;; Stream data structure
(define-map streams
    uint ;; stream-id
    {
        sender: principal,
        recipient: principal,
        amount: uint,
        start-block: uint,
        end-block: uint,
        withdrawn: uint,
        cancelled: bool,
        cancelled-at-block: (optional uint),
    }
)

;; Track user's created streams
(define-map sender-streams
    principal ;; sender
    (list 200 uint) ;; list of stream-ids
)

;; Track user's received streams
(define-map recipient-streams
    principal ;; recipient
    (list 200 uint) ;; list of stream-ids
)

;; public functions
;;

;; Create a new payment stream
;; @param recipient: Principal receiving the stream
;; @param amount: Total amount of sBTC to stream (in sats)
;; @param start-block: Block height when streaming starts
;; @param end-block: Block height when streaming ends
;; @returns: (ok stream-id) on success
;; #[allow(unchecked_data)]
(define-public (create-stream
        (recipient principal)
        (amount uint)
        (start-block uint)
        (end-block uint)
    )
    (let (
            (stream-id (var-get next-stream-id))
            (duration (- end-block start-block))
        )
        (begin
            ;; Check protocol not paused
            (try! (contract-call? .bitpay-access-control-v4 assert-not-paused))

            ;; Validate inputs
            (asserts! (> amount u0) ERR_INVALID_AMOUNT)
            (asserts! (not (is-eq recipient tx-sender)) ERR_INVALID_RECIPIENT)
            (asserts! (>= start-block stacks-block-height)
                ERR_START_BLOCK_IN_PAST
            )
            (asserts! (>= duration MIN_STREAM_DURATION) ERR_INVALID_DURATION)

            ;; Transfer sBTC to vault
            (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-to-vault amount
                tx-sender
            ))

            ;; Create stream record
            (map-set streams stream-id {
                sender: tx-sender,
                recipient: recipient,
                amount: amount,
                start-block: start-block,
                end-block: end-block,
                withdrawn: u0,
                cancelled: false,
                cancelled-at-block: none,
            })

            ;; Update sender's stream list
            (map-set sender-streams tx-sender
                (unwrap-panic (as-max-len? (append (get-sender-streams tx-sender) stream-id)
                    u200
                ))
            )

            ;; Update recipient's stream list
            (map-set recipient-streams recipient
                (unwrap-panic (as-max-len? (append (get-recipient-streams recipient) stream-id)
                    u200
                ))
            )

            ;; Increment stream ID counter
            (var-set next-stream-id (+ stream-id u1))

            ;; Mint recipient NFT (soul-bound proof of receipt)
            (try! (contract-call? .bitpay-nft-v4 mint stream-id recipient))

            ;; Mint obligation NFT for sender (transferable payment obligation)
            (try! (contract-call? .bitpay-obligation-nft-v4 mint stream-id tx-sender))

            (print {
                event: "stream-created",
                stream-id: stream-id,
                sender: tx-sender,
                recipient: recipient,
                amount: amount,
                start-block: start-block,
                end-block: end-block,
            })

            (ok stream-id)
        )
    )
)

;; Withdraw vested amount from a stream
;; @param stream-id: ID of the stream to withdraw from
;; @returns: (ok withdrawn-amount) on success
;; #[allow(unchecked_data)]
(define-public (withdraw-from-stream (stream-id uint))
    (let (
            (stream (unwrap! (map-get? streams stream-id) ERR_STREAM_NOT_FOUND))
            (available (try! (get-withdrawable-amount stream-id)))
        )
        (begin
            ;; Only recipient can withdraw
            (asserts! (is-eq tx-sender (get recipient stream)) ERR_UNAUTHORIZED)

            ;; Check there's something to withdraw
            (asserts! (> available u0) ERR_NOTHING_TO_WITHDRAW)

            ;; Transfer from vault to recipient
            (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault available
                tx-sender
            ))

            ;; Update withdrawn amount
            (map-set streams stream-id
                (merge stream { withdrawn: (+ (get withdrawn stream) available) })
            )

            (print {
                event: "stream-withdrawal",
                stream-id: stream-id,
                recipient: tx-sender,
                amount: available,
            })

            (ok available)
        )
    )
)

;; Withdraw a specific amount from a stream (partial withdrawal)
;; @param stream-id: ID of the stream to withdraw from
;; @param amount: Amount to withdraw (must be <= available)
;; @returns: (ok withdrawn-amount) on success
;; #[allow(unchecked_data)]
(define-public (withdraw-partial
        (stream-id uint)
        (amount uint)
    )
    (let (
            (stream (unwrap! (map-get? streams stream-id) ERR_STREAM_NOT_FOUND))
            (available (try! (get-withdrawable-amount stream-id)))
        )
        (begin
            ;; Only recipient can withdraw
            (asserts! (is-eq tx-sender (get recipient stream)) ERR_UNAUTHORIZED)

            ;; Check there's something to withdraw
            (asserts! (> amount u0) ERR_NOTHING_TO_WITHDRAW)

            ;; Check requested amount doesn't exceed available
            (asserts! (<= amount available) ERR_INSUFFICIENT_BALANCE)

            ;; Transfer from vault to recipient
            (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault amount
                tx-sender
            ))

            ;; Update withdrawn amount
            (map-set streams stream-id
                (merge stream { withdrawn: (+ (get withdrawn stream) amount) })
            )

            (print {
                event: "stream-withdrawal",
                stream-id: stream-id,
                recipient: tx-sender,
                amount: amount,
            })

            (ok amount)
        )
    )
)

;; Cancel a stream and return unvested funds to sender (minus cancellation fee)
;; A 1% cancellation fee is charged on unvested amount to discourage frivolous cancellations
;; @param stream-id: ID of the stream to cancel
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (cancel-stream (stream-id uint))
    (let (
            (stream (unwrap! (map-get? streams stream-id) ERR_STREAM_NOT_FOUND))
            (vested (get-vested-amount-at-block stream-id stacks-block-height))
            (already-withdrawn (get withdrawn stream))
            (unvested (- (get amount stream) vested))
            (owed-to-recipient (- vested already-withdrawn))
            ;; Calculate cancellation fee (charged on unvested amount)
            (cancellation-fee (/ (* unvested CANCELLATION_FEE_BPS) u10000))
            (unvested-after-fee (- unvested cancellation-fee))
        )
        (begin
            ;; Only sender can cancel
            (asserts! (is-eq tx-sender (get sender stream)) ERR_UNAUTHORIZED)

            ;; Check not already cancelled
            (asserts! (not (get cancelled stream)) ERR_STREAM_ALREADY_CANCELLED)

            ;; Transfer cancellation fee to treasury and update accounting
            (if (> cancellation-fee u0)
                (begin
                    ;; 1. Transfer sBTC from vault to treasury contract via helper
                    ;; The treasury contract will receive the sBTC in its own balance
                    (try! (contract-call? .bitpay-treasury-v4 collect-cancellation-fee
                        cancellation-fee
                    ))
                    true
                )
                true
            )

            ;; Transfer unvested (minus fee) back to sender
            (if (> unvested-after-fee u0)
                (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault
                    unvested-after-fee tx-sender
                ))
                true
            )

            ;; Transfer owed amount to recipient
            (if (> owed-to-recipient u0)
                (try! (contract-call? .bitpay-sbtc-helper-v4 transfer-from-vault
                    owed-to-recipient (get recipient stream)
                ))
                true
            )

            ;; Mark stream as cancelled
            (map-set streams stream-id
                (merge stream {
                    cancelled: true,
                    cancelled-at-block: (some stacks-block-height),
                    withdrawn: (get amount stream), ;; Mark all as withdrawn
                })
            )

            (print {
                event: "stream-cancelled",
                stream-id: stream-id,
                sender: tx-sender,
                unvested-returned: unvested-after-fee,
                cancellation-fee: cancellation-fee,
                vested-paid: owed-to-recipient,
                cancelled-at-block: stacks-block-height,
            })

            (ok true)
        )
    )
)