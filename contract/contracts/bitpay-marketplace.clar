;; BitPay Marketplace Contract
;; Enables buying and selling of obligation NFTs for invoice factoring

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-listing-not-found (err u404))
(define-constant err-already-listed (err u409))
(define-constant err-invalid-price (err u400))
(define-constant err-invalid-stream (err u400))
(define-constant err-not-nft-owner (err u403))
(define-constant err-payment-failed (err u402))
(define-constant err-transfer-failed (err u403))
(define-constant err-listing-inactive (err u410))
(define-constant err-no-pending-purchase (err u411))
(define-constant err-purchase-expired (err u412))
(define-constant err-buyer-mismatch (err u413))
(define-constant err-payment-id-mismatch (err u414))
(define-constant err-not-expired (err u415))
(define-constant err-already-pending (err u416))

;; Data Variables
(define-data-var total-listings uint u0)
(define-data-var total-sales uint u0)
(define-data-var total-volume uint u0)
(define-data-var marketplace-fee-bps uint u100) ;; Platform fee: 1% = 100 basis points

;; Data Maps
(define-map listings
  uint ;; stream-id
  {
    seller: principal,
    price: uint,
    listed-at: uint,
    active: bool,
  }
)

(define-map user-listings
  principal
  (list 50 uint) ;; List of stream-ids listed by user
)

(define-map sales-history
  uint ;; sale-id
  {
    stream-id: uint,
    seller: principal,
    buyer: principal,
    price: uint,
    sold-at: uint,
    payment-id: (optional (string-ascii 64)),
  }
)

;; Pending purchases for gateway-assisted buying
(define-map pending-purchases
  uint ;; stream-id
  {
    buyer: principal,
    payment-id: (string-ascii 64),
    initiated-at: uint,
    expires-at: uint,
  }
)

;; Authorized backend principals who can complete gateway purchases
(define-map authorized-backends
  principal
  bool
)

;; Read-only functions

;; Get listing details for a stream
;; @param stream-id: ID of the stream
;; @returns: Optional listing data
(define-read-only (get-listing (stream-id uint))
  (map-get? listings stream-id)
)

;; Check if a stream is currently listed
;; @param stream-id: ID of the stream
;; @returns: true if active listing exists, false otherwise
(define-read-only (is-listed (stream-id uint))
  (match (get-listing stream-id)
    listing (get active listing)
    false
  )
)