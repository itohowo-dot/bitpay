import { useMemo } from 'react';
import { useUserStreams as useContractStreams } from './use-bitpay-read';

export interface StreamWithRole {
  stream: any;
  userRole: 'sender' | 'recipient';
}

export function useUserStreamsByRole(userAddress: string | null) {
  const { data: allStreams, isLoading, refetch } = useContractStreams(userAddress);

  const streamsByRole = useMemo(() => {
    if (!allStreams || !userAddress) {
      return {
        outgoingStreams: [],
        incomingStreams: [],
        hasOutgoing: false,
        hasIncoming: false,
        totalOutgoing: 0,
        totalIncoming: 0,
      };
    }

    const normalizedAddress = userAddress.toLowerCase();

    console.log('🔍 Filtering streams for user:', userAddress);
    console.log('📊 Total streams fetched:', allStreams.length);

    // Debug: log all streams
    allStreams.forEach((stream, index) => {
      console.log(`Stream ${index + 1}:`, {
        id: stream.id?.toString(),
        sender: stream.sender,
        recipient: stream.recipient,
        isSender: stream.sender?.toLowerCase() === normalizedAddress,
        isRecipient: stream.recipient?.toLowerCase() === normalizedAddress,
      });
    });

    // Streams where user is the sender
    const outgoingStreams = allStreams.filter(stream =>
      stream.sender && stream.sender.toLowerCase() === normalizedAddress
    );

    // Streams where user is the recipient
    const incomingStreams = allStreams.filter(stream =>
      stream.recipient && stream.recipient.toLowerCase() === normalizedAddress
    );

    console.log('📤 Outgoing (Obligation NFTs):', outgoingStreams.length);
    console.log('📥 Incoming (Recipient NFTs):', incomingStreams.length);

    return {
      outgoingStreams,
      incomingStreams,
      hasOutgoing: outgoingStreams.length > 0,
      hasIncoming: incomingStreams.length > 0,
      totalOutgoing: outgoingStreams.length,
      totalIncoming: incomingStreams.length,
    };
  }, [allStreams, userAddress]);

  return {
    ...streamsByRole,
    isLoading,
    refetch,
    allStreams: allStreams || [],
  };
}

// Helper to determine user's role in a specific stream
export function getUserRoleInStream(stream: any, userAddress: string): 'sender' | 'recipient' | null {
  if (!stream || !userAddress) return null;

  const normalized = userAddress.toLowerCase();

  if (stream.sender.toLowerCase() === normalized) return 'sender';
  if (stream.recipient.toLowerCase() === normalized) return 'recipient';

  return null;
}
