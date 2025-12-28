"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Shuffle, ExternalLink, Store } from "lucide-react";
import { StreamStatus } from "@/lib/contracts/config";
import { useObligationNFTOwner } from "@/hooks/use-nft";

interface ObligationNFTCardProps {
  stream: {
    id: bigint;
    sender: string;
    recipient: string;
    amount: bigint;
    vestedAmount: bigint;
    status: StreamStatus;
  };
  displayAmount: (amount: bigint) => string;
  onTransfer: () => void;
  onListMarketplace?: () => void;
  userAddress: string | null;
  onCompleteTransfer?: (newOwner: string) => void;
}

export function ObligationNFTCard({ stream, displayAmount, onTransfer, onListMarketplace, userAddress, onCompleteTransfer }: ObligationNFTCardProps) {
  // Fetch the actual NFT owner from blockchain
  const { data: nftOwnerData } = useObligationNFTOwner(Number(stream.id));
  const [nftOwner, setNftOwner] = useState<string | null>(null);

  useEffect(() => {
    if (nftOwnerData) {
      // The hook returns (optional principal), extract the actual address
      // It might be a string directly or wrapped in an object
      const owner = typeof nftOwnerData === 'string'
        ? nftOwnerData
        : (nftOwnerData as any)?.value || null;
      console.log('NFT Owner for stream', stream.id.toString(), ':', owner);
      setNftOwner(owner);
    }
  }, [nftOwnerData, stream.id]);

  // Check if NFT has been transferred: NFT owner != current user
  const isTransferred = userAddress && nftOwner && typeof nftOwner === 'string' && nftOwner.toLowerCase() !== userAddress.toLowerCase();
  const newOwner = isTransferred ? nftOwner : null;

  return (
    <Card className={`overflow-hidden transition-colors ${isTransferred ? 'border-yellow-500/50 bg-yellow-500/5' : 'hover:border-brand-pink/50'}`}>
      {/* NFT Visualization */}
      <div className={`relative h-48 flex items-center justify-center ${isTransferred ? 'bg-yellow-500/10' : 'bg-brand-pink/10'}`}>
        <div className="text-center">
          <Gift className={`h-16 w-16 mx-auto mb-2 ${isTransferred ? 'text-yellow-500/50' : 'text-brand-pink/50'}`} />
          <p className="text-2xl font-bold">#{stream.id.toString()}</p>
        </div>
        {!isTransferred && (
          <Badge className="absolute top-3 right-3 bg-brand-pink">
            <Shuffle className="h-3 w-3 mr-1" />
            Transferable
          </Badge>
        )}
        {isTransferred ? (
          <Badge variant="outline" className="absolute top-3 left-3 bg-yellow-500 text-white border-yellow-600">
            Transferred
          </Badge>
        ) : stream.status === StreamStatus.ACTIVE ? (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Active
          </Badge>
        ) : null}
      </div>

      <CardHeader>
        <CardTitle className="text-lg">Obligation NFT #{stream.id.toString()}</CardTitle>
        <CardDescription className="space-y-1">
          {isTransferred && newOwner ? (
            <>
              <div className="flex justify-between text-xs text-yellow-600 dark:text-yellow-500">
                <span>Transferred to:</span>
                <span className="font-mono">{newOwner.slice(0, 8)}...{newOwner.slice(-4)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Recipient:</span>
                <span className="font-mono">{stream.recipient.slice(0, 8)}...{stream.recipient.slice(-4)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs">
              <span>To:</span>
              <span className="font-mono">{stream.recipient.slice(0, 8)}...{stream.recipient.slice(-4)}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stream Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Obligation</p>
            <p className="font-semibold">{displayAmount(stream.amount)} sBTC</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid Out</p>
            <p className="font-semibold text-brand-pink">
              {displayAmount(stream.vestedAmount)} sBTC
            </p>
          </div>
        </div>

        {isTransferred ? (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-500">
              NFT transferred but stream sender needs updating. Complete the transfer to finalize.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Shuffle className="h-4 w-4 text-brand-pink" />
            <AlertDescription className="text-xs">
              Can be transferred for invoice factoring
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isTransferred && newOwner ? (
            <Button
              size="sm"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => onCompleteTransfer?.(newOwner)}
            >
              Complete Transfer
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white"
                  onClick={onTransfer}
                  disabled={stream.status !== StreamStatus.ACTIVE}
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/streams/${stream.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {onListMarketplace && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                  onClick={onListMarketplace}
                  disabled={stream.status !== StreamStatus.ACTIVE}
                >
                  <Store className="h-4 w-4 mr-2" />
                  List on Marketplace
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
