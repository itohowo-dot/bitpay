/**
 * POST /api/webhooks/payment-gateway
 * Handles StacksPay payment gateway webhooks
 * Used for marketplace purchases via BTC/STX/sBTC
 *
 * Flow:
 * 1. User initiates purchase via initiate-purchase contract call
 * 2. Frontend creates StacksPay payment link
 * 3. User completes payment via StacksPay
 * 4. StacksPay sends webhook to this endpoint
 * 5. Backend verifies payment and calls complete-purchase contract
 * 6. Chainhook picks up gateway-purchase-completed event
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import {
  fetchCallReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
} from '@stacks/transactions';
import {
  getStacksNetwork,
  BITPAY_DEPLOYER_ADDRESS,
  CONTRACT_NAMES,
} from '@/lib/contracts/config';
import * as NotificationService from '@/lib/notifications/notification-service';

// StacksPay webhook payload types
interface StacksPayWebhookPayload {
  type: 'payment.created' | 'payment.pending' | 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  data: {
    payment: {
      id: string;
      status: 'pending' | 'completed' | 'failed' | 'cancelled';
      amount: number; // satoshis
      currency: 'BTC' | 'STX' | 'SBTC';
      transactionId?: string; // Blockchain transaction ID
      metadata?: {
        streamId?: string;
        buyer?: string;
        seller?: string;
        paymentId?: string;
      };
      createdAt: string;
      completedAt?: string;
    };
  };
  created: string;
}

export async function POST(request: Request) {
  try {
    console.log('💳 StacksPay webhook received');

    // Verify webhook signature
    const isValid = await verifyStacksPaySignature(request);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: StacksPayWebhookPayload = await request.json();
    console.log(`🔔 StacksPay event: ${payload.type}`, payload.data.payment.id);

    // Route to appropriate handler
    switch (payload.type) {
      case 'payment.created':
        return await handlePaymentCreated(payload);

      case 'payment.pending':
        return await handlePaymentPending(payload);

      case 'payment.completed':
        return await handlePaymentCompleted(payload);

      case 'payment.failed':
        return await handlePaymentFailed(payload);

      case 'payment.cancelled':
        return await handlePaymentCancelled(payload);

      default:
        console.log(`Unhandled StacksPay event: ${payload.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('❌ Payment gateway webhook error:', error);
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
 * Verify StacksPay webhook signature using HMAC SHA-256
 */
