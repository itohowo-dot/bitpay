/**
 * Access Control Hooks
 * For admin management, protocol pause/unpause, and contract authorization
 */

import { useBitPayRead } from './use-bitpay-read';
import { useBitPayWrite } from './use-bitpay-write';
import { CONTRACT_NAMES, ACCESS_CONTROL_FUNCTIONS } from '@/lib/contracts/config';
import { principalCV } from '@stacks/transactions';

// ============================================
// READ HOOKS
// ============================================

/**
 * Check if address is an admin
 */
export function useIsAdmin(address: string | null) {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.IS_ADMIN,
    address ? [principalCV(address)] : [],
    !!address
  );
}

/**
 * Check if protocol is paused
 */
export function useIsProtocolPaused() {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.IS_PAUSED,
    [],
    true
  );
}

/**
 * Check if address is an operator
 */
export function useIsOperator(address: string | null) {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'is-operator',
    address ? [principalCV(address)] : [],
    !!address
  );
}

/**
 * Check if contract is authorized
 */
export function useIsContractAuthorized(contractAddress: string | null) {
  return useBitPayRead<boolean>(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'is-authorized-contract',
    contractAddress ? [principalCV(contractAddress)] : [],
    !!contractAddress
  );
}

/**
 * Get pending admin transfer
 */
export function usePendingAdminTransfer() {
  return useBitPayRead<string | null>(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'get-pending-admin-transfer',
    [],
    true
  );
}

// ============================================
// WRITE HOOKS - ADMIN MANAGEMENT
// ============================================

/**
 * Add a new admin
 */
export function useAddAdmin() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.ADD_ADMIN
  );

  const addAdmin = async (newAdmin: string): Promise<string | null> => {
    return write(principalCV(newAdmin));
  };

  return { addAdmin, isLoading, error };
}

/**
 * Remove an admin
 */
export function useRemoveAdmin() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.REMOVE_ADMIN
  );

  const removeAdmin = async (admin: string): Promise<string | null> => {
    return write(principalCV(admin));
  };

  return { removeAdmin, isLoading, error };
}

/**
 * Add an operator
 */
export function useAddOperator() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'add-operator'
  );

  const addOperator = async (newOperator: string): Promise<string | null> => {
    return write(principalCV(newOperator));
  };

  return { addOperator, isLoading, error };
}

/**
 * Remove an operator
 */
export function useRemoveOperator() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'remove-operator'
  );

  const removeOperator = async (operator: string): Promise<string | null> => {
    return write(principalCV(operator));
  };

  return { removeOperator, isLoading, error };
}

// ============================================
// WRITE HOOKS - CONTRACT AUTHORIZATION
// ============================================

/**
 * Authorize a contract to access vault
 */
export function useAuthorizeContract() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'authorize-contract'
  );

  const authorizeContract = async (
    contractAddress: string
  ): Promise<string | null> => {
    return write(principalCV(contractAddress));
  };

  return { authorizeContract, isLoading, error };
}

/**
 * Revoke contract authorization
 */
export function useRevokeContract() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'revoke-contract'
  );

  const revokeContract = async (
    contractAddress: string
  ): Promise<string | null> => {
    return write(principalCV(contractAddress));
  };

  return { revokeContract, isLoading, error };
}

// ============================================
// WRITE HOOKS - PROTOCOL PAUSE/UNPAUSE
// ============================================

/**
 * Pause the protocol (emergency use)
 */
export function usePauseProtocol() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.PAUSE_PROTOCOL
  );

  const pauseProtocol = async (): Promise<string | null> => {
    return write();
  };

  return { pauseProtocol, isLoading, error };
}

/**
 * Unpause the protocol
 */
export function useUnpauseProtocol() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    ACCESS_CONTROL_FUNCTIONS.UNPAUSE_PROTOCOL
  );

  const unpauseProtocol = async (): Promise<string | null> => {
    return write();
  };

  return { unpauseProtocol, isLoading, error };
}

// ============================================
// WRITE HOOKS - ADMIN TRANSFER
// ============================================

/**
 * Initiate admin transfer (2-step process)
 */
export function useInitiateAdminTransfer() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'initiate-admin-transfer'
  );

  const initiateTransfer = async (newAdmin: string): Promise<string | null> => {
    return write(principalCV(newAdmin));
  };

  return { initiateTransfer, isLoading, error };
}

/**
 * Accept admin transfer (called by pending admin)
 */
export function useAcceptAdminTransfer() {
  const { write, isLoading, error } = useBitPayWrite(
    CONTRACT_NAMES.ACCESS_CONTROL,
    'accept-admin-transfer'
  );

  const acceptTransfer = async (): Promise<string | null> => {
    return write();
  };

  return { acceptTransfer, isLoading, error };
}
