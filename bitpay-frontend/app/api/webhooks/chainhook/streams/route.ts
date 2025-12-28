/**
 * POST /api/webhooks/chainhook/streams
 * Handles BitPay Core stream events from Chainhook
 * Events: stream-created, stream-withdrawal, stream-cancelled, stream-sender-updated
 */

import { NextResponse } from 'next/server';
import type {
  ChainhookPayload,
  ChainhookBlock,
  CoreStreamEvent,
  StreamCreatedEvent,
  StreamWithdrawalEvent,
  StreamCancelledEvent,
  StreamSenderUpdatedEvent,
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
  saveStreamCreated,
  saveStreamWithdrawal,
  saveStreamCancelled,
} from '@/lib/webhooks/database-handlers';
import {
  notifyStreamCreated,
  notifyStreamWithdrawal,
  notifyStreamCancelled,
} from '@/lib/notifications/notification-service';
import connectToDatabase from '@/lib/db';
import * as NotificationService from '@/lib/notifications/notification-service';
import { broadcastToUser, broadcastToStream } from '@/lib/socket/server';

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

    console.log('📨 Stream events webhook received:', {
      apply: payload.apply?.length || 0,
      rollback: payload.rollback?.length || 0,
      uuid: payload.chainhook?.uuid,
    });

    let processedCount = 0;
    const errors: string[] = [];

    // Handle rollbacks (blockchain reorgs)
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
          const blockResult = await processStreamBlock(block);
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
      eventType: 'stream-events',
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Stream webhook error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
}

/**
 * Process a single block for stream events
 */
