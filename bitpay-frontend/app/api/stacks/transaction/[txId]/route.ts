/**
 * GET /api/stacks/transaction/[txId]
 * Returns transaction status and details
 */

import { NextResponse } from 'next/server';
import { STACKS_API_URL } from '@/lib/contracts/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await params;

    if (!txId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${STACKS_API_URL}/extended/v1/tx/${txId}`, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }
      throw new Error(`Stacks API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transaction: {
        txId: data.tx_id,
        txStatus: data.tx_status,
        txType: data.tx_type,
        blockHeight: data.block_height,
        blockHash: data.block_hash,
        burnBlockTime: data.burn_block_time,
        senderAddress: data.sender_address,
        fee: data.fee_rate,
        sponsored: data.sponsored,
        postConditions: data.post_conditions,
        events: data.events,
      },
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction',
      },
      { status: 500 }
    );
  }
}
