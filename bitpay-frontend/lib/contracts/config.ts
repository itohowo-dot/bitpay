/**
 * BitPay Smart Contract Configuration
 * Deployed contract addresses and network settings
 */

import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

// Network configuration
export const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

export const getStacksNetwork = (): StacksNetwork => {
  return NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

// API URLs
export const STACKS_API_URL = NETWORK === 'mainnet'
  ? 'https://api.hiro.so'
  : 'https://api.testnet.hiro.so';

// Contract deployer address (from testnet deployment)
export const BITPAY_DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_BITPAY_DEPLOYER_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7';

// sBTC Token contract (from testnet deployment)
export const SBTC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SBTC_TOKEN_ADDRESS || 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT';
export const SBTC_TOKEN_CONTRACT = 'sbtc-token';

// BitPay Contract Names (V3 - Deployed on Testnet)
export const CONTRACT_NAMES = {
  CORE: 'bitpay-core-v3',
  ACCESS_CONTROL: 'bitpay-access-control-v3',
  SBTC_HELPER: 'bitpay-sbtc-helper-v3',
  NFT: 'bitpay-nft-v3',
  OBLIGATION_NFT: 'bitpay-obligation-nft-v3',
  TREASURY: 'bitpay-treasury-v3',
  MARKETPLACE: 'bitpay-marketplace-v3',
} as const;

// Full contract identifiers
export const CONTRACTS = {
  CORE: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.CORE}`,
  ACCESS_CONTROL: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.ACCESS_CONTROL}`,
  SBTC_HELPER: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.SBTC_HELPER}`,
  NFT: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.NFT}`,
  OBLIGATION_NFT: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.OBLIGATION_NFT}`,
  TREASURY: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.TREASURY}`,
  MARKETPLACE: `${BITPAY_DEPLOYER_ADDRESS}.${CONTRACT_NAMES.MARKETPLACE}`,
  SBTC_TOKEN: `${SBTC_TOKEN_ADDRESS}.${SBTC_TOKEN_CONTRACT}`,
} as const;

// Contract function names
export const CORE_FUNCTIONS = {
  // Write functions
  CREATE_STREAM: 'create-stream',
  WITHDRAW_FROM_STREAM: 'withdraw-from-stream',
  WITHDRAW_PARTIAL: 'withdraw-partial',
  CANCEL_STREAM: 'cancel-stream',
  UPDATE_STREAM_SENDER: 'update-stream-sender',

  // Read functions
  GET_STREAM: 'get-stream',
  GET_SENDER_STREAMS: 'get-sender-streams',
  GET_RECIPIENT_STREAMS: 'get-recipient-streams',
  GET_VESTED_AMOUNT: 'get-vested-amount',
  GET_VESTED_AMOUNT_AT_BLOCK: 'get-vested-amount-at-block',
  GET_WITHDRAWABLE_AMOUNT: 'get-withdrawable-amount',
  GET_NEXT_STREAM_ID: 'get-next-stream-id',
  IS_STREAM_ACTIVE: 'is-stream-active',
} as const;

export const NFT_FUNCTIONS = {
  // Write functions
  MINT: 'mint',
  TRANSFER: 'transfer',
  BURN: 'burn',

  // Read functions
  GET_OWNER: 'get-owner',
  GET_LAST_TOKEN_ID: 'get-last-token-id',
  GET_TOKEN_URI: 'get-token-uri',
} as const;

export const TREASURY_FUNCTIONS = {
  // Write functions
  COLLECT_FEE: 'collect-fee',
  WITHDRAW: 'withdraw',
  SET_FEE_BPS: 'set-fee-bps',

  // Read functions
  GET_TREASURY_BALANCE: 'get-treasury-balance',
  GET_FEE_BPS: 'get-fee-bps',
  GET_TOTAL_FEES_COLLECTED: 'get-total-fees-collected',
} as const;

export const ACCESS_CONTROL_FUNCTIONS = {
  // Write functions
  ADD_ADMIN: 'add-admin',
  REMOVE_ADMIN: 'remove-admin',
  PAUSE_PROTOCOL: 'pause-protocol',
  UNPAUSE_PROTOCOL: 'unpause-protocol',

  // Read functions
  IS_ADMIN: 'is-admin',
  IS_PAUSED: 'is-paused',
} as const;

