;; bitpay-sbtc-helper
;; Helper contract for sBTC integration in BitPay streaming protocol
;; Handles all sBTC token operations with proper error handling and vault management

;; Error codes
(define-constant ERR_SBTC_TRANSFER_FAILED (err u100))
(define-constant ERR_INSUFFICIENT_BALANCE (err u101))
(define-constant ERR_UNAUTHORIZED (err u102))
(define-constant ERR_INVALID_AMOUNT (err u103))

;; sBTC Contract Address (Simnet/Devnet)
;; Clarinet automatically remaps this to correct address on testnet/mainnet
;; Simnet: SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
;; Testnet: ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
(define-constant SBTC_CONTRACT 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; public functions
;;

;; Transfer sBTC from sender to contract vault (used for stream creation)
;; This locks sBTC in the contract to be streamed over time
;; @param amount: Amount of sBTC (in sats) to transfer to vault
;; @param sender: Principal who is depositing sBTC
;; @returns: (ok true) on success, error on failure
;; #[allow(unchecked_data)]
(define-public (transfer-to-vault
        (amount uint)
        (sender principal)
    )
    (begin
        ;; Validate amount is greater than zero
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)

        ;; Validate sender is tx-sender or contract-caller
        (asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender))
            ERR_UNAUTHORIZED
        )

        ;; Transfer sBTC from sender to this contract
        ;; Using contract-call? to interact with sBTC token contract
        (match (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
            transfer amount sender (as-contract tx-sender) none
        )
            success (ok true)
            error
            ERR_SBTC_TRANSFER_FAILED
        )
    )
)