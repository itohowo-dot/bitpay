/**
 * Type definitions for Chainhook webhook payloads
 * Based on Chainhook's event structure and BitPay contract events
 */

// ============================================================================
// Core Chainhook Types
// ============================================================================

export interface ChainhookEvent {
  type: string;
  data: {
    contract_identifier: string;
    topic: string;
    value: any;
  };
}

export interface ChainhookTransactionIdentifier {
  hash: string;
}

export interface ChainhookTransaction {
  transaction_identifier: ChainhookTransactionIdentifier;
  operations: any[];
  metadata: {
    success: boolean;
    raw_tx: string;
    result?: string;
    sender: string;
    fee: number;
    kind?: {
      type: string;
      data: any;
    };
    receipt?: {
      events?: ChainhookEvent[];
      mutated_contracts_radius?: string[];
      mutated_assets_radius?: string[];
    };
    events?: ChainhookEvent[];
  };
}

export interface ChainhookBlockIdentifier {
  index: number;
  hash: string;
}

export interface ChainhookBlock {
  block_identifier: ChainhookBlockIdentifier;
  parent_block_identifier: ChainhookBlockIdentifier;
  timestamp: number;
  transactions: ChainhookTransaction[];
  metadata: {
    bitcoin_anchor_block_identifier?: ChainhookBlockIdentifier;
    pox_cycle_index?: number;
    pox_cycle_position?: number;
    pox_cycle_length?: number;
    stacks_block_hash?: string;
  };
}

export interface ChainhookPayload {
  apply: ChainhookBlock[];
  rollback: ChainhookBlock[];
  chainhook: {
    uuid: string;
    predicate: any;
  };
}

// ============================================================================
// BitPay Core Stream Events
// ============================================================================

export interface StreamCreatedEvent {
  event: 'stream-created';
  'stream-id': bigint | number;
  sender: string;
  recipient: string;
  amount: bigint | number;
  'start-block': bigint | number;
  'end-block': bigint | number;
}

export interface StreamWithdrawalEvent {
  event: 'stream-withdrawal';
  'stream-id': bigint | number;
  recipient: string;
  amount: bigint | number;
}

export interface StreamCancelledEvent {
  event: 'stream-cancelled';
  'stream-id': bigint | number;
  sender: string;
  'unvested-returned': bigint | number;
  'vested-paid': bigint | number;
  'cancelled-at-block': bigint | number;
}

export interface StreamSenderUpdatedEvent {
  event: 'stream-sender-updated';
  'stream-id': bigint | number;
  'old-sender': string;
  'new-sender': string;
  recipient: string;
}

export type CoreStreamEvent =
  | StreamCreatedEvent
  | StreamWithdrawalEvent
  | StreamCancelledEvent
  | StreamSenderUpdatedEvent;

// ============================================================================
// BitPay Marketplace Events
// ============================================================================

export interface DirectPurchaseCompletedEvent {
  event: 'market-direct-purchase-completed';
  'stream-id': bigint | number;
  seller: string;
  buyer: string;
  price: bigint | number;
  'marketplace-fee': bigint | number;
  'sale-id': bigint | number;
}

export interface PurchaseInitiatedEvent {
  event: 'market-purchase-initiated';
  'stream-id': bigint | number;
  seller: string;
  buyer: string;
  'payment-id': string;
  'initiated-at': bigint | number;
  'expires-at': bigint | number;
}

export interface GatewayPurchaseCompletedEvent {
  event: 'market-gateway-purchase-completed';
  'stream-id': bigint | number;
  seller: string;
  buyer: string;
  price: bigint | number;
  'marketplace-fee': bigint | number;
  'payment-id': string;
  'sale-id': bigint | number;
}

export interface PurchaseExpiredEvent {
  event: 'market-purchase-expired';
  'stream-id': bigint | number;
  buyer: string;
  'payment-id': string;
}

export interface BackendAuthorizedEvent {
  event: 'market-backend-authorized';
  backend: string;
  'authorized-by': string;
}

