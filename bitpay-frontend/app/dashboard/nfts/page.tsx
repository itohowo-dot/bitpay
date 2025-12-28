"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Shuffle, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserStreamsByRole } from "@/hooks/use-user-streams";
import { microToDisplay } from "@/lib/contracts/config";
import { TransferObligationNFTModal } from "@/components/dashboard/modals/TransferObligationNFTModal";
import { ListObligationNFTModal } from "@/components/dashboard/modals/ListObligationNFTModal";
import { useUpdateStreamSender } from "@/hooks/use-bitpay-write";
import { toast } from "sonner";
import { NFTGalleryHeader } from "@/components/dashboard/nfts/shared/NFTGalleryHeader";
import { NFTSearch } from "@/components/dashboard/nfts/shared/NFTSearch";
import { DualNFTExplanation } from "@/components/dashboard/nfts/shared/DualNFTExplanation";
import { NFTStats } from "@/components/dashboard/nfts/shared/NFTStats";
import { RecipientNFTCard } from "@/components/dashboard/nfts/recipient/RecipientNFTCard";
import { EmptyRecipientNFTs } from "@/components/dashboard/nfts/recipient/EmptyRecipientNFTs";
import { ObligationNFTCard } from "@/components/dashboard/nfts/obligation/ObligationNFTCard";
import { EmptyObligationNFTs } from "@/components/dashboard/nfts/obligation/EmptyObligationNFTs";

export default function NFTGalleryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStreamForTransfer, setSelectedStreamForTransfer] = useState<any>(null);
  const [selectedStreamForListing, setSelectedStreamForListing] = useState<any>(null);

  // Get user address from authenticated session instead of wallet
  const { user } = useAuth();
  const userAddress = user?.walletAddress || null;

  // Helper to ensure BigInt
  const toBigInt = (val: any): bigint => {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'string') return BigInt(val);
    if (typeof val === 'number') return BigInt(Math.floor(val));
    if (typeof val === 'object' && val !== null && 'value' in val) {
      return toBigInt(val.value);
    }
    return BigInt(0);
  };

  const {
    outgoingStreams,
    incomingStreams,
    isLoading,
    refetch
  } = useUserStreamsByRole(userAddress);

  const { write: updateStreamSender, isLoading: isUpdating } = useUpdateStreamSender();

  const handleCompleteTransfer = async (streamId: string, newOwner: string) => {
    try {
      const txId = await updateStreamSender(Number(streamId), newOwner);

      if (txId) {
        const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;

        toast.success("Transfer Completed!", {
          description: (
            <div className="space-y-2 mt-1">
              <p className="text-sm">Stream sender updated successfully!</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono block hover:underline"
              >
                {txId.substring(0, 20)}...
              </a>
            </div>
          ),
          duration: 15000,
        });

        // Refetch to update UI
        refetch();
      }
    } catch (error: any) {
      console.error("Error completing transfer:", error);
      toast.error("Failed to complete transfer", {
        description: error.message || "Please try again",
      });
    }
  };

  // Filter by search
  const filteredRecipientNFTs = incomingStreams.filter((stream) =>
    stream.id.toString().includes(searchTerm) ||
    stream.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredObligationNFTs = outgoingStreams.filter((stream) =>
    stream.id.toString().includes(searchTerm) ||
    stream.recipient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-pink" />
        <p className="ml-3 text-muted-foreground">Loading NFT gallery...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NFTGalleryHeader />
      <DualNFTExplanation />
      <NFTSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Tabs for Recipient vs Obligation NFTs */}
      <Tabs defaultValue="recipient" className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="recipient"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-teal data-[state=active]:bg-transparent"
          >
            <Shield className="h-4 w-4 mr-2" />
            Recipient NFTs ({incomingStreams.length})
          </TabsTrigger>
          <TabsTrigger
            value="obligation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Obligation NFTs ({outgoingStreams.length})
          </TabsTrigger>
        </TabsList>

        {/* Recipient NFTs Tab (Soul-bound) */}
        <TabsContent value="recipient" className="space-y-6">
          <Card className="border-brand-teal/20 bg-brand-teal/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-teal">
                <Lock className="h-5 w-5" />
                Soul-Bound Receipt NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                These NFTs represent proof that you are receiving a payment stream. They are <strong>non-transferable</strong> (soul-bound) and serve as permanent receipts of income.
              </p>
            </CardContent>
          </Card>

          {filteredRecipientNFTs.length === 0 ? (
            <EmptyRecipientNFTs />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipientNFTs.map((stream) => (
                <RecipientNFTCard
                  key={stream.id.toString()}
                  stream={stream}
                  displayAmount={microToDisplay}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Obligation NFTs Tab (Transferable) */}
        <TabsContent value="obligation" className="space-y-6">
          <Card className="border-brand-pink/20 bg-brand-pink/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-pink">
                <Shuffle className="h-5 w-5" />
                Transferable Obligation NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                These NFTs represent payment obligations for streams you're sending. They are <strong>transferable</strong> and can be sold for invoice factoring or assigned to others.
              </p>
            </CardContent>
          </Card>

          {filteredObligationNFTs.length === 0 ? (
            <EmptyObligationNFTs />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredObligationNFTs.map((stream) => (
                <ObligationNFTCard
                  key={stream.id.toString()}
                  stream={stream}
                  displayAmount={microToDisplay}
                  onTransfer={() => setSelectedStreamForTransfer(stream)}
                  onListMarketplace={() => setSelectedStreamForListing(stream)}
                  userAddress={userAddress}
                  onCompleteTransfer={(newOwner) => handleCompleteTransfer(stream.id.toString(), newOwner)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NFTStats
        recipientCount={incomingStreams.length}
        obligationCount={outgoingStreams.length}
        totalReceived={microToDisplay(
          incomingStreams.reduce((sum, s) => sum + toBigInt(s.vestedAmount), BigInt(0))
        )}
        totalObligations={microToDisplay(
          outgoingStreams.reduce((sum, s) => sum + toBigInt(s.amount), BigInt(0))
        )}
      />

      {/* Transfer Obligation NFT Modal */}
      {selectedStreamForTransfer && (
        <TransferObligationNFTModal
          isOpen={!!selectedStreamForTransfer}
          onClose={() => setSelectedStreamForTransfer(null)}
          streamId={selectedStreamForTransfer.id.toString()}
          obligationTokenId={selectedStreamForTransfer.id.toString()}
          currentAmount={microToDisplay(selectedStreamForTransfer.amount)}
          onSuccess={() => {
            // Refetch streams after successful transfer
            refetch();
          }}
        />
      )}

      {/* List Obligation NFT Modal */}
      {selectedStreamForListing && (
        <ListObligationNFTModal
          isOpen={!!selectedStreamForListing}
          onClose={() => setSelectedStreamForListing(null)}
          streamId={selectedStreamForListing.id.toString()}
          obligationTokenId={selectedStreamForListing.id.toString()}
          currentAmount={microToDisplay(selectedStreamForListing.amount)}
        />
      )}
    </div>
  );
}
