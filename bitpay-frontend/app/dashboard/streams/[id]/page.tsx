"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ExternalLink,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStream } from "@/hooks/use-bitpay-read";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWithdrawFromStream, useCancelStream } from "@/hooks/use-bitpay-write";
import { microToDisplay, StreamStatus, calculateProgress, STACKS_API_URL } from "@/lib/contracts/config";
import { toast } from "sonner";
import { CancelStreamModal } from "@/components/dashboard/modals/CancelStreamModal";
import { TransferObligationNFTModal } from "@/components/dashboard/modals/TransferObligationNFTModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StreamHeader } from "@/components/dashboard/streams/detail/StreamHeader";
import { StreamProgress } from "@/components/dashboard/streams/detail/StreamProgress";
import { StreamAmounts } from "@/components/dashboard/streams/detail/StreamAmounts";
import { StreamAddresses } from "@/components/dashboard/streams/detail/StreamAddresses";
import { StreamNFTSection } from "@/components/dashboard/streams/detail/StreamNFTSection";

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id ? BigInt(params.id as string) : null;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTransferNFTModal, setShowTransferNFTModal] = useState(false);

  // Get user address from authenticated session instead of wallet
  const { user } = useAuth();
  const userAddress = user?.walletAddress || null;

  const { blockHeight } = useBlockHeight(30000);
  const { data: stream, isLoading, refetch } = useStream(streamId);
  const { write: withdraw, isLoading: isWithdrawing, txId: withdrawTxId } = useWithdrawFromStream();
  const { write: cancel, isLoading: isCancelling, txId: cancelTxId } = useCancelStream();

  const handleWithdraw = async () => {
    if (!streamId) return;
    const txId = await withdraw(streamId);
    if (txId) {
      toast.success("Withdrawal initiated!", {
        description: "Transaction submitted to the blockchain",
      });
      setTimeout(() => refetch(), 3000);
    }
  };

  const handleCancelConfirm = async () => {
    if (!streamId) return;
    const txId = await cancel(streamId);
    if (txId) {
      toast.success("Stream cancelled!", {
        description: "Transaction submitted to the blockchain",
      });
      setShowCancelModal(false);
      setTimeout(() => refetch(), 3000);
    }
  };

  if (isLoading || !stream) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading stream details...</p>
      </div>
    );
  }

  const progress = blockHeight
    ? calculateProgress(stream["start-block"], stream["end-block"], BigInt(blockHeight))
    : 0;
  const isRecipient = userAddress?.toLowerCase() === stream.recipient.toLowerCase();
  const isSender = userAddress?.toLowerCase() === stream.sender.toLowerCase();

  // Calculate cancellation fee (1% of unvested amount)
  const totalAmount = Number(microToDisplay(stream.amount));
  const vestedAmount = Number(microToDisplay(stream.vestedAmount));
  const unvestedAmount = totalAmount - vestedAmount;
  const cancellationFee = unvestedAmount * 0.01;
  const amountAfterFee = unvestedAmount - cancellationFee;

  return (
    <div className="space-y-6">
      <StreamHeader streamId={streamId?.toString() || "0"} status={stream.status} />

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Information</CardTitle>
          <CardDescription>Complete details of this payment stream</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StreamProgress progress={progress} />

          <Separator />

          <StreamAmounts
            totalAmount={microToDisplay(stream.amount)}
            vestedAmount={microToDisplay(stream.vestedAmount)}
            withdrawn={microToDisplay(stream.withdrawn)}
            available={microToDisplay(stream.withdrawableAmount)}
          />

          <Separator />

          <StreamAddresses
            sender={stream.sender}
            recipient={stream.recipient}
            isSender={isSender}
            isRecipient={isRecipient}
          />

          <Separator />

          {/* Block Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Start Block</p>
              <p className="text-lg font-semibold">{stream["start-block"].toString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">End Block</p>
              <p className="text-lg font-semibold">{stream["end-block"].toString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Block</p>
              <p className="text-lg font-semibold text-brand-pink">{blockHeight?.toString() || "..."}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="text-lg font-semibold">
              {(Number(stream["end-block"]) - Number(stream["start-block"])).toLocaleString()} blocks
            </p>
            <p className="text-xs text-muted-foreground">
              ~{Math.round((Number(stream["end-block"]) - Number(stream["start-block"])) / 144)} days
            </p>
          </div>

          {stream.cancelled && stream["cancelled-at-block"] && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cancelled At Block</p>
                <p className="text-lg font-semibold text-red-500">{stream["cancelled-at-block"].toString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* NFT Section */}
      <Card>
        <CardHeader>
          <CardTitle>NFT Information</CardTitle>
          <CardDescription>Dual NFT system for this stream</CardDescription>
        </CardHeader>
        <CardContent>
          <StreamNFTSection
            streamId={streamId?.toString() || "0"}
            sender={stream.sender}
            recipient={stream.recipient}
            isSender={isSender}
            status={stream.status}
            onTransferNFT={() => setShowTransferNFTModal(true)}
          />
        </CardContent>
      </Card>

      {/* Cancellation Fee Preview */}
      {isSender && stream.status === StreamStatus.ACTIVE && unvestedAmount > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <p className="font-medium mb-2 text-yellow-800">Cancellation Fee Information</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unvested Amount:</span>
                <span className="font-medium">{unvestedAmount.toFixed(8)} sBTC</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Cancellation Fee (1%):</span>
                <span className="font-medium">-{cancellationFee.toFixed(8)} sBTC</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t">
                <span>You'd Receive:</span>
                <span className="text-brand-pink">{amountAfterFee.toFixed(8)} sBTC</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage this stream</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRecipient && stream.withdrawableAmount > BigInt(0) && !stream.cancelled && (
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="w-full bg-brand-teal hover:bg-brand-teal/90"
              size="lg"
            >
              {isWithdrawing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Withdraw {microToDisplay(stream.withdrawableAmount)} sBTC
            </Button>
          )}

          {isSender && stream.status === StreamStatus.ACTIVE && (
            <Button
              variant="destructive"
              onClick={() => setShowCancelModal(true)}
              className="w-full"
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Stream
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a
                href={`${STACKS_API_URL.replace("api", "explorer")}/address/${stream.sender}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Sender <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a
                href={`${STACKS_API_URL.replace("api", "explorer")}/address/${stream.recipient}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Recipient <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          {(withdrawTxId || cancelTxId) && (
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`${STACKS_API_URL.replace("api", "explorer")}/tx/${withdrawTxId || cancelTxId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Last Transaction <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard/streams">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Streams
          </Link>
        </Button>
      </div>

      {/* Modals */}
      {stream && (
        <>
          <CancelStreamModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            stream={{
              id: streamId?.toString() || "0",
              description: `Stream #${streamId?.toString() || "0"}`,
              recipient: stream.recipient,
              totalAmount: microToDisplay(stream.amount),
              vestedAmount: microToDisplay(stream.vestedAmount),
              withdrawnAmount: microToDisplay(stream.withdrawn),
            }}
            onSuccess={() => {
              handleCancelConfirm();
            }}
          />

          <TransferObligationNFTModal
            isOpen={showTransferNFTModal}
            onClose={() => {
              setShowTransferNFTModal(false);
              setTimeout(() => refetch(), 3000);
            }}
            streamId={streamId?.toString() || "0"}
            obligationTokenId={streamId?.toString() || "0"}
            currentAmount={microToDisplay(stream.amount)}
          />
        </>
      )}
    </div>
  );
}
