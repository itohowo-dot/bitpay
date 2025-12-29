/**
 * Notification Service
 * Handles creating and sending both in-app and email notifications
 */

import connectToDatabase from '@/lib/db';
import { clientPromise } from '@/lib/db';
import * as EmailService from '@/lib/email/email-service';
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationData,
  NotificationPreferences,
  StreamCreatedEmailData,
  StreamWithdrawalEmailData,
  StreamCancelledEmailData,
  PurchaseCompletedEmailData,
  SaleCompletedEmailData,
  WithdrawalProposedEmailData,
  SecurityAlertEmailData,
} from '@/types/notification';

// ============================================================================
// Notification Creation
// ============================================================================

/**
 * Create a notification in the database
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: NotificationData,
  options: {
    priority?: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
  } = {}
): Promise<Notification> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection failed');
  }

  const notification: any = {
    userId,
    type,
    priority: options.priority || 'normal',
    status: 'unread',
    title,
    message,
    data,
    actionUrl: options.actionUrl,
    actionText: options.actionText,
    emailSent: false,
    createdAt: new Date(),
    expiresAt: options.expiresAt,
  };

  const result = await db.collection('notifications').insertOne(notification);
  notification._id = result.insertedId.toString();

  console.log(`✅ Created notification for ${userId}: ${type}`);

  return notification as Notification;
}

/**
 * Get user's notification preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection('users').findOne({ address: userId });

  // Return default preferences if not set
  return (
    user?.notificationPreferences || {
      userId,
      emailAddress: user?.email || '',
      emailVerified: false,
      inApp: {
        streams: true,
        marketplace: true,
        treasury: true,
        security: true,
        system: true,
      },
      emailNotifications: {
        streams: true,
        marketplace: true,
        treasury: true,
        security: true,
        system: true,
        digest: false,
      },
      updatedAt: new Date(),
    }
  );
}

/**
 * Update user's notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const client = await clientPromise;
  const db = client.db();

  // Get current preferences
  const currentPreferences = await getUserPreferences(userId);

  // Merge with updates
  const newPreferences: NotificationPreferences = {
    ...currentPreferences,
    ...updates,
    userId, // Ensure userId is set
    inApp: {
      ...currentPreferences.inApp,
      ...(updates.inApp || {}),
    },
    emailNotifications: {
      ...currentPreferences.emailNotifications,
      ...(updates.emailNotifications || {}),
    },
    updatedAt: new Date(),
  };

  // Update in database
  await db
    .collection('users')
    .updateOne(
      { address: userId },
      { $set: { notificationPreferences: newPreferences } },
      { upsert: true }
    );

  return newPreferences;
}

/**
 * Should send email based on user preferences
 */
function shouldSendEmail(
  type: NotificationType,
  prefs: NotificationPreferences | null
): boolean {
  if (!prefs || !prefs.emailAddress || !prefs.emailVerified) {
    return false;
  }

  // Map notification types to categories
  if (type.startsWith('stream_')) {
    return prefs.emailNotifications.streams;
  }

  if (
    type.includes('purchase') ||
    type.includes('sale') ||
    type.includes('listing')
  ) {
    return prefs.emailNotifications.marketplace;
  }

  if (type.includes('withdrawal') || type.includes('admin_action')) {
    return prefs.emailNotifications.treasury;
  }

  if (type.includes('protocol') || type.includes('security')) {
    return prefs.emailNotifications.security;
  }

  return prefs.emailNotifications.system;
}

// ============================================================================
// Stream Notifications
// ============================================================================

export async function notifyStreamCreated(data: {
  streamId: string;
  sender: string;
  recipient: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  txHash: string;
  senderEmail?: string;
  recipientEmail?: string;
}) {
  // Notify recipient
  const recipientNotification = await createNotification(
    data.recipient,
    'stream_received',
    '💰 New Payment Stream Received',
    `You've received a new payment stream of ${data.amount} sBTC from ${data.sender.substring(0, 8)}...`,
    {
      streamId: data.streamId,
      sender: data.sender,
      amount: data.amount,
      txHash: data.txHash,
    },
    {
      priority: 'high',
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Stream',
    }
  );

  // Send email to recipient if preferences allow
  const recipientPrefs = await getUserPreferences(data.recipient);
  if (shouldSendEmail('stream_received', recipientPrefs) && recipientPrefs?.emailAddress) {
    await EmailService.sendStreamCreatedEmail(recipientPrefs.emailAddress, {
      recipientAddress: data.recipient,
      senderAddress: data.sender,
      amount: data.amount,
      startBlock: data.startBlock,
      endBlock: data.endBlock,
      streamId: data.streamId,
      txHash: data.txHash,
    });

    // Mark email as sent
    await markEmailSent(recipientNotification._id!);
  }

  // Notify sender (confirmation)
  await createNotification(
    data.sender,
    'stream_created',
    '✅ Stream Created Successfully',
    `Your payment stream of ${data.amount} sBTC to ${data.recipient.substring(0, 8)}... is now active.`,
    {
      streamId: data.streamId,
      recipient: data.recipient,
      amount: data.amount,
      txHash: data.txHash,
    },
    {
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Stream',
    }
  );
}

