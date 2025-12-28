;; bitpay-access-control
;; Role-based access control and emergency controls for BitPay protocol
;; Manages admin privileges, pausing, and authorization for all protocol contracts

;; constants
;;

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u200))
(define-constant ERR_NOT_CONTRACT_OWNER (err u201))
(define-constant ERR_ALREADY_ADMIN (err u202))
(define-constant ERR_NOT_ADMIN (err u203))
(define-constant ERR_PAUSED (err u204))
(define-constant ERR_NOT_PAUSED (err u205))
(define-constant ERR_PENDING_ADMIN_NOT_SET (err u206))
(define-constant ERR_NOT_PENDING_ADMIN (err u207))

;; Contract owner (immutable after deployment)
(define-constant CONTRACT_OWNER tx-sender)

;; data vars
;;

;; Protocol pause state
(define-data-var protocol-paused bool false)

;; Pending admin for two-step transfer
(define-data-var pending-admin (optional principal) none)

;; data maps
;;

;; Admin roles mapping
(define-map admins
    principal
    bool
)

;; Operator roles mapping (can perform certain operations but not admin functions)
(define-map operators
    principal
    bool
)

;; Authorized protocol contracts that can perform privileged operations
;; This prevents unauthorized contracts from calling sensitive functions
(define-map authorized-contracts
    principal
    bool
)