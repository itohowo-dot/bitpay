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