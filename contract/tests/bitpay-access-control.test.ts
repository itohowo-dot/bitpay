import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT = "bitpay-access-control";

describe("bitpay-access-control contract", () => {

  describe("Deployment and Initialization", () => {
    it("should initialize deployer as contract owner", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-contract-owner",
        [],
        deployer
      );

      expect(result).toStrictEqual(Cl.standardPrincipal(deployer));
    });

    it("should initialize deployer as admin", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "is-admin",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeBool(true);
    });

    it("should not have protocol paused initially", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "is-paused",
        [],
        deployer
      );

      expect(result).toBeBool(false);
    });

    it("should not have pending admin initially", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-pending-admin",
        [],
        deployer
      );

      expect(result).toBeNone();
    });
  });

  describe("Admin Management", () => {
    it("should allow admin to add new admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify wallet1 is now admin
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-admin",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(checkResult.result).toBeBool(true);
    });

    it("should fail when non-admin tries to add admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet2)],
        wallet1 // wallet1 is not admin
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should fail when trying to add existing admin", () => {
      // First add wallet1 as admin
      simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      // Try to add wallet1 again
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(202)); // ERR_ALREADY_ADMIN
    });

    it("should allow contract owner to remove admin", () => {
      // First add wallet1 as admin
      simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      // Remove wallet1
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify wallet1 is no longer admin
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-admin",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(checkResult.result).toBeBool(false);
    });

    it("should allow admin to remove themselves", () => {
      // First add wallet1 as admin
      simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );

      // wallet1 removes themselves
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-admin",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail when non-owner tries to remove other admin", () => {
      // Add wallet1 and wallet2 as admins
      simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet2)],
        deployer
      );

      // wallet1 tries to remove wallet2
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-admin",
        [Cl.principal(wallet2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(201)); // ERR_NOT_CONTRACT_OWNER
    });

    it("should fail when trying to remove non-admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-admin",
        [Cl.principal(wallet2)], // wallet2 is not admin
        deployer
      );

      expect(result).toBeErr(Cl.uint(203)); // ERR_NOT_ADMIN
    });
  });

  describe("Operator Management", () => {
    it("should allow admin to add operator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify wallet1 is operator
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-operator",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(checkResult.result).toBeBool(true);
    });

    it("should fail when non-admin tries to add operator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet2)],
        wallet1 // wallet1 is not admin
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should allow admin to remove operator", () => {
      // First add wallet1 as operator
      simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Remove wallet1
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify wallet1 is no longer operator
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-operator",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(checkResult.result).toBeBool(false);
    });

    it("should fail when non-admin tries to remove operator", () => {
      // Add wallet1 as operator
      simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      // wallet2 tries to remove operator
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "remove-operator",
        [Cl.principal(wallet1)],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });

  describe("Protocol Pause/Unpause", () => {
    it("should allow admin to pause protocol", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "pause-protocol",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify protocol is paused
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-paused",
        [],
        deployer
      );
      expect(checkResult.result).toBeBool(true);
    });

    it("should fail when non-admin tries to pause", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "pause-protocol",
        [],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should fail when trying to pause already paused protocol", () => {
      // First pause
      simnet.callPublicFn(CONTRACT, "pause-protocol", [], deployer);

      // Try to pause again
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "pause-protocol",
        [],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR_PAUSED
    });

    it("should allow admin to unpause protocol", () => {
      // First pause
      simnet.callPublicFn(CONTRACT, "pause-protocol", [], deployer);

      // Then unpause
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "unpause-protocol",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify protocol is not paused
      const checkResult = simnet.callReadOnlyFn(
        CONTRACT,
        "is-paused",
        [],
        deployer
      );
      expect(checkResult.result).toBeBool(false);
    });

    it("should fail when trying to unpause non-paused protocol", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "unpause-protocol",
        [],
        deployer
      );

      expect(result).toBeErr(Cl.uint(205)); // ERR_NOT_PAUSED
    });

    it("should fail when non-admin tries to unpause", () => {
      // First pause
      simnet.callPublicFn(CONTRACT, "pause-protocol", [], deployer);

      // wallet1 tries to unpause
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "unpause-protocol",
        [],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });

  describe("Admin Transfer (Two-Step)", () => {
    it("should allow contract owner to initiate admin transfer", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "initiate-admin-transfer",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify pending admin is set
      const pendingResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-pending-admin",
        [],
        deployer
      );
      expect(pendingResult.result).toBeSome(Cl.principal(wallet1));
    });

    it("should fail when non-owner tries to initiate transfer", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "initiate-admin-transfer",
        [Cl.principal(wallet2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(201)); // ERR_NOT_CONTRACT_OWNER
    });

    it("should allow pending admin to accept transfer", () => {
      // Initiate transfer
      simnet.callPublicFn(
        CONTRACT,
        "initiate-admin-transfer",
        [Cl.principal(wallet1)],
        deployer
      );

      // Accept transfer
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "accept-admin-transfer",
        [],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify wallet1 is now admin
      const adminCheck = simnet.callReadOnlyFn(
        CONTRACT,
        "is-admin",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(adminCheck.result).toBeBool(true);

      // Verify pending admin is cleared
      const pendingCheck = simnet.callReadOnlyFn(
        CONTRACT,
        "get-pending-admin",
        [],
        deployer
      );
      expect(pendingCheck.result).toBeNone();
    });

    it("should fail when wrong user tries to accept transfer", () => {
      // Initiate transfer to wallet1
      simnet.callPublicFn(
        CONTRACT,
        "initiate-admin-transfer",
        [Cl.principal(wallet1)],
        deployer
      );

      // wallet2 tries to accept
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "accept-admin-transfer",
        [],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(207)); // ERR_NOT_PENDING_ADMIN
    });

    it("should fail to accept when no pending admin set", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "accept-admin-transfer",
        [],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(206)); // ERR_PENDING_ADMIN_NOT_SET
    });
  });

  describe("Read-Only Helper Functions", () => {
    it("should correctly check has-role for admin", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "has-role",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeBool(true);
    });

    it("should correctly check has-role for operator", () => {
      // Add wallet1 as operator
      simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "has-role",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeBool(true);
    });

    it("should return false for has-role when user has no role", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "has-role",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(result).toBeBool(false);
    });

    it("should return ok when assert-not-paused and protocol not paused", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-not-paused",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should return error when assert-not-paused and protocol paused", () => {
      // Pause protocol
      simnet.callPublicFn(CONTRACT, "pause-protocol", [], deployer);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-not-paused",
        [],
        deployer
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR_PAUSED
    });

    it("should return ok when assert-is-admin for admin", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-is-admin",
        [Cl.principal(deployer)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should return error when assert-is-admin for non-admin", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-is-admin",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });

    it("should return ok when assert-has-role for user with role", () => {
      // Add wallet1 as operator
      simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-has-role",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should return error when assert-has-role for user without role", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "assert-has-role",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(200)); // ERR_UNAUTHORIZED
    });
  });

  describe("Integration: Role Management Flow", () => {
    it("should handle complete admin lifecycle", () => {
      // 1. Add wallet1 as admin
      const addResult = simnet.callPublicFn(
        CONTRACT,
        "add-admin",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(addResult.result).toBeOk(Cl.bool(true));

      // 2. wallet1 adds wallet2 as operator
      const addOpResult = simnet.callPublicFn(
        CONTRACT,
        "add-operator",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(addOpResult.result).toBeOk(Cl.bool(true));

      // 3. wallet1 pauses protocol
      const pauseResult = simnet.callPublicFn(
        CONTRACT,
        "pause-protocol",
        [],
        wallet1
      );
      expect(pauseResult.result).toBeOk(Cl.bool(true));

      // 4. Verify pause state
      const pauseCheck = simnet.callReadOnlyFn(
        CONTRACT,
        "is-paused",
        [],
        deployer
      );
      expect(pauseCheck.result).toBeBool(true);

      // 5. wallet1 removes themselves
      const removeResult = simnet.callPublicFn(
        CONTRACT,
        "remove-admin",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(removeResult.result).toBeOk(Cl.bool(true));

      // 6. Verify wallet1 no longer admin
      const adminCheck = simnet.callReadOnlyFn(
        CONTRACT,
        "is-admin",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(adminCheck.result).toBeBool(false);
    });
  });
});