async function processStreamBlock(block: ChainhookBlock): Promise<number> {
  let processed = 0;

  console.log(`📦 Processing stream events from block ${block.block_identifier.index}`);

  for (const tx of block.transactions) {
    if (!tx.metadata.success) {
      console.log(`⏭️ Skipping failed transaction ${tx.transaction_identifier.hash}`);
      continue;
    }

    const printEvents = extractPrintEvents(tx);

    for (const event of printEvents) {
      const eventData = parseEventData<CoreStreamEvent>(event);
      if (!eventData) {
        console.warn('Failed to parse event data');
        continue;
      }

      const context = getWebhookContext(tx, block);
      context.contractIdentifier = event.data.contract_identifier;

      try {
        await handleStreamEvent(eventData, context);
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
 * Route stream events to appropriate handlers
 */
async function handleStreamEvent(
  event: CoreStreamEvent,
  context: any
): Promise<void> {
  switch (event.event) {
    case 'stream-created':
      await handleStreamCreated(event, context);
      break;

    case 'stream-withdrawal':
      await handleStreamWithdrawal(event, context);
      break;

    case 'stream-cancelled':
      await handleStreamCancelled(event, context);
      break;

    case 'stream-sender-updated':
      await handleStreamSenderUpdated(event, context);
      break;

    default:
      console.warn(`Unknown stream event: ${(event as any).event}`);
  }
}

/**
 * Handle stream-created event
 */
async function handleStreamCreated(
  event: StreamCreatedEvent,
  context: any
): Promise<void> {
  logWebhookEvent('stream-created', event, context);

  await saveStreamCreated({
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    recipient: event.recipient,
    amount: event.amount.toString(),
    startBlock: event['start-block'].toString(),
    endBlock: event['end-block'].toString(),
    context,
  });

  // Send notifications
  await notifyStreamCreated({
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    recipient: event.recipient,
    amount: event.amount.toString(),
    startBlock: event['start-block'].toString(),
    endBlock: event['end-block'].toString(),
    txHash: context.txHash,
  });

  // Broadcast real-time updates via WebSocket
  const streamData = {
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    recipient: event.recipient,
    amount: event.amount.toString(),
    startBlock: event['start-block'].toString(),
    endBlock: event['end-block'].toString(),
    txHash: context.txHash,
    blockHeight: context.blockHeight,
    timestamp: context.timestamp,
  };

  // Notify sender
  broadcastToUser(event.sender, 'stream:created', {
    type: 'stream-created',
    role: 'sender',
    data: streamData,
  });

  // Notify recipient
  broadcastToUser(event.recipient, 'stream:created', {
    type: 'stream-created',
    role: 'recipient',
    data: streamData,
  });

  // Broadcast to stream room
  broadcastToStream(event['stream-id'].toString(), 'stream:updated', {
    type: 'created',
    data: streamData,
  });
}

/**
 * Handle stream-withdrawal event
 */
async function handleStreamWithdrawal(
  event: StreamWithdrawalEvent,
  context: any
): Promise<void> {
  logWebhookEvent('stream-withdrawal', event, context);

  await saveStreamWithdrawal({
    streamId: event['stream-id'].toString(),
    recipient: event.recipient,
    amount: event.amount.toString(),
    context,
  });

  // Fetch stream details from database
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  let sender = '';
  let remainingAmount = '0';

  if (db) {
    const stream = await db.collection('streams').findOne({
      streamId: event['stream-id'].toString(),
    });

    if (stream) {
      sender = stream.sender || '';
      // Calculate remaining: total amount - withdrawn amount
      const totalAmount = parseFloat(stream.amount || '0');
      const withdrawn = parseFloat(stream.withdrawn || '0');
      remainingAmount = (totalAmount - withdrawn).toString();
    }
  }

  await notifyStreamWithdrawal({
    streamId: event['stream-id'].toString(),
    recipient: event.recipient,
    sender,
    amount: event.amount.toString(),
    remainingAmount,
    txHash: context.txHash,
  });
}

/**
 * Handle stream-cancelled event
 */
async function handleStreamCancelled(
  event: StreamCancelledEvent,
  context: any
): Promise<void> {
  logWebhookEvent('stream-cancelled', event, context);

  await saveStreamCancelled({
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    unvestedReturned: event['unvested-returned'].toString(),
    vestedPaid: event['vested-paid'].toString(),
    cancelledAtBlock: event['cancelled-at-block'].toString(),
    context,
  });

  // Fetch recipient from database
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  let recipient = '';

  if (db) {
    const stream = await db.collection('streams').findOne({
      streamId: event['stream-id'].toString(),
    });

    if (stream) {
      recipient = stream.recipient || '';
    }
  }

  await notifyStreamCancelled({
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    recipient,
    vestedPaid: event['vested-paid'].toString(),
    unvestedReturned: event['unvested-returned'].toString(),
    txHash: context.txHash,
  });
}

/**
 * Handle stream-sender-updated event
 */
async function handleStreamSenderUpdated(
  event: StreamSenderUpdatedEvent,
  context: any
): Promise<void> {
  logWebhookEvent('stream-sender-updated', event, context);

  const streamId = event['stream-id'].toString();
  const oldSender = event['old-sender'];
  const newSender = event['new-sender'];

  // Update stream ownership in database
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (db) {
    await db.collection('streams').updateOne(
      { streamId },
      {
        $set: {
          sender: newSender,
          updatedAt: new Date(),
        },
        $push: {
          senderHistory: {
            oldSender,
            newSender,
            updatedAt: new Date(context.timestamp * 1000),
            txHash: context.txHash,
            blockHeight: context.blockHeight,
          },
        } as any,
      }
    );

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'stream-sender-updated',
      streamId,
      data: {
        streamId,
        oldSender,
        newSender,
        updatedAt: new Date(context.timestamp * 1000),
      },
      context,
      processedAt: new Date(),
    });
  }

  // Send notification to old sender
  await NotificationService.createNotification(
    oldSender,
    'stream_sender_updated',
    '🔄 Stream Ownership Transferred',
    `You have transferred ownership of stream #${streamId} to ${newSender.slice(0, 10)}...`,
    {
      streamId,
      newSender,
    },
    {
      priority: 'normal',
      actionUrl: `/dashboard/streams/${streamId}`,
      actionText: 'View Stream',
    }
  );

  // Send notification to new sender
  await NotificationService.createNotification(
    newSender,
    'stream_sender_updated',
    '🎁 Stream Ownership Received',
    `You are now the sender of stream #${streamId}. You can manage this stream.`,
    {
      streamId,
      oldSender,
    },
    {
      priority: 'high',
      actionUrl: `/dashboard/streams/${streamId}`,
      actionText: 'Manage Stream',
    }
  );

  console.log(`✅ Stream sender updated: ${streamId} from ${oldSender} to ${newSender}`);
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BitPay Stream Events webhook endpoint',
    status: 'active',
    events: [
      'stream-created',
      'stream-withdrawal',
      'stream-cancelled',
      'stream-sender-updated',
    ],
  });
}
