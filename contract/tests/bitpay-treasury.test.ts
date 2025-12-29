import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT = "bitpay-treasury";

describe("bitpay-treasury contract", () => {
  // Setup: Authorize bitpay-treasury contract to call transfer-from-vault
  beforeEach(() => {
    simnet.callPublicFn(
      "bitpay-access-control",
      "authorize-contract",
      [Cl.contractPrincipal(deployer, "bitpay-treasury")],
      deployer
    );
  });

  describe("Initialization", () => {
    it("should initialize with zero balance", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-treasury-balance",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("should initialize with default fee of 0.5%", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-fee-bps",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(50)); // 50 basis points = 0.5%
    });

    it("should set deployer as admin", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-admin",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.principal(deployer));
    });

    it("should initialize total fees collected to zero", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-fees-collected",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });
  });

  describe("Fee Calculation", () => {
    it("should calculate 0.5% fee correctly", () => {
      const amount = 100000000; // 1 sBTC
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "calculate-fee",
        [Cl.uint(amount)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(500000)); // 0.5% of 1 sBTC
    });

    it("should calculate fee for different amounts", () => {
      const amount = 10000000; // 0.1 sBTC
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "calculate-fee",
        [Cl.uint(amount)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(50000)); // 0.5% of 0.1 sBTC
    });

    it("should calculate net amount after fee", () => {
      const amount = 100000000;
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-amount-after-fee",
        [Cl.uint(amount)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(99500000)); // 1 sBTC - 0.5%
    });
  });

  describe("Fee Collection", () => {
    it("should collect fee and update treasury balance", () => {
      const amount = 100000000;

      const { result } = simnet.callPublicFn(
        CONTRACT,
        "collect-fee",
        [Cl.uint(amount)],
        wallet1
      );

      const fee = 500000; // 0.5% of amount
      expect(result).toBeOk(Cl.uint(fee));
    });

    it("should update total fees collected", () => {
      const amount = 50000000;

      simnet.callPublicFn(
        CONTRACT,
        "collect-fee",
        [Cl.uint(amount)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-fees-collected",
        [],
        deployer
      );

      const collected = Number((result as any).value.value);
      expect(collected).toBeGreaterThan(0);
    });

    it("should fail to collect zero amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "collect-fee",
        [Cl.uint(0)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(502)); // ERR_INVALID_AMOUNT
    });

    it("should fail when protocol is paused", () => {
      // Pause protocol
      simnet.callPublicFn("bitpay-access-control", "pause-protocol", [], deployer);

      const { result } = simnet.callPublicFn(
        CONTRACT,
        "collect-fee",
        [Cl.uint(100000000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(503)); // ERR_PAUSED

      // Unpause for other tests
      simnet.callPublicFn("bitpay-access-control", "unpause-protocol", [], deployer);
    });
  });

  describe("Fee Management", () => {
    it("should allow admin to update fee percentage", () => {
      const newFeeBps = 100; // 1%

      const { result } = simnet.callPublicFn(
        CONTRACT,
        "set-fee-bps",
        [Cl.uint(newFeeBps)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(newFeeBps));
    });

    it("should reject fee update from non-admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "set-fee-bps",
        [Cl.uint(100)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(500)); // ERR_UNAUTHORIZED
    });

    it("should reject fee above maximum (10%)", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "set-fee-bps",
        [Cl.uint(1001)], // 10.01%
        deployer
      );

      expect(result).toBeErr(Cl.uint(502)); // ERR_INVALID_AMOUNT
    });

    it("should calculate fees with updated percentage", () => {
      // Set fee to 1%
      simnet.callPublicFn(CONTRACT, "set-fee-bps", [Cl.uint(100)], deployer);

      const amount = 100000000;
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "calculate-fee",
        [Cl.uint(amount)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1000000)); // 1% of 1 sBTC

      // Reset to default
      simnet.callPublicFn(CONTRACT, "set-fee-bps", [Cl.uint(50)], deployer);
    });
  });

  describe("Treasury Withdrawals", () => {
    it("should allow admin to withdraw from treasury", () => {
      // First collect some fees
      simnet.callPublicFn(CONTRACT, "collect-fee", [Cl.uint(100000000)], wallet1);

      const withdrawAmount = 10000;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw",
        [Cl.uint(withdrawAmount), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(withdrawAmount));
    });

    it("should reject withdrawal from non-admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw",
        [Cl.uint(1000), Cl.principal(wallet2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(500)); // ERR_UNAUTHORIZED
    });

    it("should reject withdrawal of zero amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw",
        [Cl.uint(0), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(502)); // ERR_INVALID_AMOUNT
    });

    it("should reject withdrawal exceeding balance", () => {
      const largeAmount = 999999999999;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw",
        [Cl.uint(largeAmount), Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(501)); // ERR_INSUFFICIENT_BALANCE
    });

    it("should update treasury balance after withdrawal", () => {
      // Collect fees
      simnet.callPublicFn(CONTRACT, "collect-fee", [Cl.uint(200000000)], wallet1);

      const initialBalance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-treasury-balance",
        [],
        deployer
      );
      const initial = Number((initialBalance.result as any).value.value);

      // Withdraw
      const withdrawAmount = 50000;
      simnet.callPublicFn(
        CONTRACT,
        "withdraw",
        [Cl.uint(withdrawAmount), Cl.principal(wallet2)],
        deployer
      );

      const finalBalance = simnet.callReadOnlyFn(
        CONTRACT,
        "get-treasury-balance",
        [],
        deployer
      );
      const final = Number((finalBalance.result as any).value.value);

      expect(final).toBe(initial - withdrawAmount);
    });
  });

  describe("Fee Distribution", () => {
    it("should allow admin to distribute fees to recipients", () => {
      // Collect fees
      simnet.callPublicFn(CONTRACT, "collect-fee", [Cl.uint(100000000)], wallet1);

      const amount = 10000;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(amount)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(amount));
    });

    it("should track recipient distribution totals", () => {
      // Collect fees
      simnet.callPublicFn(CONTRACT, "collect-fee", [Cl.uint(100000000)], wallet1);

      const amount = 5000;
      simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet3), Cl.uint(amount)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-recipient-total",
        [Cl.principal(wallet3)],
        deployer
      );

      const total = Number((result as any).value.value);
      expect(total).toBeGreaterThanOrEqual(amount);
    });

    it("should reject distribution from non-admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(1000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(500)); // ERR_UNAUTHORIZED
    });

    it("should reject distribution of zero amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(0)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(502)); // ERR_INVALID_AMOUNT
    });

    it("should reject distribution exceeding balance", () => {
      const largeAmount = 999999999999;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(largeAmount)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(501)); // ERR_INSUFFICIENT_BALANCE
    });
  });

  describe("Admin Transfer", () => {
    it("should allow admin to propose transfer", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "propose-admin-transfer",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(Cl.principal(wallet1));
    });

    it("should update admin after two-step transfer", () => {
      // Step 1: Propose transfer to wallet1
      simnet.callPublicFn(CONTRACT, "propose-admin-transfer", [Cl.principal(wallet1)], deployer);

      // Step 2: wallet1 accepts the transfer
      simnet.callPublicFn(CONTRACT, "accept-admin-transfer", [], wallet1);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-admin",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.principal(wallet1));

      // Transfer back to deployer for other tests
      simnet.callPublicFn(CONTRACT, "propose-admin-transfer", [Cl.principal(deployer)], wallet1);
      simnet.callPublicFn(CONTRACT, "accept-admin-transfer", [], deployer);
    });

    it("should reject admin transfer proposal from non-admin", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "propose-admin-transfer",
        [Cl.principal(wallet2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(500)); // ERR_UNAUTHORIZED
    });
  });

  describe("Recipient Tracking", () => {
    it("should return zero for recipients with no distributions", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-recipient-total",
        [Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("should accumulate multiple distributions to same recipient", () => {
      // Collect fees
      simnet.callPublicFn(CONTRACT, "collect-fee", [Cl.uint(200000000)], wallet1);

      // First distribution
      simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(1000)],
        deployer
      );

      // Second distribution
      simnet.callPublicFn(
        CONTRACT,
        "distribute-to-recipient",
        [Cl.principal(wallet2), Cl.uint(2000)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-recipient-total",
        [Cl.principal(wallet2)],
        deployer
      );

      const total = Number((result as any).value.value);
      expect(total).toBeGreaterThanOrEqual(3000);
    });
  });
});
