"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { useTransferObligationNFT } from "@/hooks/use-nft";
import { useUpdateStreamSender } from "@/hooks/use-bitpay-write";
import { useAuth } from "@/hooks/use-auth";

interface TransferObligationNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  obligationTokenId: string;
  currentAmount: string;
  onSuccess?: () => void;
}

export function TransferObligationNFTModal({
  isOpen,
  onClose,
  streamId,
  obligationTokenId,
  currentAmount,
  onSuccess,
}: TransferObligationNFTModalProps) {
  const [newOwner, setNewOwner] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<'transfer' | 'update-sender'>('transfer');
  const { user } = useAuth();
  const { transferObligationNFT, isLoading: isTransferring, error: transferError } = useTransferObligationNFT();
  const { write: updateStreamSender, isLoading: isUpdating, error: updateError } = useUpdateStreamSender();

  const userAddress = user?.walletAddress || null;
  const isLoading = isTransferring || isUpdating;

  const handleTransfer = async () => {
    if (!newOwner.trim()) {
      setError("Please enter a valid Stacks address");
      return;
    }

    // Validate Stacks address format (basic validation)
    if (!newOwner.startsWith("SP") && !newOwner.startsWith("ST")) {
      setError("Invalid Stacks address format");
      return;
    }

    if (!userAddress) {
      setError("No wallet connected");
      return;
    }

    setError("");

    try {
      console.log("Step 1: Transferring obligation NFT:", {
        tokenId: obligationTokenId,
        streamId,
        from: userAddress,
        to: newOwner,
      });

      // Step 1: Transfer the NFT
      setStep('transfer');
      const transferTxId = await transferObligationNFT(
        Number(obligationTokenId),
        userAddress,
        newOwner
      );

      if (!transferTxId) {
        setError("Failed to transfer NFT");
        return;
      }

      const transferExplorerUrl = `https://explorer.hiro.so/txid/${transferTxId}?chain=testnet`;
      console.log('✅ Step 1 complete - NFT transferred!');
      console.log('📋 Transfer TX:', transferTxId);
      console.log('🔗 Explorer:', transferExplorerUrl);

      toast.success("NFT Transferred!", {
        description: "Now updating stream sender...",
        duration: 5000,
      });

      // Step 2: Update stream sender
      console.log("Step 2: Updating stream sender:", {
        streamId,
        newSender: newOwner,
      });

      setStep('update-sender');
      const updateTxId = await updateStreamSender(
        Number(streamId),
        newOwner
      );

      if (updateTxId) {
        const updateExplorerUrl = `https://explorer.hiro.so/txid/${updateTxId}?chain=testnet`;

        toast.success("Transfer Complete!", {
          description: (
            <div className="space-y-2 mt-1">
              <p className="text-sm">NFT transferred and stream sender updated successfully!</p>
              <div className="text-xs space-y-1">
                <a
                  href={transferExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono block hover:underline"
                >
                  Transfer: {transferTxId.substring(0, 16)}...
                </a>
                <a
                  href={updateExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono block hover:underline"
                >
                  Update: {updateTxId.substring(0, 16)}...
                </a>
              </div>
            </div>
          ),
          duration: 15000,
        });

        console.log('✅ Step 2 complete - Stream sender updated!');
        console.log('📋 Update TX:', updateTxId);
        console.log('🔗 Explorer:', updateExplorerUrl);

        // Trigger refetch of NFT data
        if (onSuccess) {
          onSuccess();
        }

        // Close modal after a short delay to allow state updates
        setTimeout(() => {
          onClose();
          setNewOwner("");
          setStep('transfer');
        }, 2000);
      }
    } catch (err: any) {
      console.error("Transfer error:", err);
      setError(err.message || `Failed to ${step === 'transfer' ? 'transfer NFT' : 'update stream sender'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Transfer Obligation NFT</DialogTitle>
          <DialogDescription className="text-xs">
            Transfer your obligation NFT to sell or assign stream payment rights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Stream Info */}
          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stream ID</span>
                <Badge variant="outline" className="text-xs">#{streamId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Obligation NFT ID</span>
                <Badge variant="outline" className="text-xs">#{obligationTokenId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stream Amount</span>
                <span className="font-medium">{currentAmount} sBTC</span>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="py-2">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <AlertDescription className="text-xs">
              <p className="font-medium mb-1">Two-Step Transfer Process</p>
              <ol className="space-y-0.5 ml-4 list-decimal text-[11px]">
                <li>You transfer the obligation NFT to the new owner</li>
                <li>New owner must call <code className="bg-muted px-1 rounded text-[10px]">update-stream-sender</code> to become the stream sender</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Info Alert */}
          <Alert className="py-2">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-[11px]">
              The new owner will receive all future stream payments and can cancel the stream. Already vested amounts belong to the recipient.
            </AlertDescription>
          </Alert>

          {/* New Owner Input */}
          <div className="space-y-1.5">
            <Label htmlFor="new-owner" className="text-xs">New Owner Address</Label>
            <Input
              id="new-owner"
              placeholder="SP... or ST..."
              value={newOwner}
              onChange={(e) => {
                setNewOwner(e.target.value);
                setError("");
              }}
              disabled={isTransferring}
              className="font-mono text-xs h-8"
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the Stacks address of the new obligation NFT owner
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isLoading || !newOwner.trim()}
            className="bg-brand-pink hover:bg-brand-pink/90 text-white h-8 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                {step === 'transfer' ? 'Transferring NFT...' : 'Updating Sender...'}
              </>
            ) : (
              <>
                Transfer NFT
                <ArrowRight className="ml-1.5 h-3 w-3" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