export async function notifyStreamWithdrawal(data: {
  streamId: string;
  recipient: string;
  sender: string;
  amount: string;
  remainingAmount: string;
  txHash: string;
}) {
  // Notify recipient
  const recipientNotification = await createNotification(
    data.recipient,
    'stream_withdrawal',
    '💸 Withdrawal Successful',
    `You withdrew ${data.amount} sBTC from stream #${data.streamId}.`,
    {
      streamId: data.streamId,
      amount: data.amount,
      txHash: data.txHash,
    },
    {
      priority: 'normal',
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Stream',
    }
  );

  // Send email
  const recipientPrefs = await getUserPreferences(data.recipient);
  if (shouldSendEmail('stream_withdrawal', recipientPrefs) && recipientPrefs?.emailAddress) {
    await EmailService.sendStreamWithdrawalEmail(recipientPrefs.emailAddress, {
      recipientAddress: data.recipient,
      amount: data.amount,
      streamId: data.streamId,
      remainingAmount: data.remainingAmount,
      txHash: data.txHash,
    });

    await markEmailSent(recipientNotification._id!);
  }

  // Notify sender
  await createNotification(
    data.sender,
    'stream_withdrawal',
    '📤 Stream Withdrawal',
    `${data.recipient.substring(0, 8)}... withdrew ${data.amount} sBTC from stream #${data.streamId}.`,
    {
      streamId: data.streamId,
      amount: data.amount,
      recipient: data.recipient,
      txHash: data.txHash,
    },
    {
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Stream',
    }
  );
}

export async function notifyStreamCancelled(data: {
  streamId: string;
  sender: string;
  recipient: string;
  vestedPaid: string;
  unvestedReturned: string;
  txHash: string;
}) {
  // Notify recipient
  const recipientNotification = await createNotification(
    data.recipient,
    'stream_cancelled',
    '⚠️ Stream Cancelled',
    `Stream #${data.streamId} was cancelled. You received ${data.vestedPaid} sBTC (vested amount).`,
    {
      streamId: data.streamId,
      sender: data.sender,
      vestedPaid: data.vestedPaid,
      unvestedReturned: data.unvestedReturned,
      txHash: data.txHash,
    },
    {
      priority: 'high',
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Details',
    }
  );

  // Send email
  const recipientPrefs = await getUserPreferences(data.recipient);
  if (shouldSendEmail('stream_cancelled', recipientPrefs) && recipientPrefs?.emailAddress) {
    await EmailService.sendStreamCancelledEmail(recipientPrefs.emailAddress, {
      recipientAddress: data.recipient,
      senderAddress: data.sender,
      streamId: data.streamId,
      vestedPaid: data.vestedPaid,
      unvestedReturned: data.unvestedReturned,
      txHash: data.txHash,
    });

    await markEmailSent(recipientNotification._id!);
  }

  // Notify sender
  await createNotification(
    data.sender,
    'stream_cancelled',
    '✅ Stream Cancelled',
    `Stream #${data.streamId} cancelled successfully. ${data.unvestedReturned} sBTC returned.`,
    {
      streamId: data.streamId,
      recipient: data.recipient,
      vestedPaid: data.vestedPaid,
      unvestedReturned: data.unvestedReturned,
      txHash: data.txHash,
    },
    {
      actionUrl: `/dashboard/streams`,
      actionText: 'View Streams',
    }
  );
}

// ============================================================================
// Marketplace Notifications
// ============================================================================

