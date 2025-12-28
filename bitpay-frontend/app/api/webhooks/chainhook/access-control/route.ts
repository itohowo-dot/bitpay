/**
 * POST /api/webhooks/chainhook/access-control
 * Handles BitPay Access Control events from Chainhook
 * Events: contract-authorized, protocol-paused, admin-transfer
 */

import { NextResponse } from 'next/server';
import type {
  ChainhookPayload,
  ChainhookBlock,
  AccessControlEvent,
} from '@/types/chainhook';
import {
  verifyWebhookAuth,
  errorResponse,
  successResponse,
  extractPrintEvents,
  parseEventData,
  getWebhookContext,
  logWebhookEvent,
  handleReorg,
  validatePayload,
  webhookRateLimiter,
} from '@/lib/webhooks/chainhook-utils';
import connectToDatabase from '@/lib/db';
import * as NotificationService from '@/lib/notifications/notification-service';
import { broadcastToUser } from '@/lib/socket/server';

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 'chainhook';
    if (!webhookRateLimiter.check(clientId)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    // Verify authorization
    const authResult = verifyWebhookAuth(request);
    if (!authResult.valid) {
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    // Parse and validate payload
    const payload: ChainhookPayload = await request.json();
    if (!validatePayload(payload)) {
      return errorResponse('Invalid payload structure', 400);
    }

    console.log('📨 Access control events webhook received:', {
      apply: payload.apply?.length || 0,
      rollback: payload.rollback?.length || 0,
      uuid: payload.chainhook?.uuid,
    });

    let processedCount = 0;
    const errors: string[] = [];

    // Handle rollbacks
    if (payload.rollback && payload.rollback.length > 0) {
      console.warn('⚠️ Rollback detected:', payload.rollback.length, 'blocks');
      const result = await handleReorg(payload.rollback);
      if (!result.success && result.errors) {
        errors.push(...result.errors);
      }
    }

    // Process new blocks
    if (payload.apply && payload.apply.length > 0) {
      for (const block of payload.apply) {
        try {
          const blockResult = await processAccessControlBlock(block);
          processedCount += blockResult;
        } catch (error) {
          const errorMsg = `Failed to process block ${block.block_identifier.index}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    return successResponse({
      success: errors.length === 0,
      eventType: 'access-control-events',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Access control webhook error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
}

/**
 * Process a single block for access control events
 */
async function processAccessControlBlock(block: ChainhookBlock): Promise<number> {
  let processed = 0;

  console.log(`🔐 Processing access control events from block ${block.block_identifier.index}`);

  for (const tx of block.transactions) {
    if (!tx.metadata.success) {
      continue;
    }

    const printEvents = extractPrintEvents(tx);

    for (const event of printEvents) {
      const eventData = parseEventData<AccessControlEvent>(event);
      if (!eventData) {
        continue;
      }

      const context = getWebhookContext(tx, block);
      context.contractIdentifier = event.data.contract_identifier;

      logWebhookEvent(eventData.event, eventData, context);

      // Handle critical security events
      await handleAccessControlEvent(eventData, context);
      processed++;
    }
  }

  return processed;
}

/**
 * Handle access control events
 */
async function handleAccessControlEvent(
  event: AccessControlEvent,
  context: any
): Promise<void> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  switch (event.event) {
    case 'access-admin-added':
      const mongoose1 = await connectToDatabase();
      const db1 = mongoose1.connection.db;
      if (db1) {
        await db1.collection('access_control_events').insertOne({
          type: 'admin-added',
          admin: event.admin,
          addedBy: event['added-by'],
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });
        await NotificationService.createNotification(
          event.admin,
          'admin_added',
          '👑 Admin Role Granted',
          `You have been granted admin privileges by ${event['added-by'].slice(0, 8)}...`,
          { addedBy: event['added-by'], txHash: context.txHash },
          { priority: 'high' }
        );

        // Broadcast real-time update
        broadcastToUser(event.admin, 'access-control:role-changed', {
          type: 'admin-added',
          data: {
            admin: event.admin,
            addedBy: event['added-by'],
            txHash: context.txHash,
          },
        });
      }
      break;

    case 'access-admin-removed':
      const mongoose2 = await connectToDatabase();
      const db2 = mongoose2.connection.db;
      if (db2) {
        await db2.collection('access_control_events').insertOne({
          type: 'admin-removed',
          admin: event.admin,
          removedBy: event['removed-by'],
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });
        await NotificationService.createNotification(
          event.admin,
          'admin_removed',
          '⚠️ Admin Role Revoked',
          `Your admin privileges have been revoked by ${event['removed-by'].slice(0, 8)}...`,
          { removedBy: event['removed-by'], txHash: context.txHash },
          { priority: 'urgent' }
        );

        // Broadcast real-time update
        broadcastToUser(event.admin, 'access-control:role-changed', {
          type: 'admin-removed',
          data: {
            admin: event.admin,
            removedBy: event['removed-by'],
            txHash: context.txHash,
          },
        });
      }
      break;

    case 'access-operator-added':
      const mongoose3 = await connectToDatabase();
      const db3 = mongoose3.connection.db;
      if (db3) {
        await db3.collection('access_control_events').insertOne({
          type: 'operator-added',
          operator: event.operator,
          addedBy: event['added-by'],
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });
        await NotificationService.createNotification(
          event.operator,
          'operator_added',
          '🔧 Operator Role Granted',
          `You have been granted operator privileges by ${event['added-by'].slice(0, 8)}...`,
          { addedBy: event['added-by'], txHash: context.txHash },
          { priority: 'normal' }
        );

        // Broadcast real-time update
        broadcastToUser(event.operator, 'access-control:role-changed', {
          type: 'operator-added',
          data: {
            operator: event.operator,
            addedBy: event['added-by'],
            txHash: context.txHash,
          },
        });
      }
      break;

    case 'access-operator-removed':
      const mongoose4 = await connectToDatabase();
      const db4 = mongoose4.connection.db;
      if (db4) {
        await db4.collection('access_control_events').insertOne({
          type: 'operator-removed',
          operator: event.operator,
          removedBy: event['removed-by'],
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });
        await NotificationService.createNotification(
          event.operator,
          'operator_removed',
          '⚠️ Operator Role Revoked',
          `Your operator privileges have been revoked by ${event['removed-by'].slice(0, 8)}...`,
          { removedBy: event['removed-by'], txHash: context.txHash },
          { priority: 'normal' }
        );

        // Broadcast real-time update
        broadcastToUser(event.operator, 'access-control:role-changed', {
          type: 'operator-removed',
          data: {
            operator: event.operator,
            removedBy: event['removed-by'],
            txHash: context.txHash,
          },
        });
      }
      break;

    case 'access-contract-authorized':
      console.log(`✅ Contract authorized: ${event.contract}`);

      // Update authorized contracts list
      if (db) {
        await db.collection('authorized_contracts').insertOne({
          contract: event.contract,
          authorizedBy: event['authorized-by'],
          authorizedAt: new Date(context.timestamp * 1000),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          status: 'active',
        });
      }

      // Send alert to admins
      const admins = await getAdminList(db);
      const contractAuthData = {
        contract: event.contract,
        authorizedBy: event['authorized-by'],
        txHash: context.txHash,
      };

      for (const admin of admins) {
        await NotificationService.createNotification(
          admin,
          'security_alert',
          '✅ Contract Authorized',
          `Contract ${event.contract} has been authorized by ${event['authorized-by']}.`,
          {
            contract: event.contract,
            authorizedBy: event['authorized-by'],
            txHash: context.txHash,
          },
          {
            priority: 'high',
            actionUrl: `/dashboard/admin/access-control`,
            actionText: 'View Details',
          }
        );

        // Broadcast to each admin
        broadcastToUser(admin, 'access-control:contract', {
          type: 'contract-authorized',
          data: contractAuthData,
        });
      }
      break;

    case 'access-contract-revoked':
      console.log(`❌ Contract revoked: ${event.contract}`);

      // Update authorized contracts list
      if (db) {
        await db.collection('authorized_contracts').updateOne(
          { contract: event.contract, status: 'active' },
          {
            $set: {
              status: 'revoked',
              revokedBy: event['revoked-by'],
              revokedAt: new Date(context.timestamp * 1000),
              revokeTxHash: context.txHash,
            },
          }
        );
      }

      // Send critical alert to admins
      const adminList = await getAdminList(db);
      const contractRevokeData = {
        contract: event.contract,
        revokedBy: event['revoked-by'],
        txHash: context.txHash,
      };

      for (const admin of adminList) {
        await NotificationService.createNotification(
          admin,
          'security_alert',
          '🚨 Contract Revoked',
          `Contract ${event.contract} has been REVOKED by ${event['revoked-by']}.`,
          {
            contract: event.contract,
            revokedBy: event['revoked-by'],
            txHash: context.txHash,
          },
          {
            priority: 'urgent',
            actionUrl: `/dashboard/admin/access-control`,
            actionText: 'Review Now',
          }
        );

        // Broadcast to each admin
        broadcastToUser(admin, 'access-control:contract', {
          type: 'contract-revoked',
          data: contractRevokeData,
        });
      }
      break;

    case 'access-protocol-paused':
      console.warn(`⚠️ PROTOCOL PAUSED by ${event['paused-by']}`);

      // Update system status
      if (db) {
        await db.collection('system_status').updateOne(
          { key: 'protocol_status' },
          {
            $set: {
              paused: true,
              pausedBy: event['paused-by'],
              pausedAt: new Date(context.timestamp * 1000),
              txHash: context.txHash,
            },
          },
          { upsert: true }
        );
      }

      // Send emergency alerts to all admins
      const allAdmins = await getAdminList(db);
      const pauseData = {
        pausedBy: event['paused-by'],
        pausedAt: event['paused-at'].toString(),
        txHash: context.txHash,
      };

      for (const admin of allAdmins) {
        await NotificationService.createNotification(
          admin,
          'protocol_paused',
          '🚨 PROTOCOL PAUSED',
          `The protocol has been PAUSED by ${event['paused-by']}. All transactions are now halted.`,
          {
            pausedBy: event['paused-by'],
            txHash: context.txHash,
          },
          {
            priority: 'urgent',
            actionUrl: `/dashboard/admin/access-control`,
            actionText: 'View Status',
          }
        );

        // Broadcast critical alert to each admin
        broadcastToUser(admin, 'access-control:protocol', {
          type: 'protocol-paused',
          data: pauseData,
        });
      }
      break;

    case 'access-protocol-unpaused':
      console.log(`✅ Protocol unpaused by ${event['unpaused-by']}`);

      // Update system status
      if (db) {
        await db.collection('system_status').updateOne(
          { key: 'protocol_status' },
          {
            $set: {
              paused: false,
              unpausedBy: event['unpaused-by'],
              unpausedAt: new Date(context.timestamp * 1000),
              txHash: context.txHash,
            },
          },
          { upsert: true }
        );
      }

      // Send notifications to all admins
      const adminsList = await getAdminList(db);
      const unpauseData = {
        unpausedBy: event['unpaused-by'],
        unpausedAt: event['unpaused-at'].toString(),
        txHash: context.txHash,
      };

      for (const admin of adminsList) {
        await NotificationService.createNotification(
          admin,
          'protocol_unpaused',
          '✅ Protocol Resumed',
          `The protocol has been unpaused by ${event['unpaused-by']}. Normal operations have resumed.`,
          {
            unpausedBy: event['unpaused-by'],
            txHash: context.txHash,
          },
          {
            priority: 'high',
            actionUrl: `/dashboard/admin/access-control`,
            actionText: 'View Status',
          }
        );

        // Broadcast to each admin
        broadcastToUser(admin, 'access-control:protocol', {
          type: 'protocol-unpaused',
          data: unpauseData,
        });
      }
      break;

    case 'access-admin-transfer-initiated':
      console.log(`🔑 Admin transfer initiated: ${event['current-admin']} → ${event['new-admin']}`);

      // Notify current admin
      await NotificationService.createNotification(
        event['current-admin'],
        'admin_transfer',
        '🔄 Admin Transfer Initiated',
        `You have initiated admin transfer to ${event['new-admin']}. The new admin must accept within the timelock period.`,
        {
          newAdmin: event['new-admin'],
          txHash: context.txHash,
        },
        {
          priority: 'high',
          actionUrl: `/dashboard/admin/access-control`,
          actionText: 'View Transfer',
        }
      );

      // Notify new admin
      await NotificationService.createNotification(
        event['new-admin'],
        'admin_transfer',
        '🎁 Admin Transfer Pending',
        `${event['current-admin']} has initiated admin transfer to you. Please accept to complete the transfer.`,
        {
          currentAdmin: event['current-admin'],
          txHash: context.txHash,
        },
        {
          priority: 'urgent',
          actionUrl: `/dashboard/admin/access-control`,
          actionText: 'Accept Transfer',
        }
      );

      // Broadcast real-time updates
      const transferInitiatedData = {
        currentAdmin: event['current-admin'],
        newAdmin: event['new-admin'],
        txHash: context.txHash,
      };

      // Notify current admin
      broadcastToUser(event['current-admin'], 'access-control:admin-transfer', {
        type: 'admin-transfer-initiated',
        role: 'current-admin',
        data: transferInitiatedData,
      });

      // Notify new admin
      broadcastToUser(event['new-admin'], 'access-control:admin-transfer', {
        type: 'admin-transfer-initiated',
        role: 'new-admin',
        data: transferInitiatedData,
      });
      break;

    case 'access-admin-transfer-completed':
      console.log(`✅ Admin transfer completed: ${event['old-admin']} → ${event['new-admin']}`);

      // Update admin records
      if (db) {
        await db.collection('admin_history').insertOne({
          oldAdmin: event['old-admin'],
          newAdmin: event['new-admin'],
          transferredAt: new Date(context.timestamp * 1000),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
        });
      }

      // Send confirmation to both
      await NotificationService.createNotification(
        event['old-admin'],
        'admin_transfer',
        '✅ Admin Transfer Complete',
        `Admin transfer to ${event['new-admin']} has been completed.`,
        {
          newAdmin: event['new-admin'],
          txHash: context.txHash,
        },
        {
          priority: 'normal',
          actionUrl: `/dashboard`,
          actionText: 'Go to Dashboard',
        }
      );

      await NotificationService.createNotification(
        event['new-admin'],
        'admin_transfer',
        '🎉 You are now Admin',
        `Admin transfer from ${event['old-admin']} is complete. You now have full admin privileges.`,
        {
          oldAdmin: event['old-admin'],
          txHash: context.txHash,
        },
        {
          priority: 'high',
          actionUrl: `/dashboard/admin`,
          actionText: 'Manage System',
        }
      );

      // Broadcast real-time updates
      const transferCompletedData = {
        oldAdmin: event['old-admin'],
        newAdmin: event['new-admin'],
        txHash: context.txHash,
      };

      // Notify old admin
      broadcastToUser(event['old-admin'], 'access-control:admin-transfer', {
        type: 'admin-transfer-completed',
        role: 'old-admin',
        data: transferCompletedData,
      });

      // Notify new admin
      broadcastToUser(event['new-admin'], 'access-control:admin-transfer', {
        type: 'admin-transfer-completed',
        role: 'new-admin',
        data: transferCompletedData,
      });
      break;

    default:
      console.warn(`Unknown access control event: ${(event as any).event}`);
  }
}

/**
 * Get list of admin addresses
 */
async function getAdminList(db: any): Promise<string[]> {
  // Fetch from database or configuration
  // For now, return empty array if no DB
  if (!db) return [];

  const adminsDoc = await db.collection('system_config').findOne({ key: 'admins' });
  if (adminsDoc && adminsDoc.addresses) {
    return adminsDoc.addresses;
  }

  // Fallback: get from environment or contract
  const defaultAdmin = process.env.NEXT_PUBLIC_BITPAY_DEPLOYER_ADDRESS;
  return defaultAdmin ? [defaultAdmin] : [];
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BitPay Access Control Events webhook endpoint',
    status: 'active',
    events: [
      'access-contract-authorized',
      'access-contract-revoked',
      'access-protocol-paused',
      'access-protocol-unpaused',
      'access-admin-transfer-initiated',
      'access-admin-transfer-completed',
    ],
  });
}
