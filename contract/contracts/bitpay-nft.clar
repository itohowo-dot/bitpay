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