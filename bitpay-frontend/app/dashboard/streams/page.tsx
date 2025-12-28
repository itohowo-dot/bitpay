"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useUserStreams } from "@/hooks/use-bitpay-read";
import { useBlockHeight } from "@/hooks/use-block-height";
import { useWithdrawFromStream, useWithdrawPartial, useCancelStream } from "@/hooks/use-bitpay-write";
import { StreamStatus, calculateProgress, microToDisplay } from "@/lib/contracts/config";
import { StreamListSkeleton } from "@/components/dashboard/StreamCardSkeleton";
import { StreamListHeader } from "@/components/dashboard/streams/list/StreamListHeader";
import { StreamSearch } from "@/components/dashboard/streams/list/StreamSearch";
import { StreamCard } from "@/components/dashboard/streams/list/StreamCard";
import { EmptyStreamState } from "@/components/dashboard/streams/list/EmptyStreamState";
import { WithdrawModal } from "@/components/dashboard/modals/WithdrawModal";
import { toast } from "sonner";

export default function StreamsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Get user address from authenticated session instead of wallet
  const { user } = useAuth();
  const userAddress = user?.walletAddress || null;

  const { blockHeight } = useBlockHeight(30000);
  const { data: streams, isLoading, refetch } = useUserStreams(userAddress);
  const { write: withdrawAll, isLoading: isWithdrawing } = useWithdrawFromStream();
  const { write: withdrawPartial, isLoading: isWithdrawingPartial } = useWithdrawPartial();
  const { write: cancel, isLoading: isCancelling } = useCancelStream();

  // Auto-refresh streams every 30 seconds to catch newly confirmed transactions
  useEffect(() => {
    if (!userAddress) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing streams from blockchain...');
      refetch();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userAddress, refetch]);

  const filteredStreams = streams?.filter((stream) => {
    const matchesSearch =
      stream.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stream.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stream.id.toString().includes(searchTerm);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && stream.status.toLowerCase() === activeTab;
  }) || [];

  const handleWithdraw = async (streamId: bigint) => {
    // Refresh stream data to get the latest amounts
    await refetch();

    // Find the stream with fresh data
    const stream = streams?.find(s => s.id === streamId);
    if (stream) {
      // Convert stream data to modal format with current block calculations
      setSelectedStream({
        id: stream.id.toString(),
        description: `Stream #${stream.id}`,
        recipient: stream.recipient,
        totalAmount: microToDisplay(stream.amount),
        vestedAmount: microToDisplay(stream.vestedAmount),
        withdrawnAmount: microToDisplay(stream.withdrawn),
        withdrawableAmount: microToDisplay(stream.withdrawableAmount),
      });
      setIsWithdrawModalOpen(true);
    }
  };

  const handleWithdrawConfirm = async (amount?: string) => {
    if (!selectedStream) return;

    try {
      toast.info("Opening wallet to sign withdrawal transaction...");

      let txId: string | null = null;

      if (amount && parseFloat(amount) > 0) {
        // Partial withdrawal - user entered custom amount
        txId = await withdrawPartial(BigInt(selectedStream.id), amount);
      } else {
        // Full withdrawal - withdraw all available
        txId = await withdrawAll(BigInt(selectedStream.id));
      }

      if (txId) {
        toast.success("Withdrawal transaction submitted! Waiting for confirmation...", {
          description: `Transaction ID: ${txId.slice(0, 8)}...${txId.slice(-8)}`
        });
        setIsWithdrawModalOpen(false);
        setTimeout(() => {
          refetch();
          toast.info("Stream data refreshed");
        }, 3000);
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error("Failed to withdraw from stream");
    }
  };

  const handleCancel = async (streamId: bigint) => {
    try {
      toast.info("Opening wallet to sign cancellation transaction...");
      const txId = await cancel(streamId);
      if (txId) {
        toast.success("Cancellation transaction submitted! Waiting for confirmation...", {
          description: `Transaction ID: ${txId.slice(0, 8)}...${txId.slice(-8)}`
        });
        setTimeout(() => {
          refetch();
          toast.info("Stream data refreshed");
        }, 3000);
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel stream");
    }
  };

  if (isLoading && !streams) {
    return (
      <div className="space-y-6">
        <StreamListHeader />
        <StreamListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StreamListHeader />
      <StreamSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({streams?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({streams?.filter((s) => s.status === StreamStatus.ACTIVE).length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({streams?.filter((s) => s.status === StreamStatus.COMPLETED).length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({streams?.filter((s) => s.status === StreamStatus.PENDING).length || 0})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({streams?.filter((s) => s.status === StreamStatus.CANCELLED).length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredStreams.length === 0 ? (
            <EmptyStreamState activeTab={activeTab} />
          ) : (
            filteredStreams.map((stream) => {
              const progress = blockHeight
                ? calculateProgress(stream["start-block"], stream["end-block"], BigInt(blockHeight))
                : 0;
              const isRecipient = userAddress?.toLowerCase() === stream.recipient.toLowerCase();

              return (
                <StreamCard
                  key={stream.id.toString()}
                  stream={stream}
                  isRecipient={isRecipient}
                  progress={progress}
                  onWithdraw={handleWithdraw}
                  onCancel={handleCancel}
                  isWithdrawing={isWithdrawing}
                  isCancelling={isCancelling}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        stream={selectedStream}
        onSuccess={handleWithdrawConfirm}
      />
    </div>
  );
}
