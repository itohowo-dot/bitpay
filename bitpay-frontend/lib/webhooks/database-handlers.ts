/**
 * Database handlers for persisting Chainhook events
 * Integrates with MongoDB to store blockchain events
 */

import connectToDatabase from '@/lib/db';
import { retryOperation } from './chainhook-utils';
import type { WebhookContext } from '@/types/chainhook';

// Get MongoDB connection
async function getDb() {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to connect to database');
  }
  return db;
}

// ============================================================================
// Stream Events Database Handlers
// ============================================================================

export async function saveStreamCreated(data: {
  streamId: string;
  sender: string;
  recipient: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const streamEvent = {
      streamId: data.streamId,
      sender: data.sender,
      recipient: data.recipient,
      amount: data.amount,
      startBlock: data.startBlock,
      endBlock: data.endBlock,
      withdrawn: '0',
      status: 'active',
      createdAt: new Date(data.context.timestamp * 1000),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
      blockHash: data.context.blockHash,
    };

    // Upsert stream document
    await db.collection('streams').updateOne(
      { streamId: data.streamId },
      {
        $set: streamEvent,
        $setOnInsert: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // Log event in transaction history
    await db.collection('blockchain_events').insertOne({
      type: 'stream-created',
      streamId: data.streamId,
      data: streamEvent,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved stream-created event: ${data.streamId}`);
  });
}

export async function saveStreamWithdrawal(data: {
  streamId: string;
  recipient: string;
  amount: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    // Update stream's withdrawn amount
    await db.collection('streams').updateOne(
      { streamId: data.streamId },
      {
        $inc: { withdrawn: parseFloat(data.amount) },
        $set: { updatedAt: new Date() },
      }
    );

    // Log withdrawal event
    await db.collection('blockchain_events').insertOne({
      type: 'stream-withdrawal',
      streamId: data.streamId,
      data: {
        streamId: data.streamId,
        recipient: data.recipient,
        amount: data.amount,
        withdrawnAt: new Date(data.context.timestamp * 1000),
      },
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved stream-withdrawal event: ${data.streamId}`);
  });
}

export async function saveStreamCancelled(data: {
  streamId: string;
  sender: string;
  unvestedReturned: string;
  vestedPaid: string;
  cancelledAtBlock: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    // Update stream status
    await db.collection('streams').updateOne(
      { streamId: data.streamId },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(data.context.timestamp * 1000),
          cancelledAtBlock: data.cancelledAtBlock,
          unvestedReturned: data.unvestedReturned,
          vestedPaid: data.vestedPaid,
          updatedAt: new Date(),
        },
      }
    );

    // Log cancellation event
    await db.collection('blockchain_events').insertOne({
      type: 'stream-cancelled',
      streamId: data.streamId,
      data,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved stream-cancelled event: ${data.streamId}`);
  });
}

// ============================================================================
// Marketplace Events Database Handlers
// ============================================================================

export async function saveDirectPurchase(data: {
  streamId: string;
  seller: string;
  buyer: string;
  price: string;
  marketplaceFee: string;
  saleId: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const sale = {
      saleId: data.saleId,
      streamId: data.streamId,
      seller: data.seller,
      buyer: data.buyer,
      price: data.price,
      marketplaceFee: data.marketplaceFee,
      saleType: 'direct',
      soldAt: new Date(data.context.timestamp * 1000),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
    };

    await db.collection('marketplace_sales').insertOne(sale);

    // Update stream ownership
    await db.collection('streams').updateOne(
      { streamId: data.streamId },
      {
        $set: {
          sender: data.buyer,
          updatedAt: new Date(),
        },
      }
    );

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'direct-purchase-completed',
      streamId: data.streamId,
      data: sale,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved direct purchase: ${data.saleId}`);
  });
}

