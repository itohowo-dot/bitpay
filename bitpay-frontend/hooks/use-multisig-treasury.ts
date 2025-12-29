import { useBitPayRead } from './use-bitpay-read';
import { useBitPayWrite } from './use-bitpay-write';
import { CONTRACT_NAMES } from '@/lib/contracts/config';
import { uintCV, principalCV, stringAsciiCV } from '@stacks/transactions';

// Types
export interface WithdrawalProposal {
  id: number;
  proposer: string;
  amount: bigint;
  recipient: string;
  approvals: string[];
  executed: boolean;
  proposedAt: number;
  expiresAt: number;
  description: string;
  timelockElapsed?: boolean;
  canExecute?: boolean;
}

export interface AdminProposal {
  id: number;
  proposer: string;
  action: 'add' | 'remove';
  targetAdmin: string;
  approvals: string[];
  executed: boolean;
  proposedAt: number;
  expiresAt: number;
}

export interface MultiSigConfig {
  requiredSignatures: number;
  totalSlots: number;
  timelockBlocks: number;
  proposalExpiryBlocks: number;
  dailyLimit: bigint;
  withdrawnToday: bigint;
  lastWithdrawalBlock: number;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Get multi-sig configuration
 */
export function useMultiSigConfig() {
  return useBitPayRead<MultiSigConfig>(
    CONTRACT_NAMES.TREASURY,
    'get-multisig-config',
    [],
    true
  );
}

/**
 * Get withdrawal proposal by ID
 */
export function useWithdrawalProposal(proposalId: number | null) {
  return useBitPayRead<WithdrawalProposal | null>(
    CONTRACT_NAMES.TREASURY,
    'get-withdrawal-proposal',
    proposalId !== null ? [uintCV(proposalId)] : [],
    proposalId !== null
  );
}

/**
 * Get admin management proposal by ID
 */
export function useAdminProposal(proposalId: number | null) {
  return useBitPayRead<AdminProposal | null>(
    CONTRACT_NAMES.TREASURY,
    'get-admin-proposal',
    proposalId !== null ? [uintCV(proposalId)] : [],
    proposalId !== null
  );
}

/**
 * Check if user is a multi-sig admin
 */
export function useIsMultiSigAdmin(address: string | null) {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.TREASURY,
    'is-multisig-admin-check',
    address ? [principalCV(address)] : [],
    !!address
  );
}

/**
 * Get count of active multi-sig admins
 */
export function useAdminCount() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.TREASURY,
    'count-admins',
    [],
    true
  );
}

/**
 * Get next proposal ID (for creating new proposals)
 */
export function useNextProposalId() {
  return useBitPayRead<number>(
    CONTRACT_NAMES.TREASURY,
    'get-next-proposal-id',
    [],
    true
  );
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Propose a multi-sig withdrawal
 */
export function useProposeWithdrawal() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'propose-multisig-withdrawal'
  );

  const propose = async (
    amount: bigint,
    recipient: string,
    description: string
  ): Promise<string | null> => {
    return write(
      uintCV(amount),
      principalCV(recipient),
      stringAsciiCV(description)
    );
  };

  return { propose, isLoading, error };
}

/**
 * Approve a withdrawal proposal
 */
export function useApproveWithdrawal() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'approve-multisig-withdrawal'
  );

  const approve = async (proposalId: number): Promise<string | null> => {
    return write(uintCV(proposalId));
  };

  return { approve, isLoading, error };
}

/**
 * Execute an approved withdrawal
 */
export function useExecuteWithdrawal() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'execute-multisig-withdrawal'
  );

  const execute = async (proposalId: number): Promise<string | null> => {
    return write(uintCV(proposalId));
  };

  return { execute, isLoading, error };
}

/**
 * Propose adding a new admin
 */
export function useProposeAddAdmin() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'propose-add-admin'
  );

  const proposeAdd = async (newAdmin: string): Promise<string | null> => {
    return write(principalCV(newAdmin));
  };

  return { proposeAdd, isLoading, error };
}

/**
 * Propose removing an admin
 */
export function useProposeRemoveAdmin() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'propose-remove-admin'
  );

  const proposeRemove = async (targetAdmin: string): Promise<string | null> => {
    return write(principalCV(targetAdmin));
  };

  return { proposeRemove, isLoading, error };
}

/**
 * Approve an admin management proposal
 */
export function useApproveAdminProposal() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'approve-admin-proposal'
  );

  const approve = async (proposalId: number): Promise<string | null> => {
    return write(uintCV(proposalId));
  };

  return { approve, isLoading, error };
}

/**
 * Execute an admin management proposal
 */
export function useExecuteAdminProposal() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.TREASURY,
    'execute-admin-proposal'
  );

  const execute = async (proposalId: number): Promise<string | null> => {
    return write(uintCV(proposalId));
  };

  return { execute, isLoading, error };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Check if proposal timelock has elapsed
 */
export function useHasTimelockElapsed(
  proposedAt: number | null,
  currentBlock: number | null
): boolean {
  if (!proposedAt || !currentBlock) return false;
  const TIMELOCK_BLOCKS = 144; // 24 hours
  return currentBlock >= proposedAt + TIMELOCK_BLOCKS;
}

/**
 * Check if proposal has expired
 */
export function useHasProposalExpired(
  expiresAt: number | null,
  currentBlock: number | null
): boolean {
  if (!expiresAt || !currentBlock) return false;
  return currentBlock >= expiresAt;
}

/**
 * Calculate blocks until timelock elapses
 */
export function useBlocksUntilTimelock(
  proposedAt: number | null,
  currentBlock: number | null
): number {
  if (!proposedAt || !currentBlock) return 0;
  const TIMELOCK_BLOCKS = 144;
  const unlockBlock = proposedAt + TIMELOCK_BLOCKS;
  return Math.max(0, unlockBlock - currentBlock);
}

/**
 * Check if user has already approved a proposal
 */
export function useHasUserApproved(
  approvals: string[] | null,
  userAddress: string | null
): boolean {
  if (!approvals || !userAddress) return false;
  return approvals.some(addr => addr.toLowerCase() === userAddress.toLowerCase());
}
