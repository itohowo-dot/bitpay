"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Shuffle } from "lucide-react";
import { StreamStatus } from "@/lib/contracts/config";

interface StreamNFTSectionProps {
  streamId: string;
  sender: string;
  recipient: string;
  isSender: boolean;
  status: StreamStatus;
  onTransferNFT?: () => void;
}

export function StreamNFTSection({
  streamId,
  sender,
  recipient,
  isSender,
  status,
  onTransferNFT,
}: StreamNFTSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recipient NFT */}
        <div className="border border-brand-teal/20 bg-brand-teal/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-brand-teal" />
            <h3 className="font-semibold text-brand-teal">Recipient NFT</h3>
            <Badge variant="outline" className="ml-auto text-xs border-brand-teal text-brand-teal">
              Soul-Bound
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token ID:</span>
              <span className="font-mono font-medium">#{streamId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-mono text-xs">{recipient.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transferable:</span>
              <span className="font-medium text-red-500">No</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Non-transferable proof of payment receipt
            </p>
          </div>
        </div>

        {/* Obligation NFT */}
        <div className="border border-brand-pink/20 bg-brand-pink/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shuffle className="h-5 w-5 text-brand-pink" />
            <h3 className="font-semibold text-brand-pink">Obligation NFT</h3>
            <Badge variant="outline" className="ml-auto text-xs border-brand-pink text-brand-pink">
              Transferable
            </Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token ID:</span>
              <span className="font-mono font-medium">#{streamId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-mono text-xs">{sender.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transferable:</span>
              <span className="font-medium text-green-500">Yes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Can be transferred for invoice factoring
            </p>
          </div>
        </div>
      </div>

      {isSender && status === StreamStatus.ACTIVE && onTransferNFT && (
        <Button
          onClick={onTransferNFT}
          variant="outline"
          className="w-full mt-4 border-brand-pink text-brand-pink hover:bg-brand-pink/10"
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Transfer Obligation NFT
        </Button>
      )}
    </>
  );
}