export async function notifyPurchaseCompleted(data: {
  streamId: string;
  buyer: string;
  seller: string;
  price: string;
  marketplaceFee: string;
  saleId: string;
  txHash: string;
}) {
  const netAmount = (
    parseFloat(data.price) - parseFloat(data.marketplaceFee)
  ).toFixed(8);

  // Notify buyer
  const buyerNotification = await createNotification(
    data.buyer,
    'purchase_completed',
    '🎉 Purchase Successful!',
    `You purchased stream #${data.streamId} for ${data.price} sBTC.`,
    {
      streamId: data.streamId,
      seller: data.seller,
      price: data.price,
      saleId: data.saleId,
      txHash: data.txHash,
    },
    {
      priority: 'high',
      actionUrl: `/dashboard/streams/${data.streamId}`,
      actionText: 'View Stream',
    }
  );

  // Send email to buyer
  const buyerPrefs = await getUserPreferences(data.buyer);
  if (shouldSendEmail('purchase_completed', buyerPrefs) && buyerPrefs?.emailAddress) {
    await EmailService.sendPurchaseCompletedEmail(buyerPrefs.emailAddress, {
      buyerAddress: data.buyer,
      sellerAddress: data.seller,
      streamId: data.streamId,
      price: data.price,
      marketplaceFee: data.marketplaceFee,
      netAmount,
      saleId: data.saleId,
      txHash: data.txHash,
    });

    await markEmailSent(buyerNotification._id!);
  }

  // Notify seller
  const sellerNotification = await createNotification(
    data.seller,
    'sale_completed',
    '💸 Stream Sold!',
    `Your stream #${data.streamId} sold for ${data.price} sBTC. You received ${netAmount} sBTC.`,
    {
      streamId: data.streamId,
      buyer: data.buyer,
      price: data.price,
      saleId: data.saleId,
      txHash: data.txHash,
    },
    {
      priority: 'high',
      actionUrl: `/dashboard/marketplace/sales`,
      actionText: 'View Sales',
    }
  );

  // Send email to seller
  const sellerPrefs = await getUserPreferences(data.seller);
  if (shouldSendEmail('sale_completed', sellerPrefs) && sellerPrefs?.emailAddress) {
    await EmailService.sendSaleCompletedEmail(sellerPrefs.emailAddress, {
      sellerAddress: data.seller,
      buyerAddress: data.buyer,
      streamId: data.streamId,
      price: data.price,
      marketplaceFee: data.marketplaceFee,
      netAmount,
      saleId: data.saleId,
      txHash: data.txHash,
    });

    await markEmailSent(sellerNotification._id!);
  }
}

// ============================================================================
// Treasury Notifications
// ============================================================================

export async function notifyWithdrawalProposal(data: {
  proposalId: string;
  proposer: string;
  recipient: string;
  amount: string;
  timelockExpires: string;
  requiredApprovals: number;
  currentApprovals: number;
  adminList: string[];
  txHash: string;
}) {
  // Notify all admins except proposer
  for (const admin of data.adminList) {
    if (admin === data.proposer) continue;

    const notification = await createNotification(
      admin,
      'admin_action_required',
      '🏦 New Withdrawal Proposal',
      `A withdrawal of ${data.amount} sBTC requires your approval.`,
      {
        proposalId: data.proposalId,
        proposer: data.proposer,
        recipient: data.recipient,
        amount: data.amount,
        approvalCount: data.currentApprovals,
        txHash: data.txHash,
      },
      {
        priority: 'urgent',
        actionUrl: `/dashboard/treasury`,
        actionText: 'Review & Vote',
      }
    );

    // Send email
    const adminPrefs = await getUserPreferences(admin);
    if (shouldSendEmail('admin_action_required', adminPrefs) && adminPrefs?.emailAddress) {
      await EmailService.sendWithdrawalProposalEmail(adminPrefs.emailAddress, {
        proposalId: data.proposalId,
        recipient: data.recipient,
        amount: data.amount,
        proposedBy: data.proposer,
        timelockExpires: data.timelockExpires,
        requiredApprovals: data.requiredApprovals,
        currentApprovals: data.currentApprovals,
        txHash: data.txHash,
      });

      await markEmailSent(notification._id!);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

async function markEmailSent(notificationId: string): Promise<void> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    return;
  }

  await db.collection('notifications').updateOne(
    { _id: notificationId } as any,
    {
      $set: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    }
  );
}

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    return false;
  }

  const result = await db.collection('notifications').updateOne(
    { _id: notificationId, userId } as any,
    {
      $set: {
        status: 'read',
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Get user's unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    return 0;
  }

  return await db
    .collection('notifications')
    .countDocuments({ userId, status: 'unread' });
}

/**
 * Get user's notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    skip?: number;
    status?: 'unread' | 'read' | 'archived';
  } = {}
): Promise<Notification[]> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    return [];
  }

  const query: any = { userId };
  if (options.status) {
    query.status = options.status;
  }

  const notifications = await db
    .collection('notifications')
    .find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20)
    .toArray();

  return notifications as unknown as Notification[];
}
