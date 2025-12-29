import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const sender = accounts.get("wallet_1")!;
const recipient = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT = "bitpay-nft";
const CORE_CONTRACT = "bitpay-core";

describe("bitpay-nft contract", () => {
  // Setup: Authorize bitpay-core contract
  beforeEach(() => {
    simnet.callPublicFn(
      "bitpay-access-control",
      "authorize-contract",
      [Cl.contractPrincipal(deployer, "bitpay-core")],
      deployer
    );
  });

  describe("SIP-009 NFT Trait Functions", () => {
    it("should return initial last-token-id as 0", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-last-token-id",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });

    it("should return none for token-uri", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });

    it("should return none for non-existent token owner", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-owner",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });
  });

  describe("Minting Stream NFTs via Stream Creation", () => {
    it("should mint NFT when stream is created", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream - this should mint recipient NFT
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [
          Cl.principal(recipient),
          Cl.uint(100000000),
          Cl.uint(startBlock),
          Cl.uint(startBlock + 100)
        ],
        sender
      );

      expect(createResult.result).toBeOk(expect.any(Object));
      const streamId = Number((createResult.result as any).value.value);

      // Check that NFT was minted
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );

      expect(tokenResult.result).toHaveClarityType(ClarityType.ResponseOk);
    });

    it("should increment token ID on successive stream creations", () => {
      const startBlock = simnet.blockHeight + 1;

      // Get initial last token ID
      const initialResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-last-token-id",
        [],
        deployer
      );
      const initialId = Number((initialResult.result as any).value.value);

      // Create two streams
      simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );

      simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(wallet3), Cl.uint(50000000), Cl.uint(startBlock + 1), Cl.uint(startBlock + 101)],
        sender
      );

      // Check last token ID increased by 2
      const finalResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-last-token-id",
        [],
        deployer
      );
      const finalId = Number((finalResult.result as any).value.value);

      expect(finalId).toBe(initialId + 2);
    });

    it("should set correct owner (recipient) after minting", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID - returns (ok (some uint))
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );

      // Extract: ResponseOk.value -> OptionalSome.value -> UInt.value
      expect(tokenResult.result).toHaveClarityType(ClarityType.ResponseOk);
      const optionalValue = (tokenResult.result as any).value; // Gets the (some uint) or none
      expect(optionalValue.type).toBe(ClarityType.OptionalSome);
      const uintClarityValue = optionalValue.value; // This is a Clarity UInt
      const tokenId = Number(uintClarityValue.value); // Extract the actual number from UInt
      expect(tokenId).toBeGreaterThan(0);

      // Check owner is recipient
      const ownerResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-owner",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(ownerResult.result).toBeOk(Cl.some(Cl.principal(recipient)));
    });
  });

  describe("Token to Stream Mapping", () => {
    it("should map token ID to stream ID", () => {
      const startBlock = simnet.blockHeight + 1;

      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID from stream ID - returns (ok (some uint))
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      const optionalValue = (tokenResult.result as any).value;
      const uintClarityValue = optionalValue.value;
      const tokenId = Number(uintClarityValue.value);

      // Verify reverse mapping
      const streamResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stream-id",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(streamResult.result).toBeOk(Cl.some(Cl.uint(streamId)));
    });

    it("should return none for unmapped stream ID", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(9999)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });

    it("should return none for unmapped token ID", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-stream-id",
        [Cl.uint(9999)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });
  });

  describe("NFT Transfer (Soul-Bound - Should Fail)", () => {
    it("should reject transfer attempts (soul-bound)", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      const optionalValue = (tokenResult.result as any).value;
      const uintClarityValue = optionalValue.value;
      const tokenId = Number(uintClarityValue.value);

      // Attempt transfer (should fail - soul-bound)
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "transfer",
        [Cl.uint(tokenId), Cl.principal(recipient), Cl.principal(wallet3)],
        recipient
      );

      expect(result).toBeErr(Cl.uint(403)); // ERR_UNAUTHORIZED (transfers disabled)
    });
  });

  describe("Burning Stream NFTs", () => {
    it("should allow owner to burn their NFT", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      const optionalValue = (tokenResult.result as any).value;
      const uintClarityValue = optionalValue.value;
      const tokenId = Number(uintClarityValue.value);

      // Burn NFT
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(tokenId), Cl.principal(recipient)],
        recipient
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("should remove owner after burning", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      const optionalValue = (tokenResult.result as any).value;
      const uintClarityValue = optionalValue.value;
      const tokenId = Number(uintClarityValue.value);

      // Burn NFT
      simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(tokenId), Cl.principal(recipient)],
        recipient
      );

      // Check owner is none
      const { result } = simnet.callReadOnlyFn(
        CONTRACT,
        "get-owner",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result).toBeOk(Cl.none());
    });

    it("should fail when non-owner tries to burn", () => {
      const startBlock = simnet.blockHeight + 1;

      // Create stream
      const createResult = simnet.callPublicFn(
        CORE_CONTRACT,
        "create-stream",
        [Cl.principal(recipient), Cl.uint(100000000), Cl.uint(startBlock), Cl.uint(startBlock + 100)],
        sender
      );
      const streamId = Number((createResult.result as any).value.value);

      // Get token ID
      const tokenResult = simnet.callReadOnlyFn(
        CONTRACT,
        "get-token-id",
        [Cl.uint(streamId)],
        deployer
      );
      const optionalValue = (tokenResult.result as any).value;
      const uintClarityValue = optionalValue.value;
      const tokenId = Number(uintClarityValue.value);

      // wallet3 tries to burn (not owner)
      const { result } = simnet.callPublicFn(
        CONTRACT,
        "burn",
        [Cl.uint(tokenId), Cl.principal(recipient)],
        wallet3
      );

      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT_TOKEN_OWNER
    });
  });
});