export const SBTC_HELPER_FUNCTIONS = {
  // Write functions
  TRANSFER_TO_VAULT: 'transfer-to-vault',
  TRANSFER_FROM_VAULT: 'transfer-from-vault',

  // Read functions
  GET_VAULT_BALANCE: 'get-vault-balance',
  GET_USER_BALANCE: 'get-user-balance',
} as const;

export const MARKETPLACE_FUNCTIONS = {
  // Write functions
  LIST_NFT: 'list-nft',
  UPDATE_LISTING_PRICE: 'update-listing-price',
  CANCEL_LISTING: 'cancel-listing',
  BUY_NFT: 'buy-nft',
  INITIATE_PURCHASE: 'initiate-purchase',
  COMPLETE_PURCHASE: 'complete-purchase',
  CANCEL_EXPIRED_PURCHASE: 'cancel-expired-purchase',
  ADD_AUTHORIZED_BACKEND: 'add-authorized-backend',
  REMOVE_AUTHORIZED_BACKEND: 'remove-authorized-backend',
  SET_MARKETPLACE_FEE: 'set-marketplace-fee',

  // Read functions
  GET_LISTING: 'get-listing',
  GET_PENDING_PURCHASE: 'get-pending-purchase',
  GET_MARKETPLACE_FEE: 'get-marketplace-fee',
  IS_BACKEND_AUTHORIZED: 'is-backend-authorized',
} as const;

export const OBLIGATION_NFT_FUNCTIONS = {
  // Write functions
  TRANSFER: 'transfer',
  MINT: 'mint',
  BURN: 'burn',
  SET_BASE_TOKEN_URI: 'set-base-token-uri',

  // Read functions
  GET_OWNER: 'get-owner',
  GET_LAST_TOKEN_ID: 'get-last-token-id',
  GET_TOKEN_URI: 'get-token-uri',
} as const;

// Stream status enum
export enum StreamStatus {
  PENDING = 'pending',      // start-block > current-block
  ACTIVE = 'active',        // start-block <= current-block < end-block && !cancelled
  COMPLETED = 'completed',  // current-block >= end-block && !cancelled
  CANCELLED = 'cancelled',  // cancelled = true
}

// Type definitions for contract responses
export interface StreamData {
  sender: string;
  recipient: string;
  amount: bigint;
  'start-block': bigint;
  'end-block': bigint;
  withdrawn: bigint;
  cancelled: boolean;
  'cancelled-at-block': bigint | null;
}

export interface StreamWithId extends StreamData {
  id: bigint;
  status: StreamStatus;
  vestedAmount: bigint;
  withdrawableAmount: bigint;
}

// Utility: Convert micro-sBTC (satoshis) to display format
// sBTC uses 8 decimals (1 sBTC = 100,000,000 satoshis)
export const microToDisplay = (micro: any): string => {
  // Handle null/undefined
  if (micro === null || micro === undefined) {
    return '0.00000000';
  }

  // Handle if it's an object with a value property (from cvToJSON)
  if (typeof micro === 'object' && 'value' in micro) {
    return microToDisplay(micro.value);
  }

  try {
    // Handle string input
    if (typeof micro === 'string') {
      // Check if it's already in display format (has decimal point and reasonable value)
      if (micro.includes('.')) {
        const parsed = parseFloat(micro);
        // If it's a reasonable BTC amount (< 21 million), it's already formatted
        if (parsed < 21_000_000) {
          return parsed.toFixed(8);
        }
        // Otherwise it might be "50000000.30000000" which is wrong - parse as int
        const justInteger = micro.split('.')[0];
        const value = BigInt(justInteger);
        const btc = Number(value) / 100_000_000;
        return btc.toFixed(8);
      }
      // Integer string - convert to BigInt
      const value = BigInt(micro);
      const btc = Number(value) / 100_000_000;
      return btc.toFixed(8);
    }

    // Handle number input (shouldn't be used for large values due to precision loss)
    if (typeof micro === 'number') {
      // If it's already a small decimal, it's in BTC
      if (micro < 21_000_000 && micro % 1 !== 0) {
        return micro.toFixed(8);
      }
      // Otherwise treat as satoshis
      const btc = micro / 100_000_000;
      return btc.toFixed(8);
    }

    // Handle bigint - convert from satoshis to BTC
    if (typeof micro === 'bigint') {
      const btc = Number(micro) / 100_000_000;
      return btc.toFixed(8);
    }

    // Fallback
    console.warn('microToDisplay received unexpected type:', typeof micro, micro);
    return '0.00000000';
  } catch (error) {
    console.error('Error in microToDisplay:', micro, typeof micro, error);
    return '0.00000000';
  }
};