export interface BackendDeauthorizedEvent {
  event: 'market-backend-deauthorized';
  backend: string;
  'deauthorized-by': string;
}

export interface MarketplaceFeeUpdatedEvent {
  event: 'market-marketplace-fee-updated';
  'old-fee': bigint | number;
  'new-fee': bigint | number;
  'updated-by': string;
}

export interface NFTListedEvent {
  event: 'market-nft-listed';
  'stream-id': bigint | number;
  seller: string;
  price: bigint | number;
  'listed-at': bigint | number;
}

export interface ListingPriceUpdatedEvent {
  event: 'market-listing-price-updated';
  'stream-id': bigint | number;
  seller: string;
  'old-price': bigint | number;
  'new-price': bigint | number;
}

export interface ListingCancelledEvent {
  event: 'market-listing-cancelled';
  'stream-id': bigint | number;
  seller: string;
}

export type MarketplaceEvent =
  | NFTListedEvent
  | ListingPriceUpdatedEvent
  | ListingCancelledEvent
  | DirectPurchaseCompletedEvent
  | PurchaseInitiatedEvent
  | GatewayPurchaseCompletedEvent
  | PurchaseExpiredEvent
  | BackendAuthorizedEvent
  | BackendDeauthorizedEvent
  | MarketplaceFeeUpdatedEvent;

// ============================================================================
// BitPay Treasury Events
// ============================================================================

export interface FeeCollectedEvent {
  event: 'treasury-fee-collected';
  amount: bigint | number;
  caller: string;
  'new-balance': bigint | number;
}

export interface CancellationFeeCollectedEvent {
  event: 'treasury-cancellation-fee-collected';
  amount: bigint | number;
  caller: string;
  'new-balance': bigint | number;
}

export interface MarketplaceFeeCollectedEvent {
  event: 'treasury-marketplace-fee-collected';
  amount: bigint | number;
  caller: string;
  'new-balance': bigint | number;
}

export interface TreasuryWithdrawalEvent {
  event: 'treasury-withdrawal';
  amount: bigint | number;
  recipient: string;
  admin: string;
  'new-balance': bigint | number;
}

export interface TreasuryDistributionEvent {
  event: 'treasury-distribution';
  amount: bigint | number;
  recipient: string;
  admin: string;
  'new-balance': bigint | number;
}

export interface TreasuryFeeUpdatedEvent {
  event: 'treasury-fee-updated';
  'old-fee-bps': bigint | number;
  'new-fee-bps': bigint | number;
  admin: string;
}

export interface AdminTransferProposedEvent {
  event: 'treasury-admin-transfer-proposed';
  'current-admin': string;
  'new-admin': string;
  'proposed-at': bigint | number;
}

export interface AdminTransferCompletedEvent {
  event: 'treasury-admin-transfer-completed';
  'old-admin': string;
  'new-admin': string;
  'completed-at': bigint | number;
}

export interface AdminTransferCancelledEvent {
  event: 'treasury-admin-transfer-cancelled';
  admin: string;
  'cancelled-at': bigint | number;
}

export interface WithdrawalProposedEvent {
  event: 'treasury-withdrawal-proposed';
  'proposal-id': bigint | number;
  proposer: string;
  recipient: string;
  amount: bigint | number;
  'proposed-at': bigint | number;
  'timelock-expires': bigint | number;
}

export interface WithdrawalApprovedEvent {
  event: 'treasury-withdrawal-approved';
  'proposal-id': bigint | number;
  approver: string;
  'approval-count': bigint | number;
}

export interface WithdrawalExecutedEvent {
  event: 'treasury-withdrawal-executed';
  'proposal-id': bigint | number;
  recipient: string;
  amount: bigint | number;
  'executed-at': bigint | number;
}

export interface AddAdminProposedEvent {
  event: 'treasury-add-admin-proposed';
  'proposal-id': bigint | number;
  proposer: string;
  'new-admin': string;
  'proposed-at': bigint | number;
}

export interface RemoveAdminProposedEvent {
  event: 'treasury-remove-admin-proposed';
  'proposal-id': bigint | number;
  proposer: string;
  'admin-to-remove': string;
  'proposed-at': bigint | number;
}