export async function saveGatewayPurchase(data: {
  streamId: string;
  seller: string;
  buyer: string;
  price: string;
  marketplaceFee: string;
  paymentId: string;
  saleId: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const sale = {
      saleId: data.saleId,
      streamId: data.streamId,
      seller: data.seller,
      buyer: data.buyer,
      price: data.price,
      marketplaceFee: data.marketplaceFee,
      paymentId: data.paymentId,
      saleType: 'gateway',
      soldAt: new Date(data.context.timestamp * 1000),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
    };

    await db.collection('marketplace_sales').insertOne(sale);

    // Update pending purchase status
    await db.collection('pending_purchases').updateOne(
      { streamId: data.streamId, paymentId: data.paymentId },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
        },
      }
    );

    // Update stream ownership
    await db.collection('streams').updateOne(
      { streamId: data.streamId },
      {
        $set: {
          sender: data.buyer,
          updatedAt: new Date(),
        },
      }
    );

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'gateway-purchase-completed',
      streamId: data.streamId,
      data: sale,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved gateway purchase: ${data.saleId}`);
  });
}

export async function savePurchaseInitiated(data: {
  streamId: string;
  seller: string;
  buyer: string;
  paymentId: string;
  initiatedAt: string;
  expiresAt: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const purchase = {
      streamId: data.streamId,
      seller: data.seller,
      buyer: data.buyer,
      paymentId: data.paymentId,
      status: 'pending',
      initiatedAt: new Date(parseInt(data.initiatedAt)),
      expiresAt: new Date(parseInt(data.expiresAt)),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
    };

    await db.collection('pending_purchases').insertOne(purchase);

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'purchase-initiated',
      streamId: data.streamId,
      data: purchase,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved purchase-initiated: ${data.paymentId}`);
  });
}

// ============================================================================
// Treasury Events Database Handlers
// ============================================================================

export async function saveFeeCollected(data: {
  streamId: string;
  amount: string;
  collectedFrom: string;
  feeType: 'cancellation' | 'marketplace';
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const feeEvent = {
      streamId: data.streamId,
      amount: data.amount,
      collectedFrom: data.collectedFrom,
      feeType: data.feeType,
      collectedAt: new Date(data.context.timestamp * 1000),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
    };

    await db.collection('treasury_fees').insertOne(feeEvent);

    // Update treasury totals
    await db.collection('treasury_stats').updateOne(
      { key: 'current' } as any,
      {
        $inc: {
          totalFees: parseFloat(data.amount),
          [`${data.feeType}Fees`]: parseFloat(data.amount),
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: `${data.feeType}-fee-collected`,
      streamId: data.streamId,
      data: feeEvent,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved ${data.feeType}-fee-collected: ${data.amount}`);
  });
}

export async function saveWithdrawalProposal(data: {
  proposalId: string;
  proposer: string;
  recipient: string;
  amount: string;
  proposedAt: string;
  timelockExpires: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    const proposal = {
      proposalId: data.proposalId,
      type: 'withdrawal',
      proposer: data.proposer,
      recipient: data.recipient,
      amount: data.amount,
      status: 'pending',
      approvals: [data.proposer],
      approvalCount: 1,
      proposedAt: new Date(parseInt(data.proposedAt)),
      timelockExpires: new Date(parseInt(data.timelockExpires)),
      txHash: data.context.txHash,
      blockHeight: data.context.blockHeight,
    };

    await db.collection('treasury_proposals').insertOne(proposal);

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'withdrawal-proposed',
      proposalId: data.proposalId,
      data: proposal,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved withdrawal-proposed: ${data.proposalId}`);
  });
}

export async function saveWithdrawalApproval(data: {
  proposalId: string;
  approver: string;
  approvalCount: string;
  context: WebhookContext;
}) {
  return retryOperation(async () => {
    const db = await getDb();

    await db.collection('treasury_proposals').updateOne(
      { proposalId: data.proposalId },
      {
        $addToSet: { approvals: data.approver },
        $set: {
          approvalCount: parseInt(data.approvalCount),
          updatedAt: new Date(),
        },
      }
    );

    // Log event
    await db.collection('blockchain_events').insertOne({
      type: 'withdrawal-approved',
      proposalId: data.proposalId,
      data,
      context: data.context,
      processedAt: new Date(),
    });

    console.log(`✅ Saved withdrawal-approved: ${data.proposalId}`);
  });
}

// ============================================================================
// Reorg Handlers
// ============================================================================

export async function markTransactionsAsRolledBack(blockHeight: number) {
  return retryOperation(async () => {
    const db = await getDb();

    await db.collection('blockchain_events').updateMany(
      { 'context.blockHeight': blockHeight },
      {
        $set: {
          status: 'rolled_back',
          rolledBackAt: new Date(),
        },
      }
    );

    console.log(`✅ Marked transactions from block ${blockHeight} as rolled back`);
  });
}
