/**
 * GET /api/streams/[id]/vested
 * Returns current vested and withdrawable amounts for a stream
 */

import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import {
  getStacksNetwork,
  BITPAY_DEPLOYER_ADDRESS,
  CONTRACT_NAMES,
  CORE_FUNCTIONS,
  StreamData,
  calculateVestedAmount,
  calculateWithdrawableAmount,
  calculateProgress,
  getStreamStatus,
} from '@/lib/contracts/config';
import { STACKS_API_URL } from '@/lib/contracts/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Stream ID required' },
        { status: 400 }
      );
    }

    const streamId = BigInt(id);
    const network = getStacksNetwork();

    // Get current block height
    const blockResponse = await fetch(`${STACKS_API_URL}/v2/info`);
    const blockData = await blockResponse.json();
    const currentBlock = BigInt(blockData.stacks_tip_height);

    // Get stream data
    const streamResult = await fetchCallReadOnlyFunction({
      network,
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.CORE,
      functionName: CORE_FUNCTIONS.GET_STREAM,
      functionArgs: [uintCV(streamId)],
      senderAddress: BITPAY_DEPLOYER_ADDRESS,
    });

    const streamData = cvToJSON(streamResult).value as StreamData;

    if (!streamData) {
      return NextResponse.json(
        { success: false, error: 'Stream not found' },
        { status: 404 }
      );
    }

    const vestedAmount = calculateVestedAmount(streamData, currentBlock);
    const withdrawableAmount = calculateWithdrawableAmount(streamData, currentBlock);
    const progress = calculateProgress(
      streamData['start-block'],
      streamData['end-block'],
      currentBlock
    );
    const status = getStreamStatus(
      streamData['start-block'],
      streamData['end-block'],
      currentBlock,
      streamData.cancelled
    );

    return NextResponse.json({
      success: true,
      streamId: id,
      currentBlock: currentBlock.toString(),
      vestedAmount: vestedAmount.toString(),
      withdrawableAmount: withdrawableAmount.toString(),
      totalAmount: streamData.amount.toString(),
      withdrawn: streamData.withdrawn.toString(),
      progress,
      status,
      startBlock: streamData['start-block'].toString(),
      endBlock: streamData['end-block'].toString(),
      cancelled: streamData.cancelled,
    });
  } catch (error) {
    console.error('Error calculating vested amount:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate vested amount',
      },
      { status: 500 }
    );
  }
}
