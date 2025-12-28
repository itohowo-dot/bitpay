;; bitpay-obligation-nft
;; Obligation NFT - Tokenizes payment obligations for senders (transferable)
;; This allows senders to sell/transfer their payment obligations (invoice factoring)

;; Implement SIP-009 NFT trait
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Define the NFT
(define-non-fungible-token obligation-nft uint)

;; Data vars
(define-data-var last-token-id uint u0)
(define-data-var base-token-uri (string-ascii 256) "")

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_OWNER_ONLY (err u500))
(define-constant ERR_NOT_TOKEN_OWNER (err u501))
(define-constant ERR_TOKEN_NOT_FOUND (err u502))
(define-constant ERR_UNAUTHORIZED (err u503))
(define-constant ERR_STREAM_CANCELLED (err u504))

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