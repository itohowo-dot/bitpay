/**
 * NFT Hooks
 * For recipient NFTs (soul-bound) and obligation NFTs (transferable)
 */

import { useBitPayRead } from './use-bitpay-read';
import { useBitPayWrite } from './use-bitpay-write';
import { CONTRACT_NAMES, NFT_FUNCTIONS, OBLIGATION_NFT_FUNCTIONS } from '@/lib/contracts/config';
import { uintCV, principalCV, stringAsciiCV } from '@stacks/transactions';

// ============================================
// RECIPIENT NFT HOOKS (Soul-Bound)
// ============================================

/**
 * Get owner of recipient NFT
 */
export function useRecipientNFTOwner(tokenId: number | null) {
  return useBitPayRead<string | null>(
    CONTRACT_NAMES.NFT,
    NFT_FUNCTIONS.GET_OWNER,
    tokenId !== null ? [uintCV(tokenId)] : [],
    tokenId !== null
  );
}

/**
 * Get last minted recipient NFT ID
 */
export function useLastRecipientNFTId() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.NFT,
    NFT_FUNCTIONS.GET_LAST_TOKEN_ID,
    [],
    true
  );
}

/**
 * Get recipient NFT token URI
 */
export function useRecipientNFTTokenURI(tokenId: number | null) {
  return useBitPayRead<string | null>(
    CONTRACT_NAMES.NFT,
    NFT_FUNCTIONS.GET_TOKEN_URI,
    tokenId !== null ? [uintCV(tokenId)] : [],
    tokenId !== null
  );
}

/**
 * Mint recipient NFT (soul-bound to stream recipient)
 */
export function useMintRecipientNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.NFT,
    NFT_FUNCTIONS.MINT
  );

  const mintRecipientNFT = async (
    streamId: number,
    recipient: string
  ): Promise<string | null> => {
    return write(uintCV(streamId), principalCV(recipient));
  };

  return { mintRecipientNFT, isLoading, error };
}

/**
 * Burn recipient NFT
 */
export function useBurnRecipientNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.NFT,
    NFT_FUNCTIONS.BURN
  );

  const burnRecipientNFT = async (tokenId: number): Promise<string | null> => {
    return write(uintCV(tokenId));
  };

  return { burnRecipientNFT, isLoading, error };
}

/**
 * Set base token URI for recipient NFTs (admin only)
 */
export function useSetRecipientNFTBaseURI() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.NFT,
    'set-base-token-uri'
  );

  const setBaseURI = async (uri: string): Promise<string | null> => {
    return write(stringAsciiCV(uri));
  };

  return { setBaseURI, isLoading, error };
}

// ============================================
// OBLIGATION NFT HOOKS (Transferable)
// ============================================

/**
 * Get owner of obligation NFT
 */
export function useObligationNFTOwner(tokenId: number | null) {
  return useBitPayRead<string | null>(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.GET_OWNER,
    tokenId !== null ? [uintCV(tokenId)] : [],
    tokenId !== null
  );
}

/**
 * Get last minted obligation NFT ID
 */
export function useLastObligationNFTId() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.GET_LAST_TOKEN_ID,
    [],
    true
  );
}

/**
 * Get obligation NFT token URI
 */
export function useObligationNFTTokenURI(tokenId: number | null) {
  return useBitPayRead<string | null>(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.GET_TOKEN_URI,
    tokenId !== null ? [uintCV(tokenId)] : [],
    tokenId !== null
  );
}

/**
 * Transfer obligation NFT
 */
export function useTransferObligationNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.TRANSFER
  );

  const transferObligationNFT = async (
    tokenId: number,
    sender: string,
    recipient: string
  ): Promise<string | null> => {
    return write(uintCV(tokenId), principalCV(sender), principalCV(recipient));
  };

  return { transferObligationNFT, isLoading, error };
}

/**
 * Mint obligation NFT (for stream sender)
 */
export function useMintObligationNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.MINT
  );

  const mintObligationNFT = async (
    streamId: number,
    sender: string
  ): Promise<string | null> => {
    return write(uintCV(streamId), principalCV(sender));
  };

  return { mintObligationNFT, isLoading, error };
}

/**
 * Burn obligation NFT
 */
export function useBurnObligationNFT() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.BURN
  );

  const burnObligationNFT = async (tokenId: number): Promise<string | null> => {
    return write(uintCV(tokenId));
  };

  return { burnObligationNFT, isLoading, error };
}

/**
 * Set base token URI for obligation NFTs (admin only)
 */
export function useSetObligationNFTBaseURI() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.OBLIGATION_NFT,
    OBLIGATION_NFT_FUNCTIONS.SET_BASE_TOKEN_URI
  );

  const setBaseURI = async (uri: string): Promise<string | null> => {
    return write(stringAsciiCV(uri));
  };

  return { setBaseURI, isLoading, error };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user owns a specific NFT
 */
export function doesUserOwnNFT(
  ownerAddress: string | null,
  userAddress: string | null
): boolean {
  if (!ownerAddress || !userAddress) return false;
  return ownerAddress.toLowerCase() === userAddress.toLowerCase();
}

/**
 * Generate token URI for a stream
 */
export function generateTokenURI(
  baseURI: string,
  tokenId: number,
  metadata?: Record<string, any>
): string {
  if (metadata) {
    const jsonMetadata = JSON.stringify(metadata);
    const base64Metadata = Buffer.from(jsonMetadata).toString('base64');
    return `data:application/json;base64,${base64Metadata}`;
  }
  return `${baseURI}${tokenId}`;
}
