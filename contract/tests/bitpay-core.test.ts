import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;
const recipient = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT = "bitpay-core";

describe("bitpay-core contract", () => {
  // Setup: Authorize bitpay-core and bitpay-treasury contracts
  beforeEach(() => {
    simnet.callPublicFn(
      "bitpay-access-control",
      "authorize-contract",
      [Cl.contractPrincipal(deployer, "bitpay-core")],
      deployer
    );
    simnet.callPublicFn(
      "bitpay-access-control",
      "authorize-contract",
      [Cl.contractPrincipal(deployer, "bitpay-treasury")],
      deployer
    );
  });

  describe("Stream Creation", () => {
    it("should create a stream successfully", () => {
      const amount = 100000000; // 1 sBTC
      const startBlock = simnet.blockHeight + 1;
      const endBlock = startBlock + 100;

      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );

      // Extract stream ID from result
      expect(createResult.result).toBeOk(expect.any(Object));
      const streamId = Number((createResult.result as any).value.value);

      // Verify stream was created
      const stream = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stream",
        [Cl.uint(streamId)],
        sender
      );

      expect(stream.result).toBeSome(
        Cl.tuple({
          sender: Cl.principal(sender),
          recipient: Cl.principal(recipient),
          amount: Cl.uint(amount),
          "start-block": Cl.uint(startBlock),
          "end-block": Cl.uint(endBlock),
          withdrawn: Cl.uint(0),
          cancelled: Cl.bool(false),
          "cancelled-at-block": Cl.none()
        })
      );
    });

    it("should fail to create stream with zero amount", () => {
      const startBlock = simnet.blockHeight + 1;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(0),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );

      expect(result).toBeErr(Cl.uint(302)); // ERR_INVALID_AMOUNT
    });

    it("should fail to create stream to self", () => {
      const startBlock = simnet.blockHeight + 1;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(sender),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );

      expect(result).toBeErr(Cl.uint(306)); // ERR_INVALID_RECIPIENT
    });

    it("should fail with start block in past", () => {
      const currentBlock = simnet.blockHeight;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(Math.max(1, currentBlock - 10)),
          Cl.uint(currentBlock + 100)
        ],
        sender
      );

      expect(result).toBeErr(Cl.uint(307)); // ERR_START_BLOCK_IN_PAST
    });

    it("should fail with duration less than minimum", () => {
      const startBlock = simnet.blockHeight + 1;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 5) // Less than MIN_STREAM_DURATION (10)
        ],
        sender
      );

      expect(result).toBeErr(Cl.uint(303)); // ERR_INVALID_DURATION
    });

    it("should fail when protocol is paused", () => {
      // Pause protocol
      simnet.callPublicFn("bitpay-access-control", "pause-protocol", [], deployer);

      const startBlock = simnet.blockHeight + 1;
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );

      expect(result).toBeErr(Cl.uint(204)); // ERR_PAUSED

      // Unpause for other tests
      simnet.callPublicFn("bitpay-access-control", "unpause-protocol", [], deployer);
    });

    it("should increment stream ID counter", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create first stream
      const first = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const firstId = Number((first.result as any).value.value);

      // Create second stream
      const second = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(50000000),
          Cl.uint(startBlock + 1),
          Cl.uint(startBlock + 101)
        ],
        sender
      );
      const secondId = Number((second.result as any).value.value);

      // Second ID should be first ID + 1
      expect(secondId).toBe(firstId + 1);
    });

    it("should track sender streams", () => {
      const startBlock = simnet.blockHeight + 1;

      // Get initial count
      const initialStreams = simnet.callReadOnlyFn(
        CONTRACT,
        "get-sender-streams",
        [Cl.principal(sender)],
        sender
      );
      const initialCount = (initialStreams.result as any).list.length;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-sender-streams",
        [Cl.principal(sender)],
        sender
      );

      // Should have one more stream
      const finalCount = (result as any).list.length;
      expect(finalCount).toBe(initialCount + 1);

      // Should include the new stream ID
      const streamIds = (result as any).list.map((item: any) => Number(item.value));
      expect(streamIds).toContain(streamId);
    });

    it("should track recipient streams", () => {
      const startBlock = simnet.blockHeight + 1;

      // Get initial count
      const initialStreams = simnet.callReadOnlyFn(
        CONTRACT,
        "get-recipient-streams",
        [Cl.principal(recipient)],
        recipient
      );
      const initialCount = (initialStreams.result as any).list.length;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-recipient-streams",
        [Cl.principal(recipient)],
        recipient
      );

      // Should have one more stream
      const finalCount = (result as any).list.length;
      expect(finalCount).toBe(initialCount + 1);

      // Should include the new stream ID
      const streamIds = (result as any).list.map((item: any) => Number(item.value));
      expect(streamIds).toContain(streamId);
    });
  });

  describe("Vesting Calculation", () => {
    it("should return zero vested before start block", () => {
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      // Create stream starting in future
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-vested-amount",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeUint(0);
    });

    it("should calculate linear vesting correctly", () => {
      const amount = 100000000; // 1 sBTC
      const startBlock = simnet.blockHeight + 1;
      const duration = 100;
      const endBlock = startBlock + duration;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine 50 blocks (50% of duration)
      simnet.mineEmptyBlocks(50);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-vested-amount",
        [Cl.uint(streamId)],
        sender
      );

      // Should have ~50% vested (allowing for rounding)
      const vested = Number((result as any).value);
      expect(vested).toBeGreaterThanOrEqual(49000000);
      expect(vested).toBeLessThanOrEqual(51000000);
    });

    it("should return full amount after end block", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;
      const endBlock = startBlock + 100;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine past end block
      simnet.mineEmptyBlocks(150);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-vested-amount",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeUint(amount);
    });

    it("should calculate vested amount at specific block", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;
      const endBlock = startBlock + 100;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Check vesting at 25% through
      const checkBlock = startBlock + 25;
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-vested-amount-at-block",
        [Cl.uint(streamId), Cl.uint(checkBlock)],
        sender
      );

      // Should have 25% vested
      const expected = amount / 4;
      expect(result).toBeUint(expected);
    });
  });

  describe("Withdrawals", () => {
    it("should allow recipient to withdraw vested amount", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;
      const endBlock = startBlock + 100;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine 50 blocks
      simnet.mineEmptyBlocks(50);

      // Withdraw
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );

      // Allow for rounding (should be ~50% vested)
      const withdrawn = Number(((result as any).value as any).value);
      expect(withdrawn).toBeGreaterThanOrEqual(49000000);
      expect(withdrawn).toBeLessThanOrEqual(51000000);
    });

    it("should fail when non-recipient tries to withdraw", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      simnet.mineEmptyBlocks(50);

      // Sender tries to withdraw (not recipient)
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeErr(Cl.uint(300)); // ERR_UNAUTHORIZED
    });

    it("should fail when nothing to withdraw", () => {
      const startBlock = simnet.blockHeight + 2; // Start in future

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Don't mine blocks, try to withdraw immediately
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );

      expect(result).toBeErr(Cl.uint(305)); // ERR_NOTHING_TO_WITHDRAW
    });

    it("should fail for non-existent stream", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(999)],
        recipient
      );

      expect(result).toBeErr(Cl.uint(301)); // ERR_STREAM_NOT_FOUND
    });

    it("should track withdrawn amount correctly", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // First withdrawal at 25%
      simnet.mineEmptyBlocks(25);
      simnet.callPublicFn(CONTRACT, "withdraw-from-stream", [Cl.uint(streamId)], recipient);

      // Second withdrawal at 50%
      simnet.mineEmptyBlocks(25);
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );

      // Should only get additional 25% (not 50%), allow for rounding
      const withdrawn = Number(((result as any).value as any).value);
      expect(withdrawn).toBeGreaterThanOrEqual(24000000);
      expect(withdrawn).toBeLessThanOrEqual(26000000);
    });

    it("should return correct withdrawable amount", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      simnet.mineEmptyBlocks(50);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-withdrawable-amount",
        [Cl.uint(streamId)],
        recipient
      );

      expect(result).toBeOk(Cl.uint(50000000));
    });
  });

  describe("Stream Cancellation", () => {
    it("should allow sender to cancel stream", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine 50 blocks (50% vested)
      simnet.mineEmptyBlocks(50);

      // Cancel
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "cancel-stream",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify stream is cancelled
      const stream = simnet.callReadOnlyFn(CONTRACT, "get-stream", [Cl.uint(streamId)], sender);
      const streamData = (stream.result as any).value.data;
      expect(streamData.cancelled).toStrictEqual(Cl.bool(true));
    });

    it("should fail when non-sender tries to cancel", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Recipient tries to cancel
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "cancel-stream",
        [Cl.uint(streamId)],
        recipient
      );

      expect(result).toBeErr(Cl.uint(300)); // ERR_UNAUTHORIZED
    });

    it("should fail when cancelling already cancelled stream", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // First cancellation
      simnet.callPublicFn(CONTRACT, "cancel-stream", [Cl.uint(streamId)], sender);

      // Second cancellation attempt
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "cancel-stream",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeErr(Cl.uint(304)); // ERR_STREAM_ALREADY_CANCELLED
    });

    it("should return unvested amount to sender on cancellation", () => {
      const amount = 100000000;
      const startBlock = simnet.blockHeight + 1;

      // Get sender initial balance
      const initialBalance = simnet.callReadOnlyFn(
        "bitpay-sbtc-helper",
        "get-user-balance",
        [Cl.principal(sender)],
        sender
      );
      const initialValue = Number(((initialBalance.result as any).value as any).value);

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine 50 blocks (50% vested, 50% unvested)
      simnet.mineEmptyBlocks(50);

      // Cancel
      simnet.callPublicFn(CONTRACT, "cancel-stream", [Cl.uint(streamId)], sender);

      // Check sender balance increased by ~50%
      const finalBalance = simnet.callReadOnlyFn(
        "bitpay-sbtc-helper",
        "get-user-balance",
        [Cl.principal(sender)],
        sender
      );
      const finalValue = Number(((finalBalance.result as any).value as any).value);

      // Should have gotten back ~50 million sats minus 1% cancellation fee
      // 50M unvested - 1% fee (500K) = ~49.5M, but allow for rounding
      const returned = finalValue - (initialValue - amount);
      expect(returned).toBeGreaterThanOrEqual(48000000); // Allow for fee + rounding
      expect(returned).toBeLessThanOrEqual(50000000);
    });
  });

  describe("Read-Only Functions", () => {
    it("should return next stream ID", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-next-stream-id",
        [],
        deployer
      );

      // Should be a uint (value depends on previous tests)
      expect(typeof (result as any).value).toBe("bigint");
    });

    it("should check if stream is active", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "is-stream-active",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeBool(true);
    });

    it("should return false for cancelled stream", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create and cancel stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      simnet.callPublicFn(CONTRACT, "cancel-stream", [Cl.uint(streamId)], sender);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "is-stream-active",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeBool(false);
    });

    it("should return false for ended stream", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Mine past end
      simnet.mineEmptyBlocks(150);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "is-stream-active",
        [Cl.uint(streamId)],
        sender
      );

      expect(result).toBeBool(false);
    });
  });

  describe("Integration: Full Stream Lifecycle", () => {
    it("should handle complete stream lifecycle", () => {
      const amount = 100000000; // 1 sBTC
      const startBlock = simnet.blockHeight + 1;
      const duration = 100;
      const endBlock = startBlock + duration;

      // 1. Create stream
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock)
        ],
        sender
      );
      expect(createResult.result).toBeOk(expect.any(Object));
      const streamId = Number((createResult.result as any).value.value);

      // 2. Mine to 25% completion
      simnet.mineEmptyBlocks(25);

      // 3. First withdrawal
      const withdraw1 = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );
      const withdraw1Amount = Number(((withdraw1.result as any).value as any).value);
      expect(withdraw1Amount).toBeGreaterThanOrEqual(24000000);
      expect(withdraw1Amount).toBeLessThanOrEqual(26000000);

      // 4. Mine to 75% completion
      simnet.mineEmptyBlocks(50);

      // 5. Second withdrawal
      const withdraw2 = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );
      const withdraw2Amount = Number(((withdraw2.result as any).value as any).value);
      expect(withdraw2Amount).toBeGreaterThanOrEqual(49000000);
      expect(withdraw2Amount).toBeLessThanOrEqual(51000000);

      // 6. Mine to completion
      simnet.mineEmptyBlocks(50);

      // 7. Final withdrawal
      const withdraw3 = simnet.callPublicFn(
        CONTRACT,
        "withdraw-from-stream",
        [Cl.uint(streamId)],
        recipient
      );
      const withdraw3Amount = Number(((withdraw3.result as any).value as any).value);
      // Remaining amount (may be less than 25M due to rounding in previous withdrawals)
      expect(withdraw3Amount).toBeGreaterThanOrEqual(22000000);
      expect(withdraw3Amount).toBeLessThanOrEqual(27000000);

      // 8. Verify no more to withdraw
      const withdrawable = simnet.callReadOnlyFn(
        CONTRACT,
        "get-withdrawable-amount",
        [Cl.uint(streamId)],
        recipient
      );
      expect(withdrawable.result).toBeOk(Cl.uint(0));
    });
  });
});
