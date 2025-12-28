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

;; Get all listings created by a user
;; @param user: Principal address
;; @returns: List of stream IDs listed by user
(define-read-only (get-user-listings (user principal))
  (default-to (list) (map-get? user-listings user))
)

;; Get sale history by sale ID
;; @param sale-id: ID of the sale
;; @returns: Optional sale data
(define-read-only (get-sale-history (sale-id uint))
  (map-get? sales-history sale-id)
)

;; Get marketplace statistics
;; @returns: (ok stats) with total listings, sales, and volume
(define-read-only (get-marketplace-stats)
  (ok {
    total-listings: (var-get total-listings),
    total-sales: (var-get total-sales),
    total-volume: (var-get total-volume),
  })
)

;; Calculate marketplace fee for a given price
;; @param price: Sale price in sats
;; @returns: Fee amount in sats
(define-read-only (calculate-marketplace-fee (price uint))
  (/ (* price (var-get marketplace-fee-bps)) u10000)
)

;; Get current marketplace fee in basis points
;; @returns: (ok fee-bps)
(define-read-only (get-marketplace-fee-bps)
  (ok (var-get marketplace-fee-bps))
)

;; Calculate seller proceeds after marketplace fee
;; @param price: Sale price in sats
;; @returns: Net proceeds to seller in sats
(define-read-only (calculate-seller-proceeds (price uint))
  (- price (calculate-marketplace-fee price))
)

;; Get pending purchase details for a stream
;; @param stream-id: ID of the stream
;; @returns: Optional pending purchase data
(define-read-only (get-pending-purchase (stream-id uint))
  (map-get? pending-purchases stream-id)
)

;; Check if a stream has a pending purchase
;; @param stream-id: ID of the stream
;; @returns: true if pending purchase exists, false otherwise
(define-read-only (is-pending-purchase (stream-id uint))
  (is-some (get-pending-purchase stream-id))
)

;; Check if a principal is an authorized backend
;; @param backend: Principal to check
;; @returns: true if authorized, false otherwise
(define-read-only (is-authorized-backend (backend principal))
  (default-to false (map-get? authorized-backends backend))
)

;; Get count of active listings
;; @returns: (ok total-listings)
(define-read-only (get-active-listings-count)
  (ok (var-get total-listings))
)

;; Get detailed listing information including fees
;; @param stream-id: ID of the stream
;; @returns: (ok listing-details) or error
(define-read-only (get-listing-details (stream-id uint))
  (match (get-listing stream-id)
    listing (ok {
      stream-id: stream-id,
      seller: (get seller listing),
      price: (get price listing),
      listed-at: (get listed-at listing),
      active: (get active listing),
      marketplace-fee: (calculate-marketplace-fee (get price listing)),
      seller-proceeds: (calculate-seller-proceeds (get price listing)),
    })
    err-listing-not-found
  )
)

;; Public functions

;; List an obligation NFT for sale
;; @param stream-id: ID of the stream to list
;; @param price: Asking price in sats
;; @returns: (ok true) on success
(define-public (list-nft
    (stream-id uint)
    (price uint)
  )
  (let (
      (listing-check (get-listing stream-id))
      (nft-owner-response (unwrap! (contract-call? .bitpay-obligation-nft-v4 get-owner stream-id)
        err-invalid-stream
      ))
      (nft-owner (unwrap! nft-owner-response err-not-nft-owner))
    )
    ;; Validations
    (asserts! (> price u0) err-invalid-price)
    (asserts! (is-eq nft-owner tx-sender) err-not-nft-owner)
    (asserts! (is-none listing-check) err-already-listed)
    (asserts! (not (is-pending-purchase stream-id)) err-already-pending)

    ;; Create listing
    (map-set listings stream-id {
      seller: tx-sender,
      price: price,
      listed-at: stacks-block-height,
      active: true,
    })

    ;; Update user listings
    (match (map-get? user-listings tx-sender)
      existing-listings (map-set user-listings tx-sender
        (unwrap! (as-max-len? (append existing-listings stream-id) u50)
          err-not-authorized
        ))
      (map-set user-listings tx-sender (list stream-id))
    )

    ;; Update stats
    (var-set total-listings (+ (var-get total-listings) u1))

    ;; Emit event
    (print {
      event: "market-nft-listed",
      stream-id: stream-id,
      seller: tx-sender,
      price: price,
      listed-at: stacks-block-height,
    })

    (ok true)
  )
)