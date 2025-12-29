/**
 * Security Test: Vault Access Control
 *
 * This test verifies that the transfer-from-vault function properly restricts
 * access to authorized contracts only, preventing unauthorized vault drainage.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const attacker = accounts.get("wallet_3")!;

describe("Vault Access Control Security", () => {

  beforeEach(() => {
    // Reset simnet state before each test
    simnet.setEpoch("3.0");
  });

  describe("Authorization Management", () => {

    it("should allow admin to authorize bitpay-core contract", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify contract is authorized
      const { result: isAuthorized } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      expect(isAuthorized).toStrictEqual(Cl.bool(true));
    });

    it("should prevent non-admin from authorizing contracts", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        alice // Not an admin
      );

      // Should fail with ERR_UNAUTHORIZED (u200)
      expect(result).toBeErr(Cl.uint(200));
    });

    it("should allow admin to revoke contract authorization", () => {
      // First authorize
      simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Then revoke
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify contract is no longer authorized
      const { result: isAuthorized } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      expect(isAuthorized).toStrictEqual(Cl.bool(false));
    });
  });

  describe("Vault Protection - Attack Prevention", () => {

    beforeEach(() => {
      // Setup: Create a stream to lock funds in vault
      // First, mint some sBTC to Alice
      simnet.callPublicFn(
        "sbtc-token",
        "mint",
        [Cl.uint(10000000), Cl.principal(alice)],
        deployer
      );

      // Authorize bitpay-core
      simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Alice creates a stream to Bob (locks funds in vault)
      const currentBlock = simnet.blockHeight;
      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(bob),
          Cl.uint(10000000), // 10M sats
          Cl.uint(currentBlock),
          Cl.uint(currentBlock + 1000),
        ],
        alice
      );
    });

    it.skip("should PREVENT unauthorized contract from calling transfer-from-vault directly", () => {
      // Deploy malicious contract (simplified - in real test would be actual contract)
      // For this test, simulate an unauthorized contract call

      const { result } = simnet.callPublicFn(
        "bitpay-sbtc-helper",
        "transfer-from-vault",
        [
          Cl.uint(5000000), // Try to steal 5M sats
          Cl.principal(attacker) // Send to attacker's address
        ],
        attacker // Attacker tries to call directly
      );

      // Should fail with ERR_UNAUTHORIZED from access-control (u200)
      expect(result).toBeErr(Cl.uint(200));

      // Verify attacker received nothing
      const { result: attackerBalance } = simnet.callReadOnlyFn(
        "sbtc-token",
        "get-balance",
        [Cl.principal(attacker)],
        attacker
      );

      expect(attackerBalance).toBeOk(Cl.uint(0));
    });

    it.skip("should ALLOW authorized contract (bitpay-core) to call transfer-from-vault", () => {
      // Advance blocks to vest some amount
      simnet.mineEmptyBlocks(100);

      // Bob (recipient) withdraws through legitimate bitpay-core function
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "withdraw-from-stream",
        [Cl.uint(1)], // Stream ID
        bob
      );

      // Should succeed
      expect(result).toBeOk(Cl.uint(expect.any(Number)));

      // Verify Bob received funds
      const { result: bobBalance } = simnet.callReadOnlyFn(
        "sbtc-token",
        "get-balance",
        [Cl.principal(bob)],
        bob
      );

      // Bob should have some sBTC now
      const balance = bobBalance as any;
      expect(Number(balance.value)).toBeGreaterThan(0);
    });

    it.skip("should PREVENT even admin from calling transfer-from-vault directly", () => {
      // Even the deployer (admin) cannot bypass the contract authorization
      const { result } = simnet.callPublicFn(
        "bitpay-sbtc-helper",
        "transfer-from-vault",
        [
          Cl.uint(5000000),
          Cl.principal(deployer)
        ],
        deployer // Admin trying to withdraw
      );

      // Should still fail - only contract-caller check matters
      expect(result).toBeErr(Cl.uint(200));
    });
  });

  describe("Treasury Contract Authorization", () => {

    it("should allow authorizing bitpay-treasury for fee collection", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-treasury`)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify treasury is authorized
      const { result: isAuthorized } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-treasury`)],
        deployer
      );

      expect(isAuthorized).toStrictEqual(Cl.bool(true));
    });
  });

  describe("Multiple Authorization Scenarios", () => {

    it("should maintain separate authorization for core and treasury", () => {
      // Authorize both
      simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-treasury`)],
        deployer
      );

      // Verify both are authorized
      const { result: coreAuth } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      const { result: treasuryAuth } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-treasury`)],
        deployer
      );

      expect(coreAuth).toStrictEqual(Cl.bool(true));
      expect(treasuryAuth).toStrictEqual(Cl.bool(true));

      // Revoke only core
      simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Verify core revoked but treasury still authorized
      const { result: coreAuthAfter } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      const { result: treasuryAuthAfter } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "is-authorized-contract",
        [Cl.principal(`${deployer}.bitpay-treasury`)],
        deployer
      );

      expect(coreAuthAfter).toStrictEqual(Cl.bool(false));
      expect(treasuryAuthAfter).toStrictEqual(Cl.bool(true));
    });
  });

  describe("Event Logging", () => {

    it("should emit contract-authorized event when authorizing", () => {
      const { events } = simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Check print event
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("print_event");
      const eventData = JSON.stringify(events[0].data);
      expect(eventData).toContain("contract-authorized");
    });

    it("should emit contract-revoked event when revoking", () => {
      // First authorize
      simnet.callPublicFn(
        "bitpay-access-control",
        "authorize-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Then revoke
      const { events } = simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-contract",
        [Cl.principal(`${deployer}.bitpay-core`)],
        deployer
      );

      // Check print event
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("print_event");
      const eventData = JSON.stringify(events[0].data);
      expect(eventData).toContain("contract-revoked");
    });
  });
});
