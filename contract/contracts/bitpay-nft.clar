;; bitpay-nft
;; Stream NFT - Tokenizes payment streams following SIP-009 NFT standard

;; Implement SIP-009 NFT trait
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Define the NFT
(define-non-fungible-token stream-nft uint)

;; Data vars
(define-data-var last-token-id uint u0)
(define-data-var base-token-uri (string-ascii 256) "")

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_OWNER_ONLY (err u400))
(define-constant ERR_NOT_TOKEN_OWNER (err u401))
(define-constant ERR_TOKEN_NOT_FOUND (err u402))
(define-constant ERR_UNAUTHORIZED (err u403))

;; Map token ID to stream ID
(define-map token-to-stream
    uint
    uint
)

;; Map stream ID to token ID
(define-map stream-to-token
    uint
    uint
)

;; SIP-009 required functions

;; Get the last minted token ID
;; @returns: (ok last-token-id)
(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

;; Get the token URI for metadata
;; @param token-id: ID of the token
;; @returns: (ok optional-uri)
(define-read-only (get-token-uri (token-id uint))
    (if (> (len (var-get base-token-uri)) u0)
        (ok (some (var-get base-token-uri)))
        (ok none)
    )
)

;; Get the owner of a token
;; @param token-id: ID of the token
;; @returns: (ok optional-owner)
(define-read-only (get-owner (token-id uint))
    (ok (nft-get-owner? stream-nft token-id))
)

;; Transfer is DISABLED - Recipient NFTs are soul-bound (non-transferable)
;; They serve as proof of receipt and cannot be traded
;; @param token-id: ID of the token
;; @param sender: Current owner
;; @param recipient: Intended recipient
;; @returns: Always returns ERR_UNAUTHORIZED (transfers disabled)
;; #[allow(unchecked_data)]
(define-public (transfer
        (token-id uint)
        (sender principal)
        (recipient principal)
    )
    ;; Soul-bound: recipient NFTs cannot be transferred
    ERR_UNAUTHORIZED
)