/**
 * Treasury Hooks
 * For fee collection and basic treasury operations
 */

import { useBitPayRead } from './use-bitpay-read';
import { useBitPayWrite } from './use-bitpay-write';
import { CONTRACT_NAMES, TREASURY_FUNCTIONS } from '@/lib/contracts/config';
import { uintCV, principalCV, stringAsciiCV } from '@stacks/transactions';

// ============================================
// READ HOOKS
// ============================================

/**
 * Get treasury balance
 */
export function useTreasuryBalance() {
  return useBitPayRead<bigint>(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.GET_TREASURY_BALANCE,
    [],
    true
  );
}

/**
 * Get fee in basis points (1 bp = 0.01%)
 */
export function useTreasuryFeeBps() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.GET_FEE_BPS,
    [],
    true
  );
}

/**
 * Get total fees collected
 */
export function useTotalFeesCollected() {
  return useBitPayRead<bigint>(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.GET_TOTAL_FEES_COLLECTED,
    [],
    true
  );
}

/**
 * Get cancellation fee in basis points
 */
export function useCancellationFeeBps() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.TREASURY,
    'get-cancellation-fee-bps',
    [],
    true
  );
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Collect fee from stream operation (internal use)
 */
export function useCollectFee() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.COLLECT_FEE
  );

  const collectFee = async (
    amount: bigint,
    feeType: string
  ): Promise<string | null> => {
    return write(uintCV(amount), stringAsciiCV(feeType));
  };

  return { collectFee, isLoading, error };
}

/**
 * Withdraw funds from treasury (admin or multi-sig only)
 */
export function useWithdrawFromTreasury() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.WITHDRAW
  );

  const withdraw = async (
    amount: bigint,
    recipient: string
  ): Promise<string | null> => {
    return write(uintCV(amount), principalCV(recipient));
  };

  return { withdraw, isLoading, error };
}

/**
 * Set fee basis points (admin only)
 */
export function useSetFeeBps() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    TREASURY_FUNCTIONS.SET_FEE_BPS
  );

  const setFeeBps = async (newFeeBps: number): Promise<string | null> => {
    return write(uintCV(newFeeBps));
  };

  return { setFeeBps, isLoading, error };
}

/**
 * Set cancellation fee basis points (admin only)
 */
export function useSetCancellationFeeBps() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'set-cancellation-fee-bps'
  );

  const setCancellationFeeBps = async (
    newFeeBps: number
  ): Promise<string | null> => {
    return write(uintCV(newFeeBps));
  };

  return { setCancellationFeeBps, isLoading, error };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate fee amount from basis points
 * @param amount - Amount in micro-units (satoshis)
 * @param feeBps - Fee in basis points (1 bp = 0.01%)
 * @returns Fee amount in micro-units
 */
export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

/**
 * Calculate net amount after fee deduction
 */
export function calculateNetAmount(amount: bigint, feeBps: number): bigint {
  const fee = calculateFee(amount, feeBps);
  return amount - fee;
}

/**
 * Convert basis points to percentage
 * @param bps - Basis points
 * @returns Percentage (e.g., 100 bps = 1%)
 */
export function bpsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Convert percentage to basis points
 * @param percentage - Percentage (e.g., 1% = 1)
 * @returns Basis points (e.g., 1% = 100 bps)
 */
export function percentageToBps(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Format fee for display
 * @param feeBps - Fee in basis points
 * @returns Formatted string (e.g., "1.5%")
 */
export function formatFee(feeBps: number): string {
  const percentage = bpsToPercentage(feeBps);
  return `${percentage.toFixed(2)}%`;
}

/**
 * Validate fee basis points
 * @param bps - Fee in basis points
 * @returns True if valid (0-10000), false otherwise
 */
export function isValidFeeBps(bps: number): boolean {
  return bps >= 0 && bps <= 10000 && Number.isInteger(bps);
}
