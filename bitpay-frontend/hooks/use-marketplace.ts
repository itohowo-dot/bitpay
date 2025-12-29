/**
 * Marketplace Hooks
 * For listing and purchasing obligation NFTs
 */

import { useBitPayRead } from './use-bitpay-read';
import { useBitPayWrite } from './use-bitpay-write';
import { CONTRACT_NAMES, MARKETPLACE_FUNCTIONS } from '@/lib/contracts/config';
import { uintCV, principalCV, someCV, noneCV } from '@stacks/transactions';

// Types
export interface Listing {
  seller: string;
  price: bigint;
  listedAt: number;
  active: boolean;
}

export interface PendingPurchase {
  buyer: string;
  streamId: number;
  price: bigint;
  initiatedAt: number;
  expiresAt: number;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Get NFT listing details
 */
export function useListing(streamId: number | null) {
  return useBitPayRead<Listing | null>(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.GET_LISTING,
    streamId !== null ? [uintCV(streamId)] : [],
    streamId !== null
  );
}

/**
 * Get pending purchase details
 */
export function usePendingPurchase(streamId: number | null) {
  return useBitPayRead<PendingPurchase | null>(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.GET_PENDING_PURCHASE,
    streamId !== null ? [uintCV(streamId)] : [],
    streamId !== null
  );
}

/**
 * Get marketplace fee in basis points
 */
export function useMarketplaceFee() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.GET_MARKETPLACE_FEE,
    [],
    true
  );
}

/**
 * Check if backend is authorized
 */
export function useIsBackendAuthorized(backend: string | null) {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.IS_BACKEND_AUTHORIZED,
    backend ? [principalCV(backend)] : [],
    !!backend
  );
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * List an obligation NFT for sale
 */
export function useListNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.LIST_NFT
  );

  const listNFT = async (
    streamId: number,
    price: bigint
  ): Promise<string | null> => {
    return write(uintCV(streamId), uintCV(price));
  };

  return { listNFT, isLoading, error };
}

/**
 * Update listing price
 */
export function useUpdateListingPrice() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.UPDATE_LISTING_PRICE
  );

  const updatePrice = async (
    streamId: number,
    newPrice: bigint
  ): Promise<string | null> => {
    return write(uintCV(streamId), uintCV(newPrice));
  };

  return { updatePrice, isLoading, error };
}

/**
 * Cancel a listing
 */
export function useCancelListing() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.CANCEL_LISTING
  );

  const cancelListing = async (streamId: number): Promise<string | null> => {
    return write(uintCV(streamId));
  };

  return { cancelListing, isLoading, error };
}

/**
 * Buy NFT directly (instant purchase)
 */
export function useBuyNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.BUY_NFT
  );

  const buyNFT = async (streamId: number): Promise<string | null> => {
    return write(uintCV(streamId));
  };

  return { buyNFT, isLoading, error };
}

/**
 * Initiate purchase (for payment gateway)
 */
export function useInitiatePurchase() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.INITIATE_PURCHASE
  );

  const initiatePurchase = async (
    streamId: number
  ): Promise<string | null> => {
    return write(uintCV(streamId));
  };

  return { initiatePurchase, isLoading, error };
}

/**
 * Complete purchase (backend authorized)
 */
export function useCompletePurchase() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.COMPLETE_PURCHASE
  );

  const completePurchase = async (
    streamId: number,
    buyer: string
  ): Promise<string | null> => {
    return write(uintCV(streamId), principalCV(buyer));
  };

  return { completePurchase, isLoading, error };
}

/**
 * Cancel expired purchase
 */
export function useCancelExpiredPurchase() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.CANCEL_EXPIRED_PURCHASE
  );

  const cancelExpired = async (streamId: number): Promise<string | null> => {
    return write(uintCV(streamId));
  };

  return { cancelExpired, isLoading, error };
}

/**
 * Add authorized backend (admin only)
 */
export function useAddAuthorizedBackend() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.ADD_AUTHORIZED_BACKEND
  );

  const addBackend = async (backend: string): Promise<string | null> => {
    return write(principalCV(backend));
  };

  return { addBackend, isLoading, error };
}

/**
 * Remove authorized backend (admin only)
 */
export function useRemoveAuthorizedBackend() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.REMOVE_AUTHORIZED_BACKEND
  );

  const removeBackend = async (backend: string): Promise<string | null> => {
    return write(principalCV(backend));
  };

  return { removeBackend, isLoading, error };
}

/**
 * Set marketplace fee (admin only)
 */
export function useSetMarketplaceFee() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.MARKETPLACE,
    MARKETPLACE_FUNCTIONS.SET_MARKETPLACE_FEE
  );

  const setFee = async (feeBps: number): Promise<string | null> => {
    return write(uintCV(feeBps));
  };

  return { setFee, isLoading, error };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate marketplace fee from price
 */
export function calculateMarketplaceFee(price: bigint, feeBps: number): bigint {
  return (price * BigInt(feeBps)) / BigInt(10000);
}

/**
 * Calculate net amount after fee
 */
export function calculateNetAmount(price: bigint, feeBps: number): bigint {
  const fee = calculateMarketplaceFee(price, feeBps);
  return price - fee;
}

/**
 * Check if purchase has expired
 */
export function hasPurchaseExpired(
  expiresAt: number | null,
  currentBlock: number | null
): boolean {
  if (!expiresAt || !currentBlock) return false;
  return currentBlock >= expiresAt;
}