async function verifyStacksPaySignature(request: Request): Promise<boolean> {
  try {
    const signature = request.headers.get('x-stackspay-signature');
    const timestamp = request.headers.get('x-stackspay-timestamp');
    const secret = process.env.STACKSPAY_WEBHOOK_SECRET;

    if (!signature || !timestamp || !secret) {
      console.error('Missing signature, timestamp, or secret');
      return false;
    }

    // Prevent replay attacks - reject timestamps older than 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp);
    if (Math.abs(currentTime - webhookTime) > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Clone request to read body
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();

    // Compute expected signature: HMAC-SHA256(timestamp + body)
    const payload = `${timestamp}.${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Handle payment.created event
 */
async function handlePaymentCreated(
  payload: StacksPayWebhookPayload
): Promise<Response> {
  const { payment } = payload.data;

  console.log(`📝 Payment created: ${payment.id}`);

  try {
    // Store payment record in database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (db) {
      await db.collection('payment_confirmations').insertOne({
        stacksPayId: payment.id,
        streamId: payment.metadata?.streamId,
        buyer: payment.metadata?.buyer,
        seller: payment.metadata?.seller,
        amount: payment.amount,
        currency: payment.currency,
        status: 'created',
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment created',
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Failed to process payment created:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment created' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.pending event
 */
async function handlePaymentPending(
  payload: StacksPayWebhookPayload
): Promise<Response> {
  const { payment } = payload.data;

  console.log(`⏳ Payment pending: ${payment.id}`);

  try {
    // Update payment status
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (db) {
      await db.collection('payment_confirmations').updateOne(
        { stacksPayId: payment.id },
        {
          $set: {
            status: 'pending',
            transactionId: payment.transactionId,
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment pending',
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Failed to process payment pending:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment pending' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.completed event
 * This is the main handler that completes the blockchain purchase
 */
async function handlePaymentCompleted(
  payload: StacksPayWebhookPayload
): Promise<Response> {
  const { payment } = payload.data;

  console.log(`✅ Payment completed: ${payment.id}`);

  try {
    const { streamId, buyer, seller } = payment.metadata || {};

    if (!streamId || !buyer || !seller) {
      throw new Error('Missing required metadata: streamId, buyer, or seller');
    }

    // Update payment status in database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (db) {
      await db.collection('payment_confirmations').updateOne(
        { stacksPayId: payment.id },
        {
          $set: {
            status: 'completed',
            transactionId: payment.transactionId,
            completedAt: new Date(payment.completedAt || new Date()),
            updatedAt: new Date(),
          },
        }
      );
    }

    // Call complete-purchase smart contract function
    // This must be done by an authorized backend principal
    const network = getStacksNetwork();
    const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('BACKEND_WALLET_PRIVATE_KEY not configured');
    }

    console.log(`📝 Calling complete-purchase for stream ${streamId}`);

    const txOptions = {
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.MARKETPLACE,
      functionName: 'complete-purchase',
      functionArgs: [
        uintCV(BigInt(streamId)),
        principalCV(buyer),
      ],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractCall(txOptions);
    const txResult = await broadcastTransaction({ transaction, network });

    if ('error' in txResult) {
      throw new Error(`Transaction failed: ${txResult.reason || 'Unknown error'}`);
    }

    console.log(`✅ Transaction broadcast: ${txResult.txid}`);

    // Update with blockchain transaction ID
    if (db) {
      await db.collection('payment_confirmations').updateOne(
        { stacksPayId: payment.id },
        {
          $set: {
            blockchainTxId: txResult.txid,
            blockchainStatus: 'pending',
            updatedAt: new Date(),
          },
        }
      );
    }

    // Chainhook will pick up the gateway-purchase-completed event
    // and trigger notifications via /api/webhooks/chainhook

    return NextResponse.json({
      success: true,
      message: 'Payment completed and blockchain transaction broadcast',
      paymentId: payment.id,
      streamId,
      blockchainTxId: txResult.txid,
    });
  } catch (error) {
    console.error('Failed to process payment completed:', error);

    // Update status to failed
    try {
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;

      if (db) {
        await db.collection('payment_confirmations').updateOne(
          { stacksPayId: payload.data.payment.id },
          {
            $set: {
              status: 'blockchain_failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              updatedAt: new Date(),
            },
          }
        );
      }
    } catch (dbError) {
      console.error('Failed to update payment status:', dbError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete purchase',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(
  payload: StacksPayWebhookPayload
): Promise<Response> {
  const { payment } = payload.data;

  console.error(`❌ Payment failed: ${payment.id}`);

  try {
    const { streamId, buyer, seller } = payment.metadata || {};

    // Update payment status
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (db) {
      await db.collection('payment_confirmations').updateOne(
        { stacksPayId: payment.id },
        {
          $set: {
            status: 'failed',
            updatedAt: new Date(),
          },
        }
      );

      // Make listing available again by removing pending purchase record
      if (streamId) {
        await db.collection('pending_purchases').deleteOne({
          streamId,
          stacksPayId: payment.id,
        });
      }
    }

    // Notify buyer of failure
    if (buyer) {
      await NotificationService.createNotification(
        buyer,
        'purchase_failed',
        '❌ Payment Failed',
        `Your payment for stream #${streamId} failed. Please try again.`,
        {
          streamId,
          paymentId: payment.id,
        },
        {
          priority: 'high',
          actionUrl: `/dashboard/marketplace`,
          actionText: 'Try Again',
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment failure processed',
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Failed to process payment failure:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment failure',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.cancelled event
 */
async function handlePaymentCancelled(
  payload: StacksPayWebhookPayload
): Promise<Response> {
  const { payment } = payload.data;

  console.log(`🚫 Payment cancelled: ${payment.id}`);

  try {
    const { streamId, buyer } = payment.metadata || {};

    // Update payment status
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (db) {
      await db.collection('payment_confirmations').updateOne(
        { stacksPayId: payment.id },
        {
          $set: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        }
      );

      // Make listing available again
      if (streamId) {
        await db.collection('pending_purchases').deleteOne({
          streamId,
          stacksPayId: payment.id,
        });
      }
    }

    // Notify buyer
    if (buyer) {
      await NotificationService.createNotification(
        buyer,
        'purchase_cancelled',
        '🚫 Payment Cancelled',
        `Your payment for stream #${streamId} was cancelled.`,
        {
          streamId,
          paymentId: payment.id,
        },
        {
          priority: 'normal',
          actionUrl: `/dashboard/marketplace`,
          actionText: 'View Marketplace',
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment cancellation processed',
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Failed to process payment cancellation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment cancellation',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'StacksPay Payment Gateway webhook endpoint',
    status: 'active',
    supportedCurrencies: ['BTC', 'STX', 'SBTC'],
    gateway: 'StacksPay',
  });
}
