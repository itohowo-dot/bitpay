/**
 * useBlockHeight Hook
 * Fetches and tracks current Stacks block height with real-time updates
 */

import { useState, useEffect } from 'react';
import { STACKS_API_URL } from '@/lib/contracts/config';

export interface BlockHeightData {
  height: number;
  hash: string;
  timestamp: number;
}

export interface UseBlockHeightReturn {
  blockHeight: number | null;
  blockData: BlockHeightData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get current Stacks block height
 * @param pollingInterval - Optional polling interval in ms (default: 60000 = 1 minute)
 */
export function useBlockHeight(pollingInterval?: number): UseBlockHeightReturn {
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [blockData, setBlockData] = useState<BlockHeightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockHeight = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${STACKS_API_URL}/v2/info`);
      if (!response.ok) {
        throw new Error(`Failed to fetch block height: ${response.statusText}`);
      }

      const data = await response.json();

      const height = data.stacks_tip_height || data.burn_block_height;
      const hash = data.stacks_tip;
      const timestamp = Date.now();

      setBlockHeight(height);
      setBlockData({
        height,
        hash,
        timestamp,
      });
    } catch (err) {
      console.error('Error fetching block height:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch block height');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlockHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling
  useEffect(() => {
    const interval = pollingInterval || 60000; // Default 1 minute
    if (interval <= 0) return;

    const timer = setInterval(fetchBlockHeight, interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingInterval]);

  return {
    blockHeight,
    blockData,
    isLoading,
    error,
    refetch: fetchBlockHeight,
  };
}
