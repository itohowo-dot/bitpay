/**
 * POST /api/webhooks/chainhook/treasury
 * Handles BitPay Treasury multi-sig events from Chainhook
 * Events: fee-collected, withdrawal-proposed/approved/executed, admin-proposals
 */

import { NextResponse } from 'next/server';
import type {
  ChainhookPayload,
  ChainhookBlock,
  TreasuryEvent,
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
import {
  saveFeeCollected,
  saveWithdrawalProposal,
  saveWithdrawalApproval,
} from '@/lib/webhooks/database-handlers';
import { notifyWithdrawalProposal } from '@/lib/notifications/notification-service';
import connectToDatabase from '@/lib/db';
import * as NotificationService from '@/lib/notifications/notification-service';
import {
  fetchCallReadOnlyFunction,
  cvToValue,
  uintCV,
} from '@stacks/transactions';
import { getStacksNetwork, BITPAY_DEPLOYER_ADDRESS, CONTRACT_NAMES } from '@/lib/contracts/config';
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

    console.log('📨 Treasury events webhook received:', {
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
          const blockResult = await processTreasuryBlock(block);
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
      eventType: 'treasury-events',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Treasury webhook error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
}

/**
 * Process a single block for treasury events
 */
async function processTreasuryBlock(block: ChainhookBlock): Promise<number> {
  let processed = 0;

  console.log(`🏦 Processing treasury events from block ${block.block_identifier.index}`);

  for (const tx of block.transactions) {
    if (!tx.metadata.success) {
      continue;
    }

    const printEvents = extractPrintEvents(tx);

    for (const event of printEvents) {
      const eventData = parseEventData<TreasuryEvent>(event);
      if (!eventData) {
        continue;
      }

      const context = getWebhookContext(tx, block);
      context.contractIdentifier = event.data.contract_identifier;

      try {
        await handleTreasuryEvent(eventData, context);
        processed++;
      } catch (error) {
        console.error(`Failed to handle event ${eventData.event}:`, error);
        throw error;
      }
    }
  }

  return processed;
}

/**
 * Route treasury events to appropriate handlers
 */
async function handleTreasuryEvent(
  event: TreasuryEvent,
  context: any
): Promise<void> {
  logWebhookEvent(event.event, event, context);

  switch (event.event) {
    case 'treasury-fee-collected':
      // General fee collection - log to database
      const mongooseF = await connectToDatabase();
      const dbF = mongooseF.connection.db;
      if (dbF) {
        await dbF.collection('treasury_fees').insertOne({
          type: 'general',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Broadcast fee collection to treasury admins
        const feeData = {
          type: 'general',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
        };

        const adminsF = await getTreasuryAdmins();
        for (const admin of adminsF) {
          broadcastToUser(admin, 'treasury:fee-collected', {
            type: 'fee-collected',
            data: feeData,
          });
        }
      }
      break;

    case 'treasury-cancellation-fee-collected':
      // Log cancellation fee - these events have caller not stream-id
      const mongooseC = await connectToDatabase();
      const dbC = mongooseC.connection.db;
      if (dbC) {
        await dbC.collection('treasury_fees').insertOne({
          type: 'cancellation',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Broadcast cancellation fee to treasury admins
        const cancelFeeData = {
          type: 'cancellation',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
        };

        const adminsC = await getTreasuryAdmins();
        for (const admin of adminsC) {
          broadcastToUser(admin, 'treasury:fee-collected', {
            type: 'cancellation-fee-collected',
            data: cancelFeeData,
          });
        }
      }
      break;

    case 'treasury-marketplace-fee-collected':
      // Log marketplace fee - these events have caller not stream-id
      const mongooseM = await connectToDatabase();
      const dbM = mongooseM.connection.db;
      if (dbM) {
        await dbM.collection('treasury_fees').insertOne({
          type: 'marketplace',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Broadcast marketplace fee to treasury admins
        const marketFeeData = {
          type: 'marketplace',
          amount: event.amount.toString(),
          caller: event.caller,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
        };

        const adminsM = await getTreasuryAdmins();
        for (const admin of adminsM) {
          broadcastToUser(admin, 'treasury:fee-collected', {
            type: 'marketplace-fee-collected',
            data: marketFeeData,
          });
        }
      }
      break;

    case 'treasury-withdrawal':
      // Admin withdrawal (not multi-sig)
      const mongoose1 = await connectToDatabase();
      const db1 = mongoose1.connection.db;

      if (db1) {
        await db1.collection('treasury_withdrawals').insertOne({
          type: 'admin-withdrawal',
          amount: event.amount.toString(),
          recipient: event.recipient,
          admin: event.admin,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Notify admin and recipient
        await NotificationService.createNotification(
          event.admin,
          'treasury_withdrawal',
          '💸 Treasury Withdrawal',
          `Withdrew ${event.amount} sats to ${event.recipient.slice(0, 8)}...`,
          { amount: event.amount.toString(), recipient: event.recipient, txHash: context.txHash },
          { priority: 'normal' }
        );

        // Broadcast real-time updates
        const withdrawalData = {
          amount: event.amount.toString(),
          recipient: event.recipient,
          admin: event.admin,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
        };

        broadcastToUser(event.admin, 'treasury:withdrawal', {
          type: 'withdrawal',
          data: withdrawalData,
        });

        broadcastToUser(event.recipient, 'treasury:withdrawal', {
          type: 'withdrawal',
          role: 'recipient',
          data: withdrawalData,
        });
      }
      break;

    case 'treasury-distribution':
      // Fee distribution to recipients
      const mongoose2 = await connectToDatabase();
      const db2 = mongoose2.connection.db;

      if (db2) {
        await db2.collection('treasury_distributions').insertOne({
          amount: event.amount.toString(),
          recipient: event.recipient,
          admin: event.admin,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Notify recipient
        await NotificationService.createNotification(
          event.recipient,
          'treasury_distribution',
          '💰 Fee Distribution Received',
          `Received ${event.amount} sats from treasury`,
          { amount: event.amount.toString(), txHash: context.txHash },
          { priority: 'normal', actionUrl: '/dashboard' }
        );

        // Broadcast real-time updates
        const distributionData = {
          amount: event.amount.toString(),
          recipient: event.recipient,
          admin: event.admin,
          newBalance: event['new-balance'].toString(),
          txHash: context.txHash,
        };

        broadcastToUser(event.recipient, 'treasury:distribution', {
          type: 'distribution',
          data: distributionData,
        });
      }
      break;

    case 'treasury-fee-updated':
      // Log fee update
      const mongoose3 = await connectToDatabase();
      const db3 = mongoose3.connection.db;

      if (db3) {
        await db3.collection('treasury_config_changes').insertOne({
          type: 'fee-updated',
          oldFeeBps: event['old-fee-bps'].toString(),
          newFeeBps: event['new-fee-bps'].toString(),
          admin: event.admin,
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          timestamp: new Date(context.timestamp * 1000),
          processedAt: new Date(),
        });

        // Broadcast fee update to treasury admins
        const feeUpdateData = {
          oldFeeBps: event['old-fee-bps'].toString(),
          newFeeBps: event['new-fee-bps'].toString(),
          admin: event.admin,
          txHash: context.txHash,
        };

        const admins3 = await getTreasuryAdmins();
        for (const admin of admins3) {
          broadcastToUser(admin, 'treasury:config-updated', {
            type: 'fee-updated',
            data: feeUpdateData,
          });
        }
      }
      break;

    case 'treasury-withdrawal-proposed':
      await saveWithdrawalProposal({
        proposalId: event['proposal-id'].toString(),
        proposer: event.proposer,
        recipient: event.recipient,
        amount: event.amount.toString(),
        proposedAt: event['proposed-at'].toString(),
        timelockExpires: event['timelock-expires'].toString(),
        context,
      });
      
      // Fetch treasury admins and threshold from contract
      const adminList = await getTreasuryAdmins();
      const proposalThreshold = await getTreasuryThreshold();

      // Notify all treasury admins about the new proposal
      await notifyWithdrawalProposal({
        proposalId: event['proposal-id'].toString(),
        proposer: event.proposer,
        recipient: event.recipient,
        amount: event.amount.toString(),
        timelockExpires: event['timelock-expires'].toString(),
        requiredApprovals: proposalThreshold,
        currentApprovals: 0,
        adminList,
        txHash: context.txHash,
      }).catch((err) => {
        console.error('Failed to send withdrawal proposal notification:', err);
      });

      // Broadcast real-time updates to all admins
      const proposalData = {
        proposalId: event['proposal-id'].toString(),
        proposer: event.proposer,
        recipient: event.recipient,
        amount: event.amount.toString(),
        proposedAt: event['proposed-at'].toString(),
        timelockExpires: event['timelock-expires'].toString(),
        txHash: context.txHash,
      };

      for (const admin of adminList) {
        broadcastToUser(admin, 'treasury:proposal', {
          type: 'withdrawal-proposed',
          data: proposalData,
        });
      }
      break;

    case 'treasury-withdrawal-approved':
      await saveWithdrawalApproval({
        proposalId: event['proposal-id'].toString(),
        approver: event.approver,
        approvalCount: event['approval-count'].toString(),
        context,
      });

      // Check if threshold reached
      const approvalThreshold = await getTreasuryThreshold();
      const approvalCount = parseInt(event['approval-count'].toString());

      if (approvalCount >= approvalThreshold) {
        // Threshold reached - notify proposer they can execute
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (db) {
          const proposal = await db.collection('treasury_proposals').findOne({
            proposalId: event['proposal-id'].toString(),
          });

          if (proposal) {
            await NotificationService.createNotification(
              proposal.proposer,
              'withdrawal_approved',
              '✅ Withdrawal Ready to Execute',
              `Proposal #${event['proposal-id']} has reached the approval threshold (${approvalCount}/${approvalThreshold}). You can now execute the withdrawal.`,
              {
                proposalId: event['proposal-id'].toString(),
                approvalCount,
                threshold: approvalThreshold,
                txHash: context.txHash,
              },
              {
                priority: 'high',
                actionUrl: `/dashboard/treasury/proposals/${event['proposal-id']}`,
                actionText: 'Execute Withdrawal',
              }
            );

            // Broadcast to proposer
            broadcastToUser(proposal.proposer, 'treasury:proposal-ready', {
              type: 'withdrawal-approved',
              data: {
                proposalId: event['proposal-id'].toString(),
                approvalCount,
                threshold: approvalThreshold,
                txHash: context.txHash,
              },
            });
          }
        }
      } else {
        // Still needs more approvals
        await NotificationService.createNotification(
          event.approver,
          'withdrawal_approved',
          '✅ Approval Recorded',
          `Your approval for proposal #${event['proposal-id']} has been recorded (${approvalCount}/${approvalThreshold}).`,
          {
            proposalId: event['proposal-id'].toString(),
            approvalCount,
            threshold: approvalThreshold,
            txHash: context.txHash,
          },
          {
            priority: 'normal',
            actionUrl: `/dashboard/treasury/proposals/${event['proposal-id']}`,
            actionText: 'View Proposal',
          }
        );

        // Broadcast to approver
        broadcastToUser(event.approver, 'treasury:approval', {
          type: 'withdrawal-approved',
          data: {
            proposalId: event['proposal-id'].toString(),
            approvalCount,
            threshold: approvalThreshold,
            txHash: context.txHash,
          },
        });
      }
      break;

    case 'treasury-withdrawal-executed':
      console.log(`💸 Withdrawal executed: ${event['proposal-id']}`);

      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;

      // Mark proposal as executed
      if (db) {
        await db.collection('treasury_proposals').updateOne(
          { proposalId: event['proposal-id'].toString() },
          {
            $set: {
              status: 'executed',
              executedAt: new Date(context.timestamp * 1000),
              executedTxHash: context.txHash,
            },
          }
        );

        // Notify all admins
        const admins = await getTreasuryAdmins();
        const executedData = {
          proposalId: event['proposal-id'].toString(),
          recipient: event.recipient,
          amount: event.amount.toString(),
          executedAt: event['executed-at'].toString(),
          txHash: context.txHash,
        };

        for (const admin of admins) {
          await NotificationService.createNotification(
            admin,
            'withdrawal_executed',
            '💸 Withdrawal Executed',
            `Treasury withdrawal proposal #${event['proposal-id']} has been executed.`,
            {
              proposalId: event['proposal-id'].toString(),
              txHash: context.txHash,
            },
            {
              priority: 'high',
              actionUrl: `/dashboard/treasury`,
              actionText: 'View Treasury',
            }
          );

          // Broadcast to each admin
          broadcastToUser(admin, 'treasury:executed', {
            type: 'withdrawal-executed',
            data: executedData,
          });
        }
      }
      break;

    case 'treasury-add-admin-proposed':
    case 'treasury-remove-admin-proposed':
      console.log(`👥 Admin proposal: ${event.event}`);

      const adminsList = await getTreasuryAdmins();
      const adminProposalData = {
        event: event.event,
        txHash: context.txHash,
      };

      for (const admin of adminsList) {
        await NotificationService.createNotification(
          admin,
          'admin_action_required',
          '👥 Admin Management Proposal',
          `A new admin management proposal has been created. Action required.`,
          {
            event: event.event,
            txHash: context.txHash,
          },
          {
            priority: 'high',
            actionUrl: `/dashboard/treasury/admin-proposals`,
            actionText: 'Review Proposal',
          }
        );

        // Broadcast admin proposal to all admins
        broadcastToUser(admin, 'treasury:admin-proposal', {
          type: event.event,
          data: adminProposalData,
        });
      }
      break;

    case 'treasury-admin-proposal-approved':
      console.log(`👥 Admin proposal approved: ${event.event}`);

      // Broadcast approval to all admins
      const adminsApproved = await getTreasuryAdmins();
      const approvalData = {
        event: event.event,
        txHash: context.txHash,
      };

      for (const admin of adminsApproved) {
        broadcastToUser(admin, 'treasury:admin-proposal', {
          type: 'admin-proposal-approved',
          data: approvalData,
        });
      }
      break;

    case 'treasury-admin-proposal-executed':
      console.log(`👥 Admin proposal executed: ${event.event}`);

      const allAdmins = await getTreasuryAdmins();
      const executedProposalData = {
        event: event.event,
        txHash: context.txHash,
      };

      for (const admin of allAdmins) {
        await NotificationService.createNotification(
          admin,
          'admin_action_required',
          '✅ Admin Proposal Executed',
          `An admin management proposal has been executed.`,
          {
            event: event.event,
            txHash: context.txHash,
          },
          {
            priority: 'high',
            actionUrl: `/dashboard/treasury`,
            actionText: 'View Treasury',
          }
        );

        // Broadcast execution to all admins
        broadcastToUser(admin, 'treasury:admin-proposal', {
          type: 'admin-proposal-executed',
          data: executedProposalData,
        });
      }
      break;

    case 'treasury-admin-transfer-proposed':
    case 'treasury-admin-transfer-completed':
    case 'treasury-admin-transfer-cancelled':
      console.log(`🔑 Admin transfer event: ${event.event}`);

      const treasuryAdmins = await getTreasuryAdmins();
      const transferData = {
        event: event.event,
        txHash: context.txHash,
      };

      for (const admin of treasuryAdmins) {
        await NotificationService.createNotification(
          admin,
          'admin_transfer',
          `🔑 ${event.event.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
          `Treasury ownership transfer event: ${event.event}`,
          {
            event: event.event,
            txHash: context.txHash,
          },
          {
            priority: 'urgent',
            actionUrl: `/dashboard/treasury`,
            actionText: 'View Details',
          }
        );

        // Broadcast admin transfer to all admins
        broadcastToUser(admin, 'treasury:admin-transfer', {
          type: event.event,
          data: transferData,
        });
      }
      break;

    default:
      console.warn(`Unknown treasury event: ${(event as any).event}`);
  }
}

/**
 * Get treasury admins from contract
 */
async function getTreasuryAdmins(): Promise<string[]> {
  try {
    const network = getStacksNetwork();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.TREASURY,
      functionName: 'get-admins',
      functionArgs: [],
      network,
      senderAddress: BITPAY_DEPLOYER_ADDRESS,
    });

    const adminsValue = cvToValue(result);
    if (Array.isArray(adminsValue)) {
      return adminsValue.map((admin: any) => admin.value || admin);
    }

    // Fallback to deployer address
    return [BITPAY_DEPLOYER_ADDRESS];
  } catch (error) {
    console.error('Failed to fetch treasury admins:', error);
    return [BITPAY_DEPLOYER_ADDRESS];
  }
}

/**
 * Get treasury approval threshold from contract
 */
async function getTreasuryThreshold(): Promise<number> {
  try {
    const network = getStacksNetwork();
    const result = await fetchCallReadOnlyFunction({
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.TREASURY,
      functionName: 'get-approval-threshold',
      functionArgs: [],
      network,
      senderAddress: BITPAY_DEPLOYER_ADDRESS,
    });

    const thresholdValue = cvToValue(result);
    if (typeof thresholdValue === 'number') {
      return thresholdValue;
    }
    if (typeof thresholdValue === 'bigint') {
      return Number(thresholdValue);
    }

    // Default to 3 for 3-of-5 multisig
    return 3;
  } catch (error) {
    console.error('Failed to fetch treasury threshold:', error);
    return 3;
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BitPay Treasury Events webhook endpoint',
    status: 'active',
    events: [
      'treasury-cancellation-fee-collected',
      'treasury-marketplace-fee-collected',
      'treasury-withdrawal-proposed',
      'treasury-withdrawal-approved',
      'treasury-withdrawal-executed',
      'treasury-add-admin-proposed',
      'treasury-remove-admin-proposed',
      'treasury-admin-proposal-approved',
      'treasury-admin-proposal-executed',
      'treasury-admin-transfer-proposed',
      'treasury-admin-transfer-completed',
      'treasury-admin-transfer-cancelled',
    ],
  });
}
