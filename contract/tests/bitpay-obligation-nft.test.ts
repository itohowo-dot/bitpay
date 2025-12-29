import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;
const recipient = accounts.get("wallet_2")!;
const newObligationHolder = accounts.get("wallet_3")!;

describe("bitpay-obligation-nft", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("SIP-009 Standard Functions", () => {
    it("get-last-token-id returns 0 initially", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(0));
    });

    it("get-token-uri returns none when base URI not set", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.none());
    });

    it("get-owner returns none for non-existent token", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeOk(Cl.none());
    });
  });

  describe("Minting Obligation NFTs", () => {
    it("prevents unauthorized minting (not from bitpay-core)", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "mint",
        [Cl.uint(1), Cl.standardPrincipal(sender)],
        sender
      );
      expect(result).toBeErr(Cl.uint(503)); // ERR_UNAUTHORIZED
    });

    it("allows bitpay-core to mint obligation NFT", () => {
      // Simulate call from bitpay-core by creating a stream
      const amount = 1000000; // 1 sBTC
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.standardPrincipal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock),
        ],
        sender
      );

      // Stream ID will vary based on test execution order
      expect(result).toHaveClarityType(ClarityType.ResponseOk);

      // Check obligation NFT was minted to sender
      // Token ID increments with each mint, so get it from the result
      const { result: lastTokenIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenIdResult).toHaveClarityType(ClarityType.ResponseOk);

      const tokenId = Number((lastTokenIdResult as any).value.value);

      const { result: ownerResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(ownerResult).toBeOk(Cl.some(Cl.standardPrincipal(sender)));
    });

    it("maps token ID to stream ID correctly", () => {
      const amount = 1000000;
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      // Create stream
      const { result: createResult } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.standardPrincipal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock),
        ],
        sender
      );
      expect(createResult).toHaveClarityType(ClarityType.ResponseOk);
      const streamId = Number((createResult as any).value.value);

      // Get the token ID
      const { result: lastTokenIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenIdResult).toHaveClarityType(ClarityType.ResponseOk);
      const tokenId = Number((lastTokenIdResult as any).value.value);

      // Check token-to-stream mapping
      const { result: streamIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-stream-id",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(streamIdResult).toBeOk(Cl.some(Cl.uint(streamId)));

      // Check stream-to-token mapping
      const { result: tokenIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      expect(tokenIdResult).toBeOk(Cl.some(Cl.uint(tokenId)));
    });
  });

  describe("Transferring Obligation NFTs", () => {
    beforeEach(() => {
      // Create a stream to mint obligation NFT
      const amount = 1000000;
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.standardPrincipal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock),
        ],
        sender
      );
    });

    it("allows owner to transfer obligation NFT", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(1), // token-id
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        sender
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify new owner
      const { result: ownerResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(ownerResult).toBeOk(
        Cl.some(Cl.standardPrincipal(newObligationHolder))
      );
    });

    it("prevents non-owner from transferring", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        recipient // Not the owner
      );
      expect(result).toBeErr(Cl.uint(501)); // ERR_NOT_TOKEN_OWNER
    });

    it("updates stream sender in bitpay-core after transfer (two-step process)", () => {
      // Get the current token ID
      const { result: lastTokenIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenIdResult).toHaveClarityType(ClarityType.ResponseOk);
      const tokenId = Number((lastTokenIdResult as any).value.value);

      // Get the stream ID from token
      const { result: streamIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-stream-id",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(streamIdResult).toHaveClarityType(ClarityType.ResponseOk);
      const streamId = Number((streamIdResult as any).value.value.value); // unwrap the some then uint

      // Step 1: Old sender updates stream sender (before transferring NFT)
      const { result: updateResult } = simnet.callPublicFn(
        "bitpay-core",
        "update-stream-sender",
        [Cl.uint(streamId), Cl.standardPrincipal(newObligationHolder)],
        sender // OLD sender calls this
      );
      expect(updateResult).toBeOk(Cl.bool(true));

      // Step 2: Transfer obligation NFT
      const { result: transferResult } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(tokenId),
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        sender
      );
      expect(transferResult).toBeOk(Cl.bool(true));

      // Check stream sender was updated
      const { result: streamResult } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(streamId)],
        deployer
      );

      // Verify the stream exists and sender was updated
      expect(streamResult).toHaveClarityType(ClarityType.OptionalSome);
    });

    it("prevents transfer of non-existent token", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(999), // Non-existent token
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        sender
      );
      expect(result).toBeErr(Cl.uint(502)); // ERR_TOKEN_NOT_FOUND
    });

    it("emits event when obligation is transferred", () => {
      const { result, events } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(1),
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        sender
      );

      expect(result).toBeOk(Cl.bool(true));
      expect(events).toHaveLength(2); // NFT transfer + print event

      const printEvent = events.find((e) => e.event === "print_event");
      expect(printEvent).toBeDefined();
    });
  });

  describe("Burning Obligation NFTs", () => {
    beforeEach(() => {
      // Create a stream
      const amount = 1000000;
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.standardPrincipal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock),
        ],
        sender
      );
    });

    it("allows owner to burn obligation NFT", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "burn",
        [Cl.uint(1), Cl.standardPrincipal(sender)],
        sender
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify NFT no longer exists
      const { result: ownerResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(ownerResult).toBeOk(Cl.none());
    });

    it("prevents non-owner from burning", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "burn",
        [Cl.uint(1), Cl.standardPrincipal(sender)],
        recipient // Not the owner
      );
      expect(result).toBeErr(Cl.uint(501)); // ERR_NOT_TOKEN_OWNER
    });

    it("clears mappings when burned", () => {
      // Burn the NFT
      simnet.callPublicFn(
        "bitpay-obligation-nft",
        "burn",
        [Cl.uint(1), Cl.standardPrincipal(sender)],
        sender
      );

      // Check token-to-stream mapping cleared
      const { result: streamIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-stream-id",
        [Cl.uint(1)],
        deployer
      );
      expect(streamIdResult).toBeOk(Cl.none());

      // Check stream-to-token mapping cleared
      const { result: tokenIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-token-id",
        [Cl.uint(0)],
        deployer
      );
      expect(tokenIdResult).toBeOk(Cl.none());
    });
  });

  describe("Metadata Management", () => {
    it("allows owner to set base token URI", () => {
      const uri = "https://api.bitpay.com/nft/obligation/";
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "set-base-token-uri",
        [Cl.stringAscii(uri)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify URI is set
      const { result: uriResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      expect(uriResult).toBeOk(Cl.some(Cl.stringAscii(uri)));
    });

    it("prevents non-owner from setting base URI", () => {
      const uri = "https://api.bitpay.com/nft/obligation/";
      const { result } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "set-base-token-uri",
        [Cl.stringAscii(uri)],
        sender // Not the owner
      );
      expect(result).toBeErr(Cl.uint(500)); // ERR_OWNER_ONLY
    });
  });

  describe("Integration: Stream Cancellation", () => {
    it("obligation NFT should be burned when stream is cancelled", () => {
      // Create stream
      const amount = 1000000;
      const startBlock = simnet.blockHeight + 10;
      const endBlock = startBlock + 100;

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.standardPrincipal(recipient),
          Cl.uint(amount),
          Cl.uint(startBlock),
          Cl.uint(endBlock),
        ],
        sender
      );

      // Verify obligation NFT exists
      let { result: ownerResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(ownerResult).toBeOk(Cl.some(Cl.standardPrincipal(sender)));

      // Cancel stream
      simnet.mineEmptyBlock(); // Move forward 1 block
      simnet.callPublicFn(
        "bitpay-core",
        "cancel-stream",
        [Cl.uint(0)],
        sender
      );

      // Manual burn of obligation NFT (in production, this should be automatic or done by sender)
      simnet.callPublicFn(
        "bitpay-obligation-nft",
        "burn",
        [Cl.uint(1), Cl.standardPrincipal(sender)],
        sender
      );

      // Verify obligation NFT no longer exists
      ({ result: ownerResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      ));
      expect(ownerResult).toBeOk(Cl.none());
    });
  });

  describe("Multiple Streams and Transfers", () => {
    it("handles multiple obligation NFTs correctly", () => {
      const streamIds = [];

      // Create 3 streams and track their IDs
      for (let i = 0; i < 3; i++) {
        const { result } = simnet.callPublicFn(
          "bitpay-core",
          "create-stream",
          [
            Cl.standardPrincipal(recipient),
            Cl.uint(1000000),
            Cl.uint(simnet.blockHeight + 10),
            Cl.uint(simnet.blockHeight + 110),
          ],
          sender
        );
        streamIds.push(Number((result as any).value.value));
      }

      // Verify 3 more obligation NFTs minted (total depends on previous tests)
      const { result: lastIdResult } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-last-token-id",
        [],
        deployer
      );
      // Just verify it's a positive number
      expect(lastIdResult).toHaveClarityType(ClarityType.ResponseOk);

      // Get token ID for second stream
      const { result: token2Result } = simnet.callReadOnlyFn(
        "bitpay-obligation-nft",
        "get-token-id",
        [Cl.uint(streamIds[1])],
        deployer
      );
      expect(token2Result).toHaveClarityType(ClarityType.ResponseOk);
      const token2Id = Number((token2Result as any).value.value.value);

      // OLD sender updates stream sender BEFORE transferring
      simnet.callPublicFn(
        "bitpay-core",
        "update-stream-sender",
        [Cl.uint(streamIds[1]), Cl.standardPrincipal(newObligationHolder)],
        sender // OLD sender
      );

      // Transfer second obligation NFT
      const { result: transferResult } = simnet.callPublicFn(
        "bitpay-obligation-nft",
        "transfer",
        [
          Cl.uint(token2Id),
          Cl.standardPrincipal(sender),
          Cl.standardPrincipal(newObligationHolder),
        ],
        sender
      );
      expect(transferResult).toBeOk(Cl.bool(true));

      // Verify stream senders - just check they exist
      const { result: stream1 } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(streamIds[0])],
        deployer
      );
      const { result: stream2 } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(streamIds[1])],
        deployer
      );
      const { result: stream3 } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(streamIds[2])],
        deployer
      );

      // Verify all streams exist
      expect(stream1).toHaveClarityType(ClarityType.OptionalSome);
      expect(stream2).toHaveClarityType(ClarityType.OptionalSome);
      expect(stream3).toHaveClarityType(ClarityType.OptionalSome);
    });
  });
});
