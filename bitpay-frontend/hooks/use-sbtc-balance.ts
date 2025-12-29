/**
 * Hook to fetch sBTC balance from the bitpay-sbtc-helper contract
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  principalCV,
} from '@stacks/transactions';
import { getStacksNetwork, BITPAY_DEPLOYER_ADDRESS, CONTRACT_NAMES } from '@/lib/contracts/config';

export interface UseSBTCBalanceReturn {
  balance: bigint | null;
  balanceDisplay: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSBTCBalance(address: string | null): UseSBTCBalanceReturn {
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔧 useSBTCBalance hook mounted with address:', address);

  const fetchBalance = useCallback(async () => {
    console.log('🔧 fetchBalance called with address:', address);

    if (!address) {
      console.log('⚠️ No address provided, skipping balance fetch');
      setBalance(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const network = getStacksNetwork();

      console.log('📞 Fetching sBTC balance from bitpay-sbtc-helper-v3:', {
        address,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.SBTC_HELPER,
      });

      // Call get-user-balance function on OUR bitpay-sbtc-helper contract
      const result = await fetchCallReadOnlyFunction({
        network,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.SBTC_HELPER,
        functionName: 'get-user-balance',
        functionArgs: [principalCV(address)],
        senderAddress: address,
      });

      console.log('📞 Raw result:', result);
      const jsonResult = cvToJSON(result);
      console.log('📞 JSON result:', jsonResult);

      // Extract balance from response
      // Response format: (ok uint) or { type: 'ok', value: { type: 'uint', value: '...' } }
      let balanceValue: bigint = BigInt(0);

      if (jsonResult && typeof jsonResult === 'object') {
        if ('value' in jsonResult) {
          // Handle nested response (ok uint)
          const innerValue = jsonResult.value;
          if (typeof innerValue === 'object' && 'value' in innerValue) {
            balanceValue = BigInt(innerValue.value);
          } else if (typeof innerValue === 'string' || typeof innerValue === 'number') {
            balanceValue = BigInt(innerValue);
          }
        } else if (typeof jsonResult === 'string' || typeof jsonResult === 'number') {
          balanceValue = BigInt(jsonResult);
        }
      }

      console.log('✅ sBTC Balance:', balanceValue.toString(), 'satoshis');
      setBalance(balanceValue);
    } catch (err) {
      console.error('❌ Error fetching sBTC balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Convert balance to display format (8 decimals)
  const balanceDisplay = balance !== null
    ? (Number(balance) / 100_000_000).toFixed(8)
    : '0.00000000';

  return {
    balance,
    balanceDisplay,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
