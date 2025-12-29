import { Turnkey as TurnkeyServerSDK } from "@turnkey/sdk-server";

/**
 * Server-side Turnkey client for automated operations
 * This should ONLY be used in server-side code (API routes, server components, etc.)
 *
 * Use cases:
 * - Automated stream withdrawals
 * - Server-initiated transactions
 * - Sub-organization management
 */
export const turnkeyServer = new TurnkeyServerSDK({
  apiBaseUrl: process.env.TURNKEY_API_BASE_URL || "https://api.turnkey.com",
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
});

/**
 * Get a user's sub-organization by their sub-org ID
 */
export async function getUserSubOrg(subOrgId: string) {
  try {
    const response = await turnkeyServer.apiClient().getSubOrgById({
      organizationId: subOrgId,
    });
    return response;
  } catch (error) {
    console.error("Error getting sub-organization:", error);
    throw error;
  }
}

/**
 * Get wallets for a specific sub-organization
 */
export async function getSubOrgWallets(subOrgId: string) {
  try {
    const response = await turnkeyServer.apiClient().getWallets({
      organizationId: subOrgId,
    });
    return response.wallets || [];
  } catch (error) {
    console.error("Error getting sub-org wallets:", error);
    throw error;
  }
}

/**
 * Sign a transaction on behalf of a user (for automated operations)
 * WARNING: This should only be used for authorized automated operations
 */
export async function signTransactionForUser(params: {
  subOrgId: string;
  publicKey: string;
  payload: string;
}) {
  try {
    const signature = await turnkeyServer.apiClient().signRawPayload({
      organizationId: params.subOrgId,
      payload: params.payload,
      signWith: params.publicKey,
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction: "HASH_FUNCTION_NO_OP",
    });

    return signature;
  } catch (error) {
    console.error("Error signing transaction:", error);
    throw error;
  }
}

/**
 * Create a delegated API key for a sub-organization
 * This allows the server to perform actions on behalf of the user
 */
export async function createDelegatedApiKey(params: {
  subOrgId: string;
  userId: string;
  apiKeyName: string;
  publicKey: string;
  curveType?: "API_KEY_CURVE_P256" | "API_KEY_CURVE_SECP256K1" | "API_KEY_CURVE_ED25519";
  expirationSeconds?: string;
}) {
  try {
    const response = await turnkeyServer.apiClient().createApiKeys({
      organizationId: params.subOrgId,
      userId: params.userId,
      apiKeys: [
        {
          apiKeyName: params.apiKeyName,
          publicKey: params.publicKey,
          curveType: params.curveType || "API_KEY_CURVE_SECP256K1", // Default to secp256k1 for Stacks
          expirationSeconds: params.expirationSeconds || "31536000", // 1 year default
        },
      ],
    });

    // The response contains apiKeyIds array, not apiKeys
    return {
      apiKeyIds: response.apiKeyIds,
      activity: response.activity,
    };
  } catch (error) {
    console.error("Error creating delegated API key:", error);
    throw error;
  }
}
