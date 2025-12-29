/**
 * Notification system types
 * Supports both in-app and email notifications
 */

export type NotificationType =
  // Stream notifications
  | 'stream_created'
  | 'stream_received'
  | 'stream_withdrawal'
  | 'stream_cancelled'
  | 'stream_sender_updated'
  // Marketplace notifications
  | 'listing_created'
  | 'purchase_initiated'
  | 'purchase_completed'
  | 'purchase_received'
  | 'purchase_expired'
  | 'purchase_failed'
  | 'purchase_cancelled'
  | 'sale_completed'
  | 'nft_listed'
  | 'listing_updated'
  | 'listing_cancelled'
  // Treasury notifications
  | 'fee_collected'
  | 'withdrawal_proposed'
  | 'withdrawal_approved'
  | 'withdrawal_executed'
  | 'admin_action_required'
  | 'treasury_withdrawal'
  | 'treasury_distribution'
  // Access control notifications
  | 'protocol_paused'
  | 'protocol_unpaused'
  | 'admin_transfer'
  | 'admin_added'
  | 'admin_removed'
  | 'operator_added'
  | 'operator_removed'
  // System notifications
  | 'system_announcement'
  | 'security_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationData {
  // Stream data
  streamId?: string;
  amount?: string;
  recipient?: string;
  sender?: string;
  startBlock?: string;
  endBlock?: string;

  // Marketplace data
  saleId?: string;
  price?: string;
  paymentId?: string;
  buyer?: string;
  seller?: string;

  // Treasury data
  proposalId?: string;
  proposer?: string;
  approvalCount?: number;

  // Transaction data
  txHash?: string;
  blockHeight?: number;

  // Generic data
  [key: string]: any;
}

export interface Notification {
  _id?: string;
  userId: string; // Principal address
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  data: NotificationData;
  actionUrl?: string; // Where to navigate when clicked
  actionText?: string; // CTA button text
  emailSent?: boolean;
  emailSentAt?: Date;
  readAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  expiresAt?: Date; // Optional expiration for time-sensitive notifications
}

export interface NotificationPreferences {
  userId: string;
  emailAddress?: string;
  emailVerified: boolean;
  
  // In-app notification preferences
  inApp: {
    streams: boolean;
    marketplace: boolean;
    treasury: boolean;
    security: boolean;
    system: boolean;
  };
  
  // Email notification preferences
  emailNotifications: {
    streams: boolean;
    marketplace: boolean;
    treasury: boolean;
    security: boolean;
    system: boolean;
    digest: boolean; // Daily/weekly digest
    digestFrequency?: 'daily' | 'weekly';
  };
  
  updatedAt: Date;
}

// Email template data interfaces
export interface StreamCreatedEmailData {
  recipientName: string;
  recipientAddress: string;
  senderAddress: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  streamId: string;
  dashboardUrl: string;
  txHash: string;
}

export interface StreamWithdrawalEmailData {
  recipientName: string;
  recipientAddress: string;
  amount: string;
  streamId: string;
  remainingAmount: string;
  dashboardUrl: string;
  txHash: string;
}

export interface StreamCancelledEmailData {
  recipientName: string;
  senderName: string;
  streamId: string;
  vestedPaid: string;
  unvestedReturned: string;
  dashboardUrl: string;
  txHash: string;
}

export interface PurchaseCompletedEmailData {
  buyerName: string;
  buyerAddress: string;
  sellerAddress: string;
  streamId: string;
  price: string;
  marketplaceFee: string;
  netAmount: string;
  saleId: string;
  dashboardUrl: string;
  txHash: string;
}

export interface SaleCompletedEmailData {
  sellerAddress: string;
  buyerAddress: string;
  streamId: string;
  price: string;
  marketplaceFee: string;
  netAmount: string;
  saleId: string;
  txHash: string;
}

export interface WithdrawalProposedEmailData {
  adminName: string;
  proposalId: string;
  recipient: string;
  amount: string;
  proposedBy: string;
  timelockExpires: string;
  requiredApprovals: number;
  currentApprovals: number;
  dashboardUrl: string;
  txHash: string;
}

export interface SecurityAlertEmailData {
  userName: string;
  alertType: string;
  alertMessage: string;
  timestamp: string;
  action: string;
  dashboardUrl: string;
}
