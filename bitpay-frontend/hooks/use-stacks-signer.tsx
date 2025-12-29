"use client";

import { useTurnkey } from "@turnkey/react-wallet-kit";
import {
  makeUnsignedSTXTokenTransfer,
  broadcastTransaction,
  TransactionSigner,
  sigHashPreSign,
  SingleSigSpendingCondition,
  createMessageSignature,
  type StacksTransactionWire,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { useState } from "react";

export interface StacksAccount {
  address: string;
  publicKey: string;
}

export function useStacksSigner() {
  const turnkeyContext = useTurnkey();
  const [isLoading, setIsLoading] = useState(false);

  // Safely access Turnkey properties
  const client = (turnkeyContext as any).client;
  const currentWallet = (turnkeyContext as any).currentWallet || (turnkeyContext as any).wallet;

  // Get Stacks account from current wallet
  const getStacksAccount = (): StacksAccount | null => {
    if (!currentWallet) return null;

    // Find the secp256k1 account (Stacks uses secp256k1 curve)
    const stacksAccount = currentWallet.accounts?.find(
      (acc: any) => acc.curve === "CURVE_SECP256K1"
    );

    if (!stacksAccount) {
      console.error("No Stacks account found in wallet");
      return null;
    }

    return {
      address: stacksAccount.address,
      publicKey: stacksAccount.publicKey,
    };
  };

  // Get network configuration
  const getNetwork = () => {
    const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
    return networkType === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
  };

  /**
   * Sign a Stacks STX token transfer transaction
   */
  const signSTXTransfer = async (params: {
    recipient: string;
    amount: bigint;
    nonce?: bigint;
    fee?: bigint;
    memo?: string;
  }): Promise<StacksTransactionWire> => {
    if (!client) {
      throw new Error("Turnkey client not initialized");
    }

    const stacksAccount = getStacksAccount();
    if (!stacksAccount) {
      throw new Error("No Stacks wallet connected");
    }

    setIsLoading(true);

    try {
      const network = getNetwork();
      const networkString = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";

      // Build unsigned transaction
      let transaction = await makeUnsignedSTXTokenTransfer({
        recipient: params.recipient,
        amount: params.amount,
        publicKey: stacksAccount.publicKey,
        nonce: params.nonce || BigInt(0),
        fee: params.fee || BigInt(180),
        network: networkString as "testnet" | "mainnet",
        memo: params.memo,
      });

      // Generate the signing hash
      const signer = new TransactionSigner(transaction);
      const preSignSigHash = sigHashPreSign(
        signer.sigHash,
        transaction.auth.authType,
        transaction.auth.spendingCondition.fee,
        transaction.auth.spendingCondition.nonce
      );

      // Sign with Turnkey
      const payload = `0x${preSignSigHash}`;
      const signature = await client.apiClient().signRawPayload({
        payload,
        signWith: stacksAccount.publicKey,
        encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
        hashFunction: "HASH_FUNCTION_NO_OP", // Important: payload is already hashed
      });

      // Format signature: V + R + S (pad R and S to 64 chars)
      const nextSig = `${signature.v}${signature.r.padStart(64, "0")}${signature.s.padStart(64, "0")}`;

      // Attach signature to transaction
      let spendingCondition = transaction.auth
        .spendingCondition as SingleSigSpendingCondition;
      spendingCondition.signature = createMessageSignature(nextSig);

      return transaction;
    } catch (error) {
      console.error("Error signing STX transfer:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign a contract call transaction
   */
  const signContractCall = async (params: {
    contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: any[];
    nonce?: bigint;
    fee?: bigint;
    postConditionMode?: number;
    postConditions?: any[];
  }): Promise<StacksTransactionWire> => {
    if (!client) {
      throw new Error("Turnkey client not initialized");
    }

    const stacksAccount = getStacksAccount();
    if (!stacksAccount) {
      throw new Error("No Stacks wallet connected");
    }

    setIsLoading(true);

    try {
      // Import makeContractCall dynamically when needed
      const { makeUnsignedContractCall } = await import("@stacks/transactions");
      const networkString = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";

      // Build unsigned contract call
      let transaction = await makeUnsignedContractCall({
        contractAddress: params.contractAddress,
        contractName: params.contractName,
        functionName: params.functionName,
        functionArgs: params.functionArgs,
        publicKey: stacksAccount.publicKey,
        nonce: params.nonce || BigInt(0),
        fee: params.fee || BigInt(180),
        network: networkString as "testnet" | "mainnet",
        postConditionMode: params.postConditionMode,
        postConditions: params.postConditions,
      });

      // Generate signing hash
      const signer = new TransactionSigner(transaction);
      const preSignSigHash = sigHashPreSign(
        signer.sigHash,
        transaction.auth.authType,
        transaction.auth.spendingCondition.fee,
        transaction.auth.spendingCondition.nonce
      );

      // Sign with Turnkey
      const payload = `0x${preSignSigHash}`;
      const signature = await client.apiClient().signRawPayload({
        payload,
        signWith: stacksAccount.publicKey,
        encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
        hashFunction: "HASH_FUNCTION_NO_OP",
      });

      // Format signature
      const nextSig = `${signature.v}${signature.r.padStart(64, "0")}${signature.s.padStart(64, "0")}`;

      // Attach signature
      let spendingCondition = transaction.auth
        .spendingCondition as SingleSigSpendingCondition;
      spendingCondition.signature = createMessageSignature(nextSig);

      return transaction;
    } catch (error) {
      console.error("Error signing contract call:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Broadcast a signed transaction to the Stacks network
   */
  const broadcastStacksTransaction = async (
    transaction: StacksTransactionWire
  ): Promise<string> => {
    setIsLoading(true);

    try {
      const networkString = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";

      const result = await broadcastTransaction({
        transaction: transaction as StacksTransactionWire,
        network: networkString as "testnet" | "mainnet",
      });

      if (typeof result === "string") {
        return result; // Transaction ID
      } else if (result && typeof result === "object" && "txid" in result) {
        return (result as any).txid;
      } else {
        throw new Error("Invalid broadcast result");
      }
    } catch (error) {
      console.error("Error broadcasting transaction:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get current nonce for the wallet address
   */
  const getNonce = async (): Promise<bigint> => {
    const stacksAccount = getStacksAccount();
    if (!stacksAccount) {
      throw new Error("No Stacks wallet connected");
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_STACKS_API_URL || "https://api.testnet.hiro.so";
      const response = await fetch(
        `${apiUrl}/v2/accounts/${stacksAccount.address}?proof=0`
      );
      const data = await response.json();
      return BigInt(data.nonce || 0);
    } catch (error) {
      console.error("Error fetching nonce:", error);
      return BigInt(0);
    }
  };

  return {
    // Account info
    stacksAccount: getStacksAccount(),
    stacksAddress: getStacksAccount()?.address,

    // Transaction signing
    signSTXTransfer,
    signContractCall,
    broadcastStacksTransaction,

    // Utilities
    getNonce,
    isLoading,

    // Raw Turnkey access (for advanced use)
    turnkeyClient: client,
    currentWallet,
  };
}