// Utility: Convert display format to micro-sBTC (satoshis)
// sBTC uses 8 decimals (1 sBTC = 100,000,000 satoshis)
export const displayToMicro = (display: number | string): bigint => {
  const value = typeof display === 'string' ? parseFloat(display) : display;
  return BigInt(Math.floor(value * 100_000_000));
};

// Block time constants (Stacks blocks are ~10 minutes on Bitcoin)
export const BLOCKS_PER_HOUR = 6;
export const BLOCKS_PER_DAY = BLOCKS_PER_HOUR * 24; // ~144 blocks
export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7;
export const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30;

// Calculate stream status from block heights
export const getStreamStatus = (
  startBlock: bigint,
  endBlock: bigint,
  currentBlock: bigint,
  cancelled: boolean
): StreamStatus => {
  if (cancelled) return StreamStatus.CANCELLED;
  if (currentBlock < startBlock) return StreamStatus.PENDING;
  if (currentBlock >= endBlock) return StreamStatus.COMPLETED;
  return StreamStatus.ACTIVE;
};

// Calculate vested amount (same logic as contract)
export const calculateVestedAmount = (
  stream: StreamData,
  currentBlock: bigint
): bigint => {
  const { amount, 'start-block': startBlock, 'end-block': endBlock, cancelled } = stream;

  // Helper function to safely convert to BigInt
  const toBigInt = (value: any): bigint => {
    if (value === null || value === undefined) return BigInt(0);
    if (typeof value === 'object' && 'value' in value) {
      return BigInt(value.value);
    }
    return BigInt(value);
  };

  // Convert to BigInt (handles both primitive and object with value property)
  const amountBigInt = toBigInt(amount);
  const startBlockBigInt = toBigInt(startBlock);
  const endBlockBigInt = toBigInt(endBlock);

  // Before start: nothing vested
  if (currentBlock < startBlockBigInt) return BigInt(0);

  // After end or cancelled: everything vested
  if (currentBlock >= endBlockBigInt || cancelled) return amountBigInt;

  // During stream: linear vesting
  const elapsed = currentBlock - startBlockBigInt;
  const duration = endBlockBigInt - startBlockBigInt;
  return (amountBigInt * elapsed) / duration;
};

// Calculate withdrawable amount
export const calculateWithdrawableAmount = (
  stream: StreamData,
  currentBlock: bigint
): bigint => {
  const vested = calculateVestedAmount(stream, currentBlock);
  const withdrawn = stream.withdrawn;

  // Helper function to safely convert to BigInt
  const toBigInt = (value: any): bigint => {
    if (value === null || value === undefined) return BigInt(0);
    if (typeof value === 'object' && 'value' in value) {
      return BigInt(value.value);
    }
    return BigInt(value);
  };

  const withdrawnBigInt = toBigInt(withdrawn);

  return vested - withdrawnBigInt;
};

// Calculate stream progress percentage
export const calculateProgress = (
  startBlock: any,
  endBlock: any,
  currentBlock: any
): number => {
  // Helper to convert to BigInt
  const toBigInt = (value: any): bigint => {
    if (value === null || value === undefined) return BigInt(0);
    if (typeof value === 'object' && 'value' in value) {
      return BigInt(value.value);
    }
    if (typeof value === 'bigint') return value;
    return BigInt(value);
  };

  const startBigInt = toBigInt(startBlock);
  const endBigInt = toBigInt(endBlock);
  const currentBigInt = toBigInt(currentBlock);

  if (currentBigInt < startBigInt) return 0;
  if (currentBigInt >= endBigInt) return 100;

  const elapsed = Number(currentBigInt - startBigInt);
  const duration = Number(endBigInt - startBigInt);
  return (elapsed / duration) * 100;
};
