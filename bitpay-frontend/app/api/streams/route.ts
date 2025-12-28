/**
 * GET /api/streams?address=<user-address>
 * Returns all streams for a user (sent + received)
 */

import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV, uintCV } from '@stacks/transactions';
import {
  getStacksNetwork,
  BITPAY_DEPLOYER_ADDRESS,
  CONTRACT_NAMES,
  CORE_FUNCTIONS,
  StreamData,
  calculateVestedAmount,
  calculateWithdrawableAmount,
  getStreamStatus,
} from '@/lib/contracts/config';
import { STACKS_API_URL } from '@/lib/contracts/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 }
      );
    }

    const network = getStacksNetwork();

    // Get current block height
    const blockResponse = await fetch(`${STACKS_API_URL}/v2/info`);
    const blockData = await blockResponse.json();
    const currentBlock = BigInt(blockData.stacks_tip_height);

    // Get sender streams
    const senderResult = await fetchCallReadOnlyFunction({
      network,
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.CORE,
      functionName: CORE_FUNCTIONS.GET_SENDER_STREAMS,
      functionArgs: [principalCV(address)],
      senderAddress: BITPAY_DEPLOYER_ADDRESS,
    });

    // Get recipient streams
    const recipientResult = await fetchCallReadOnlyFunction({
      network,
      contractAddress: BITPAY_DEPLOYER_ADDRESS,
      contractName: CONTRACT_NAMES.CORE,
      functionName: CORE_FUNCTIONS.GET_RECIPIENT_STREAMS,
      functionArgs: [principalCV(address)],
      senderAddress: BITPAY_DEPLOYER_ADDRESS,
    });

    const senderStreamIds = (cvToJSON(senderResult).value as any[]) || [];
    const recipientStreamIds = (cvToJSON(recipientResult).value as any[]) || [];

    // Combine and deduplicate stream IDs
    const allStreamIds = [
      ...senderStreamIds.map((id: any) => BigInt(id)),
      ...recipientStreamIds.map((id: any) => BigInt(id)),
    ];
    const uniqueStreamIds = Array.from(new Set(allStreamIds.map(id => id.toString())))
      .map(id => BigInt(id));

    // Fetch each stream's data
    const streamPromises = uniqueStreamIds.map(async (streamId) => {
      const streamResult = await fetchCallReadOnlyFunction({
        network,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.GET_STREAM,
        functionArgs: [uintCV(streamId)],
        senderAddress: BITPAY_DEPLOYER_ADDRESS,
      });

      const streamData = cvToJSON(streamResult).value as StreamData;

      if (!streamData) return null;

      const vestedAmount = calculateVestedAmount(streamData, currentBlock);
      const withdrawableAmount = calculateWithdrawableAmount(streamData, currentBlock);
      const status = getStreamStatus(
        streamData['start-block'],
        streamData['end-block'],
        currentBlock,
        streamData.cancelled
      );

      return {
        id: streamId.toString(),
        ...streamData,
        status,
        vestedAmount: vestedAmount.toString(),
        withdrawableAmount: withdrawableAmount.toString(),
        amount: streamData.amount.toString(),
        'start-block': streamData['start-block'].toString(),
        'end-block': streamData['end-block'].toString(),
        withdrawn: streamData.withdrawn.toString(),
      };
    });

    const streams = await Promise.all(streamPromises);
    const validStreams = streams.filter(s => s !== null);

    return NextResponse.json({
      success: true,
      streams: validStreams,
      count: validStreams.length,
      currentBlock: currentBlock.toString(),
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch streams',
      },
      { status: 500 }
    );
  }
}
