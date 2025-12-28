"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import Link from "next/link";
import { RecipientNFTCard } from "@/components/dashboard/nfts/recipient/RecipientNFTCard";
import { ObligationNFTCard } from "@/components/dashboard/nfts/obligation/ObligationNFTCard";

interface Stream {
  id: bigint;
  sender: string;
  recipient: string;
  amount: bigint;
  vestedAmount: bigint;
  status: any;
}

interface NFTGalleryProps {
  recipientStreams: Stream[];
  obligationStreams: Stream[];
  displayAmount: (amount: bigint) => string;
  userAddress: string | null;
  onTransfer?: (stream: Stream) => void;
  onListMarketplace?: (stream: Stream) => void;
  onCompleteTransfer?: (newOwner: string) => void;
}

export function NFTGallery({
  recipientStreams,
  obligationStreams,
  displayAmount,
  userAddress,
  onTransfer,
  onListMarketplace,
  onCompleteTransfer
}: NFTGalleryProps) {
  // Show 3 obligation NFTs
  const totalCount = recipientStreams.length + obligationStreams.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="border-border/60 bg-card">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
          <CardTitle className="text-base">Your NFTs</CardTitle>
          {totalCount > 0 && (
            <Link href="/dashboard/nfts" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View All ({totalCount})
            </Link>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {(recipientStreams.length > 0 || obligationStreams.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipientStreams.slice(0, 3).map((stream, index) => (
                <motion.div
                  key={`recipient-${stream.id.toString()}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <RecipientNFTCard
                    stream={stream}
                    displayAmount={displayAmount}
                  />
                </motion.div>
              ))}
              {obligationStreams.slice(0, 3).map((stream, index) => (
                <motion.div
                  key={`obligation-${stream.id.toString()}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * (index + recipientStreams.slice(0, 2).length) }}
                >
                  <ObligationNFTCard
                    stream={stream}
                    displayAmount={displayAmount}
                    onTransfer={() => onTransfer?.(stream)}
                    onListMarketplace={() => onListMarketplace?.(stream)}
                    userAddress={userAddress}
                    onCompleteTransfer={onCompleteTransfer}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No NFTs yet</p>
              <p className="text-xs mt-1">Create a stream to mint your first NFT</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
