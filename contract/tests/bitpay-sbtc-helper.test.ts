import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

// sBTC contract address for simnet
const HELPER_CONTRACT = "bitpay-sbtc-helper";

describe("bitpay-sbtc-helper contract", () => {
  // Setup: Authorize contracts for testing transfer-from-vault
  beforeEach(() => {
    simnet.callPublicFn(
      "bitpay-access-control",
      "authorize-contract",
      [Cl.contractPrincipal(deployer, "bitpay-sbtc-helper")],
      deployer
    );
  });

  describe("Deployment", () => {
    it("should deploy successfully", () => {
      expect(simnet.blockHeight).toBeDefined();
    });
  });

  describe("Read-Only Functions", () => {

    it("should get user balance correctly", () => {
      // Note: Clarinet auto-funds wallets with 10 sBTC (1000000000 sats)
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-user-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1000000000)); // 10 sBTC auto-funded
    });

    it("should get user total balance correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-user-total-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1000000000)); // 10 sBTC auto-funded
    });

    it("should return balance for auto-funded wallet", () => {
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-user-balance",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(result).toBeOk(Cl.uint(1000000000)); // Also auto-funded
    });

    it("should get vault balance for any contract", () => {
      const contractPrincipal = `${deployer}.${HELPER_CONTRACT}`;

      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-vault-balance",
        [Cl.principal(contractPrincipal)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0)); // Initially 0
    });

    it("should get sBTC token name", () => {
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-token-name",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.stringAscii("sBTC"));
    });

    it("should get sBTC token symbol", () => {
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-token-symbol",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.stringAscii("sBTC"));
    });

    it("should get sBTC token decimals", () => {
      const { result } = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-token-decimals",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(8));
    });
  });

  describe("transfer-to-vault", () => {

    it("should successfully transfer sBTC to vault", () => {
      // Wallets are auto-funded with 10 sBTC (1000000000 sats)
      const amount = 100000000; // 1 sBTC

      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(amount), Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Check wallet1 balance decreased
      const balanceResult = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-user-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balanceResult.result).toBeOk(Cl.uint(900000000)); // 9 sBTC remaining
    });

    it("should fail if amount is zero", () => {
      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(0), Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR_INVALID_AMOUNT
    });

    it("should fail if sender is not tx-sender", () => {
      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(100000000), Cl.principal(wallet1)],
        wallet2 // wallet2 trying to transfer wallet1's funds
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR_UNAUTHORIZED
    });

    it("should fail if insufficient balance", () => {
      const { result} = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(2000000000), Cl.principal(wallet1)], // More than 10 sBTC balance
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR_SBTC_TRANSFER_FAILED
    });

    it("should transfer correct amount to contract vault", () => {
      const amount = 200000000; // 2 sBTC
      const contractPrincipal = `${deployer}.${HELPER_CONTRACT}`;

      simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(amount), Cl.principal(wallet1)],
        wallet1
      );

      // Check contract vault balance
      const vaultBalance = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-vault-balance",
        [Cl.principal(contractPrincipal)],
        deployer
      );

      expect(vaultBalance.result).toBeOk(Cl.uint(amount));
    });
  });

  describe("transfer-from-vault", () => {

    beforeEach(() => {
      // Transfer from auto-funded wallet1 to vault
      simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(300000000), Cl.principal(wallet1)], // 3 sBTC to vault
        wallet1
      );
    });

    it("should fail when called directly by non-contract", () => {
      const amount = 100000000; // 1 sBTC

      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-from-vault",
        [Cl.uint(amount), Cl.principal(wallet2)],
        deployer // Direct call should fail - only authorized contracts allowed
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should fail with zero amount when called directly", () => {
      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-from-vault",
        [Cl.uint(0), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED (fails before amount check)
    });

    it("should fail with insufficient balance when called directly", () => {
      const { result } = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-from-vault",
        [Cl.uint(400000000), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED (fails before balance check)
    });
  });

  describe("Integration: Full deposit and withdrawal flow", () => {

    it("should handle complete flow: deposit -> withdraw", () => {
      const depositAmount = 250000000; // 2.5 sBTC
      const withdrawAmount = 150000000; // 1.5 sBTC
      const contractPrincipal = `${deployer}.${HELPER_CONTRACT}`;

      // Step 1: Transfer to vault (wallet1 auto-funded with 10 sBTC)
      const depositResult = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-to-vault",
        [Cl.uint(depositAmount), Cl.principal(wallet1)],
        wallet1
      );
      expect(depositResult.result).toBeOk(Cl.bool(true));

      // Step 2: Verify vault balance
      const vaultBalance = simnet.callReadOnlyFn(
        HELPER_CONTRACT,
        "get-vault-balance",
        [Cl.principal(contractPrincipal)],
        deployer
      );
      expect(vaultBalance.result).toBeOk(Cl.uint(depositAmount));

      // Step 3: Attempt to withdraw from vault (should fail - only authorized contracts)
      const withdrawResult = simnet.callPublicFn(
        HELPER_CONTRACT,
        "transfer-from-vault",
        [Cl.uint(withdrawAmount), Cl.principal(wallet2)],
        deployer
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });
});
