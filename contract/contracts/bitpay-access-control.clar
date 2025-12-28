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

;; Initialize contract owner as first admin
(map-set admins CONTRACT_OWNER true)

;; public functions
;;

;; Add a new admin (only callable by existing admin)
;; @param new-admin: Principal to grant admin role
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (add-admin (new-admin principal))
    (begin
        ;; Only admins can add other admins
        (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)

        ;; Check if already an admin
        (asserts! (not (is-admin new-admin)) ERR_ALREADY_ADMIN)

        ;; Grant admin role
        (map-set admins new-admin true)

        (print {
            event: "access-admin-added",
            admin: new-admin,
            added-by: tx-sender,
        })

        (ok true)
    )
)

;; Remove an admin (only callable by contract owner or self)
;; @param admin: Principal to revoke admin role from
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (remove-admin (admin principal))
    (begin
        ;; Only contract owner or the admin themselves can remove admin role
        (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-eq tx-sender admin))
            ERR_NOT_CONTRACT_OWNER
        )

        ;; Check if target is actually an admin
        (asserts! (is-admin admin) ERR_NOT_ADMIN)

        ;; Revoke admin role
        (map-delete admins admin)

        (print {
            event: "access-admin-removed",
            admin: admin,
            removed-by: tx-sender,
        })

        (ok true)
    )
)

;; Add an operator
;; @param new-operator: Principal to grant operator role
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (add-operator (new-operator principal))
    (begin
        ;; Only admins can add operators
        (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)

        ;; Grant operator role
        (map-set operators new-operator true)

        (print {
            event: "access-operator-added",
            operator: new-operator,
            added-by: tx-sender,
        })

        (ok true)
    )
)

;; Remove an operator
;; @param operator: Principal to revoke operator role from
;; @returns: (ok true) on success
;; #[allow(unchecked_data)]
(define-public (remove-operator (operator principal))
    (begin
        ;; Only admins can remove operators
        (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)

        ;; Revoke operator role
        (map-delete operators operator)

        (print {
            event: "access-operator-removed",
            operator: operator,
            removed-by: tx-sender,
        })

        (ok true)
    )
)