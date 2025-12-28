/**
 * GET /api/stacks/block-height
 * Returns current Stacks block height
 */

import { NextResponse } from 'next/server';
import { STACKS_API_URL } from '@/lib/contracts/config';

export async function GET() {
  try {
    const response = await fetch(`${STACKS_API_URL}/v2/info`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Stacks API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      blockHeight: data.stacks_tip_height || data.burn_block_height,
      blockHash: data.stacks_tip,
      network: data.network_id === 1 ? 'mainnet' : 'testnet',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching block height:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch block height',
      },
      { status: 500 }
    );
  }
}
