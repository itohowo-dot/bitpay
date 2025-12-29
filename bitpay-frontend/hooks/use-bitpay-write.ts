/**
 * useBitPayWrite Hook
 * Write operations for BitPay contracts using Stacks wallet
 */

import { useState, useCallback } from 'react';
import {
  openContractCall,
  ContractCallOptions,
} from '@stacks/connect';
import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
} from '@stacks/transactions';
import {
  getStacksNetwork,
  BITPAY_DEPLOYER_ADDRESS,
  CONTRACT_NAMES,
  CORE_FUNCTIONS,
  displayToMicro,
} from '@/lib/contracts/config';

export interface WriteResult {
  txId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseWriteReturn {
  write: (...args: any[]) => Promise<string | null>;
  txId: string | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for creating a new payment stream
 */
export function useCreateStream(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (
    recipient: string,
    amount: number | string, // in BTC (will be converted to sats)
    startBlock: number,
    endBlock: number
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const amountInSats = displayToMicro(amount);
      const network = getStacksNetwork();

      // Using Allow mode temporarily to test if contract call works
      // The wallet cannot auto-generate post-conditions for nested contract calls
      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.CREATE_STREAM,
        functionArgs: [
          principalCV(recipient),
          uintCV(amountInSats),
          uintCV(startBlock),
          uintCV(endBlock),
        ],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Stream created successfully:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error creating stream:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stream';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Hook for withdrawing from a stream (full amount)
 */
export function useWithdrawFromStream(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (streamId: number | bigint): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();
      const streamIdUint = typeof streamId === 'bigint' ? streamId : BigInt(streamId);

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.WITHDRAW_FROM_STREAM,
        functionArgs: [uintCV(streamIdUint)],
        postConditionMode: PostConditionMode.Allow, // Allow because we're receiving funds
        onFinish: (data) => {
          console.log('Withdrawal successful:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error withdrawing from stream:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Hook for withdrawing a specific amount from a stream (partial withdrawal)
 */
export function useWithdrawPartial(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (streamId: number | bigint, amount: number | string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();
      const streamIdUint = typeof streamId === 'bigint' ? streamId : BigInt(streamId);
      const amountInSats = displayToMicro(amount);

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.WITHDRAW_PARTIAL,
        functionArgs: [uintCV(streamIdUint), uintCV(amountInSats)],
        postConditionMode: PostConditionMode.Allow, // Allow because we're receiving funds
        onFinish: (data) => {
          console.log('Partial withdrawal successful:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error withdrawing from stream:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Hook for updating stream sender after NFT transfer
 */
export function useUpdateStreamSender(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (streamId: number | bigint, newSender: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();
      const streamIdUint = typeof streamId === 'bigint' ? streamId : BigInt(streamId);

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.UPDATE_STREAM_SENDER,
        functionArgs: [uintCV(streamIdUint), principalCV(newSender)],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Stream sender updated successfully:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error updating stream sender:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stream sender';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Hook for cancelling a stream
 */
export function useCancelStream(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (streamId: number | bigint): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();
      const streamIdUint = typeof streamId === 'bigint' ? streamId : BigInt(streamId);

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.CORE,
        functionName: CORE_FUNCTIONS.CANCEL_STREAM,
        functionArgs: [uintCV(streamIdUint)],
        postConditionMode: PostConditionMode.Allow, // Allow because funds are being returned
        onFinish: (data) => {
          console.log('Stream cancelled successfully:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error cancelling stream:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel stream';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Hook for minting stream NFT
 */
export function useMintStreamNFT(): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (
    streamId: number | bigint,
    recipient: string
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();
      const streamIdUint = typeof streamId === 'bigint' ? streamId : BigInt(streamId);

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAMES.NFT,
        functionName: 'mint',
        functionArgs: [
          uintCV(streamIdUint),
          principalCV(recipient),
        ],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          console.log('NFT minted successfully:', data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error('Error minting NFT:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint NFT';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}

/**
 * Generic hook for contract writes
 */
export function useBitPayWrite(
  contractName: string,
  functionName: string
): UseWriteReturn {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = useCallback(async (...args: any[]): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setTxId(null);

      const network = getStacksNetwork();

      const options: ContractCallOptions = {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: BITPAY_DEPLOYER_ADDRESS,
        contractName,
        functionName,
        functionArgs: args,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log(`${contractName}.${functionName} successful:`, data.txId);
          setTxId(data.txId);
          setIsLoading(false);
        },
        onCancel: () => {
          console.log('Transaction cancelled by user');
          setError('Transaction cancelled');
          setIsLoading(false);
        },
      };

      await openContractCall(options);
      return txId;
    } catch (err) {
      console.error(`Error calling ${contractName}.${functionName}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [contractName, functionName]);

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { write, txId, isLoading, error, reset };
}
