/**
 * POST /api/webhooks/chainhook/nft
 * Handles BitPay NFT events from Chainhook
 * Events: obligation-transferred, obligation-minted, recipient NFT mint/burn
 */

import { NextResponse } from 'next/server';
import type {
  ChainhookPayload,
  ChainhookBlock,
  NFTEvent,
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

    console.log('📨 NFT events webhook received:', {
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
          const blockResult = await processNFTBlock(block);
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
      eventType: 'nft-events',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ NFT webhook error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
}

/**
 * Process a single block for NFT events
 */
async function processNFTBlock(block: ChainhookBlock): Promise<number> {
  let processed = 0;

  console.log(`🎨 Processing NFT events from block ${block.block_identifier.index}`);

  for (const tx of block.transactions) {
    if (!tx.metadata.success) {
      continue;
    }

    // Handle both print events and NFT events
    const printEvents = extractPrintEvents(tx);
    const nftEvents = tx.metadata.events?.filter((e) => e.type === 'nft_event') || [];

    // Process obligation NFT print events (transfers, mints)
    for (const event of printEvents) {
      const eventData = parseEventData<NFTEvent>(event);
      if (!eventData) {
        continue;
      }

      const context = getWebhookContext(tx, block);
      context.contractIdentifier = event.data.contract_identifier;

      logWebhookEvent(eventData.event, eventData, context);
      await handleNFTEvent(eventData, context);
      processed++;
    }

    // Process recipient NFT events (mint/burn from Stacks)
    for (const event of nftEvents) {
      const context = getWebhookContext(tx, block);
      logWebhookEvent('nft_event', event, context);
      // TODO: Handle recipient NFT mint/burn
      processed++;
    }
  }

  return processed;
}

/**
 * Handle NFT events
 */
async function handleNFTEvent(
  event: NFTEvent,
  context: any
): Promise<void> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  switch (event.event) {
    case 'obligation-transferred':
      console.log(`🔄 Obligation NFT #${event['token-id']} transferred: ${event.from} → ${event.to}`);

      // Update NFT ownership in database
      if (db) {
        await db.collection('obligation_nfts').updateOne(
          { tokenId: event['token-id'].toString() },
          {
            $set: {
              owner: event.to,
              updatedAt: new Date(context.timestamp * 1000),
            },
            $push: {
              transferHistory: {
                from: event.from,
                to: event.to,
                transferredAt: new Date(context.timestamp * 1000),
                txHash: context.txHash,
                blockHeight: context.blockHeight,
              },
            } as any,
          },
          { upsert: true }
        );

        // Check if NFT is listed on marketplace
        const listing = await db.collection('marketplace_listings').findOne({
          tokenId: event['token-id'].toString(),
          status: 'active',
        });

        if (listing) {
          // Update marketplace listing ownership or cancel it
          await db.collection('marketplace_listings').updateOne(
            { tokenId: event['token-id'].toString(), status: 'active' },
            {
              $set: {
                seller: event.to,
                updatedAt: new Date(),
              },
            }
          );
        }

        // Log event
        await db.collection('blockchain_events').insertOne({
          type: 'obligation-transferred',
          tokenId: event['token-id'].toString(),
          data: {
            tokenId: event['token-id'].toString(),
            from: event.from,
            to: event.to,
            transferredAt: new Date(context.timestamp * 1000),
          },
          context,
          processedAt: new Date(),
        });
      }

      // Notify sender (from)
      await NotificationService.createNotification(
        event.from,
        'purchase_completed',
        '📤 Obligation NFT Transferred',
        `You transferred Obligation NFT #${event['token-id']} to ${event.to.slice(0, 10)}...`,
        {
          tokenId: event['token-id'].toString(),
          to: event.to,
          txHash: context.txHash,
        },
        {
          priority: 'normal',
          actionUrl: `/dashboard/nfts/${event['token-id']}`,
          actionText: 'View NFT',
        }
      );

      // Notify recipient (to)
      await NotificationService.createNotification(
        event.to,
        'purchase_received',
        '📥 Obligation NFT Received',
        `You received Obligation NFT #${event['token-id']} from ${event.from.slice(0, 10)}...`,
        {
          tokenId: event['token-id'].toString(),
          from: event.from,
          txHash: context.txHash,
        },
        {
          priority: 'high',
          actionUrl: `/dashboard/nfts/${event['token-id']}`,
          actionText: 'View NFT',
        }
      );

      // Broadcast real-time updates
      const transferData = {
        tokenId: event['token-id'].toString(),
        from: event.from,
        to: event.to,
        txHash: context.txHash,
      };

      // Notify sender
      broadcastToUser(event.from, 'nft:transferred', {
        type: 'obligation-transferred',
        role: 'sender',
        data: transferData,
      });

      // Notify recipient
      broadcastToUser(event.to, 'nft:received', {
        type: 'obligation-transferred',
        role: 'recipient',
        data: transferData,
      });
      break;

    case 'obligation-minted':
      console.log(`✨ Obligation NFT #${event['token-id']} minted to ${event.recipient}`);

      // Create NFT record in database
      if (db) {
        await db.collection('obligation_nfts').insertOne({
          tokenId: event['token-id'].toString(),
          owner: event.recipient,
          streamId: (event as any)['stream-id']?.toString() || null,
          mintedAt: new Date(context.timestamp * 1000),
          txHash: context.txHash,
          blockHeight: context.blockHeight,
          transferHistory: [],
          createdAt: new Date(),
        });

        // Log event
        await db.collection('blockchain_events').insertOne({
          type: 'obligation-minted',
          tokenId: event['token-id'].toString(),
          data: {
            tokenId: event['token-id'].toString(),
            recipient: event.recipient,
            streamId: (event as any)['stream-id']?.toString() || null,
            mintedAt: new Date(context.timestamp * 1000),
          },
          context,
          processedAt: new Date(),
        });
      }

      // Notify recipient
      await NotificationService.createNotification(
        event.recipient,
        'purchase_received',
        '✨ Obligation NFT Minted',
        `Obligation NFT #${event['token-id']} has been minted to you. This represents your payment stream rights.`,
        {
          tokenId: event['token-id'].toString(),
          streamId: (event as any)['stream-id']?.toString() || null,
          txHash: context.txHash,
        },
        {
          priority: 'high',
          actionUrl: `/dashboard/nfts/${event['token-id']}`,
          actionText: 'View NFT',
        }
      );

      // Broadcast real-time update
      broadcastToUser(event.recipient, 'nft:minted', {
        type: 'obligation-minted',
        data: {
          tokenId: event['token-id'].toString(),
          recipient: event.recipient,
          streamId: (event as any)['stream-id']?.toString() || null,
          txHash: context.txHash,
        },
      });
      break;

    default:
      console.warn(`Unknown NFT event: ${(event as any).event}`);
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BitPay NFT Events webhook endpoint',
    status: 'active',
    events: [
      'obligation-transferred',
      'obligation-minted',
      'recipient-nft-minted',
      'recipient-nft-burned',
    ],
  });
}