export interface AdminProposalApprovedEvent {
  event: 'treasury-admin-proposal-approved';
  'proposal-id': bigint | number;
  approver: string;
  'approval-count': bigint | number;
}

export interface AdminProposalExecutedEvent {
  event: 'treasury-admin-proposal-executed';
  'proposal-id': bigint | number;
  'proposal-type': string;
  'executed-at': bigint | number;
}

export type TreasuryEvent =
  | FeeCollectedEvent
  | CancellationFeeCollectedEvent
  | MarketplaceFeeCollectedEvent
  | TreasuryWithdrawalEvent
  | TreasuryDistributionEvent
  | TreasuryFeeUpdatedEvent
  | AdminTransferProposedEvent
  | AdminTransferCompletedEvent
  | AdminTransferCancelledEvent
  | WithdrawalProposedEvent
  | WithdrawalApprovedEvent
  | WithdrawalExecutedEvent
  | AddAdminProposedEvent
  | RemoveAdminProposedEvent
  | AdminProposalApprovedEvent
  | AdminProposalExecutedEvent;

// ============================================================================
// BitPay Access Control Events
// ============================================================================

export interface AdminAddedEvent {
  event: 'access-admin-added';
  admin: string;
  'added-by': string;
}

export interface AdminRemovedEvent {
  event: 'access-admin-removed';
  admin: string;
  'removed-by': string;
}

export interface OperatorAddedEvent {
  event: 'access-operator-added';
  operator: string;
  'added-by': string;
}

export interface OperatorRemovedEvent {
  event: 'access-operator-removed';
  operator: string;
  'removed-by': string;
}

export interface ContractAuthorizedEvent {
  event: 'access-contract-authorized';
  contract: string;
  'authorized-by': string;
}

export interface ContractRevokedEvent {
  event: 'access-contract-revoked';
  contract: string;
  'revoked-by': string;
}

export interface ProtocolPausedEvent {
  event: 'access-protocol-paused';
  'paused-by': string;
  'paused-at': bigint | number;
}

export interface ProtocolUnpausedEvent {
  event: 'access-protocol-unpaused';
  'unpaused-by': string;
  'unpaused-at': bigint | number;
}

export interface AccessControlAdminTransferInitiatedEvent {
  event: 'access-admin-transfer-initiated';
  'current-admin': string;
  'new-admin': string;
  'initiated-at': bigint | number;
}

export interface AccessControlAdminTransferCompletedEvent {
  event: 'access-admin-transfer-completed';
  'old-admin': string;
  'new-admin': string;
  'completed-at': bigint | number;
}

export type AccessControlEvent =
  | AdminAddedEvent
  | AdminRemovedEvent
  | OperatorAddedEvent
  | OperatorRemovedEvent
  | ContractAuthorizedEvent
  | ContractRevokedEvent
  | ProtocolPausedEvent
  | ProtocolUnpausedEvent
  | AccessControlAdminTransferInitiatedEvent
  | AccessControlAdminTransferCompletedEvent;

// ============================================================================
// NFT Events
// ============================================================================

export interface ObligationTransferredEvent {
  event: 'obligation-transferred';
  'token-id': bigint | number;
  from: string;
  to: string;
}

export interface ObligationMintedEvent {
  event: 'obligation-minted';
  'token-id': bigint | number;
  recipient: string;
}

export type NFTEvent = ObligationTransferredEvent | ObligationMintedEvent;

// ============================================================================
// Union Type for All Events
// ============================================================================

export type BitPayEvent =
  | CoreStreamEvent
  | MarketplaceEvent
  | TreasuryEvent
  | AccessControlEvent
  | NFTEvent;

// ============================================================================
// Webhook Processing Context
// ============================================================================

export interface WebhookContext {
  txHash: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  sender: string;
  contractIdentifier: string;
}

export interface ProcessedWebhookResult {
  success: boolean;
  eventType: string;
  processed: number;
  errors?: string[];
}
