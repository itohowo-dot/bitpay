/**
 * POST /api/webhooks/chainhook
 * Handles incoming Chainhook events from Stacks blockchain
 * Events: stream-created, stream-withdrawal, stream-cancelled
 */

import { NextResponse } from 'next/server';

// Types for Chainhook payloads
interface ChainhookEvent {
  type: string;
  data: {
    contract_identifier: string;
    topic: string;
    value: any;
  };
}

interface ChainhookTransaction {
  transaction_identifier: {
    hash: string;
  };
  metadata: {
    success: boolean;
    result?: string;
    events?: ChainhookEvent[];
    receipt?: {
      events?: ChainhookEvent[];
    };
  };
}

interface ChainhookBlock {
  block_identifier: {
    index: number;
    hash: string;
  };
  parent_block_identifier: {
    index: number;
    hash: string;
  };
  timestamp: number;
  transactions: ChainhookTransaction[];
}

interface ChainhookPayload {
  apply: ChainhookBlock[];
  rollback: ChainhookBlock[];
  chainhook: {
    uuid: string;
    predicate: any;
  };
}

// Stream event types from contract
interface StreamCreatedEvent {
  event: string;
  'stream-id': bigint;
  sender: string;
  recipient: string;
  amount: bigint;
  'start-block': bigint;
  'end-block': bigint;
}

interface StreamWithdrawalEvent {
  event: string;
  'stream-id': bigint;
  recipient: string;
  amount: bigint;
}

interface StreamCancelledEvent {
  event: string;
  'stream-id': bigint;
  sender: string;
  'unvested-returned': bigint;
  'vested-paid': bigint;
  'cancelled-at-block': bigint;
}

export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CHAINHOOK_SECRET_TOKEN;

    if (!expectedToken) {
      console.error('CHAINHOOK_SECRET_TOKEN not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid authorization token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: ChainhookPayload = await request.json();
    console.log('📨 Chainhook webhook received:', {
      apply: payload.apply?.length || 0,
      rollback: payload.rollback?.length || 0,
      uuid: payload.chainhook?.uuid,
    });

    // Handle rollbacks (blockchain reorgs)
    if (payload.rollback && payload.rollback.length > 0) {
      console.warn('⚠️ Rollback detected - handling reorg:', payload.rollback.length, 'blocks');
      await handleRollback(payload.rollback);
    }

    // Process new blocks
    if (payload.apply && payload.apply.length > 0) {
      await handleApply(payload.apply);
    }

    return NextResponse.json({
      success: true,
      processed: {
        applied: payload.apply?.length || 0,
        rolledBack: payload.rollback?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Chainhook webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle new confirmed blocks
 */
async function handleApply(blocks: ChainhookBlock[]) {
  for (const block of blocks) {
    console.log(`📦 Processing block ${block.block_identifier.index}`);

    for (const tx of block.transactions) {
      if (!tx.metadata.success) {
        console.log(`⏭️ Skipping failed transaction ${tx.transaction_identifier.hash}`);
        continue;
      }

      // Get events from transaction
      const events = tx.metadata.events || tx.metadata.receipt?.events || [];

      for (const event of events) {
        if (event.type === 'print_event') {
          await handlePrintEvent(event, tx, block);
        }
      }
    }
  }
}

/**
 * Handle blockchain reorganizations
 * Note: Rollback logic is implemented in specialized route handlers
 * (streams, marketplace, treasury, etc.)
 */
async function handleRollback(blocks: ChainhookBlock[]) {
  for (const block of blocks) {
    console.warn(`🔄 Rolling back block ${block.block_identifier.index}`);

    // Rollback handling is implemented in:
    // - /api/webhooks/chainhook/streams/route.ts
    // - /api/webhooks/chainhook/marketplace/route.ts
    // - /api/webhooks/chainhook/treasury/route.ts
    // - /api/webhooks/chainhook/nft/route.ts
    // - /api/webhooks/chainhook/access-control/route.ts

    console.warn(`⚠️ Rollback for block ${block.block_identifier.index} - handled by specialized routes`);
  }
}

/**
 * Handle print events from BitPay contracts
 */
async function handlePrintEvent(
  event: ChainhookEvent,
  tx: ChainhookTransaction,
  block: ChainhookBlock
) {
  const eventData = event.data.value;
  const eventType = eventData.event;

  console.log(`📢 Print event: ${eventType}`, {
    txHash: tx.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
  });

  switch (eventType) {
    case 'stream-created':
      await handleStreamCreated(eventData as StreamCreatedEvent, tx, block);
      break;

    case 'stream-withdrawal':
      await handleStreamWithdrawal(eventData as StreamWithdrawalEvent, tx, block);
      break;

    case 'stream-cancelled':
      await handleStreamCancelled(eventData as StreamCancelledEvent, tx, block);
      break;

    default:
      console.log(`Unknown event type: ${eventType}`);
  }
}

/**
 * Handle stream-created event
 * Note: Full implementation in /api/webhooks/chainhook/streams/route.ts
 */
async function handleStreamCreated(
  event: StreamCreatedEvent,
  tx: ChainhookTransaction,
  block: ChainhookBlock
) {
  console.log(`✨ Stream created:`, {
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    recipient: event.recipient,
    amount: event.amount.toString(),
    startBlock: event['start-block'].toString(),
    endBlock: event['end-block'].toString(),
  });

  // Database storage, notifications, and real-time updates
  // are handled in /api/webhooks/chainhook/streams/route.ts
  console.log('→ Event processing delegated to specialized streams route');
}

/**
 * Handle stream-withdrawal event
 * Note: Full implementation in /api/webhooks/chainhook/streams/route.ts
 */
async function handleStreamWithdrawal(
  event: StreamWithdrawalEvent,
  tx: ChainhookTransaction,
  block: ChainhookBlock
) {
  console.log(`💰 Stream withdrawal:`, {
    streamId: event['stream-id'].toString(),
    recipient: event.recipient,
    amount: event.amount.toString(),
    txHash: tx.transaction_identifier.hash,
  });

  // Database updates, notifications, and real-time updates
  // are handled in /api/webhooks/chainhook/streams/route.ts
  console.log('→ Event processing delegated to specialized streams route');
}

/**
 * Handle stream-cancelled event
 * Note: Full implementation in /api/webhooks/chainhook/streams/route.ts
 */
async function handleStreamCancelled(
  event: StreamCancelledEvent,
  tx: ChainhookTransaction,
  block: ChainhookBlock
) {
  console.log(`❌ Stream cancelled:`, {
    streamId: event['stream-id'].toString(),
    sender: event.sender,
    unvestedReturned: event['unvested-returned'].toString(),
    vestedPaid: event['vested-paid'].toString(),
    cancelledAtBlock: event['cancelled-at-block'].toString(),
  });

  // Database updates, notifications, and real-time updates
  // are handled in /api/webhooks/chainhook/streams/route.ts
  console.log('→ Event processing delegated to specialized streams route');
}

// Optional: GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'BitPay Chainhook webhook endpoint',
    status: 'active',
  });
}
