"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Wallet,
  Activity,
  Bitcoin,
  RefreshCw,
  Loader2,
  Send,
  Download,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import walletService from "@/lib/wallet/wallet-service";
import { useAuth } from "@/hooks/use-auth";
import { useUserStreamsByRole } from "@/hooks/use-user-streams";
import { useBlockHeight } from "@/hooks/use-block-height";
import { microToDisplay, StreamStatus } from "@/lib/contracts/config";
import { StatsCard } from "@/components/dashboard/overview/StatsCard";
import { RecentStreams } from "@/components/dashboard/overview/RecentStreams";
import { QuickActions } from "@/components/dashboard/overview/QuickActions";
import { StreamingAnalytics } from "@/components/dashboard/overview/StreamingAnalytics";
import { MarketplaceActivity } from "@/components/dashboard/overview/MarketplaceActivity";
import { StreamStatusDistribution } from "@/components/dashboard/overview/StreamStatusDistribution";
import { TreasuryInfo } from "@/components/dashboard/overview/TreasuryInfo";
import { NFTGallery } from "@/components/dashboard/overview/NFTGallery";
import { TransferObligationNFTModal } from "@/components/dashboard/modals/TransferObligationNFTModal";
import { ListObligationNFTModal } from "@/components/dashboard/modals/ListObligationNFTModal";
import { useUpdateStreamSender } from "@/hooks/use-bitpay-write";
import { toast } from "sonner";

export default function DashboardPage() {
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));
  const [selectedStreamForTransfer, setSelectedStreamForTransfer] = useState<any>(null);
  const [selectedStreamForListing, setSelectedStreamForListing] = useState<any>(null);

  // Get user address from authenticated session instead of wallet
  const { user } = useAuth();
  const userAddress = user?.walletAddress || null;

  // Get current block height
  const { blockHeight, isLoading: blockLoading } = useBlockHeight(30000);

  // Get user's streams split by role
  const {
    outgoingStreams,
    incomingStreams,
    hasOutgoing,
    hasIncoming,
    totalOutgoing,
    totalIncoming,
    allStreams,
    isLoading: streamsLoading,
    refetch
  } = useUserStreamsByRole(userAddress);

  const { write: updateStreamSender } = useUpdateStreamSender();

  const handleCompleteTransfer = async (newOwner: string) => {
    // Find the stream from outgoingStreams that matches the new owner
    const stream = outgoingStreams.find(s => s.sender.toLowerCase() === newOwner.toLowerCase());
    if (!stream) return;

    try {
      const txId = await updateStreamSender(Number(stream.id), newOwner);

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

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        if (userAddress) {
          const balance = await walletService.getStxBalance();
          setWalletBalance(balance);
        }
      } catch (error) {
        console.error('Error loading wallet data:', error);
      }
    };

    loadWalletData();
  }, [userAddress]);

  // Auto-refresh streams every 30 seconds to catch newly confirmed transactions
  useEffect(() => {
    if (!userAddress) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing overview from blockchain...');
      refetch();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [userAddress, refetch]);

  // Calculate combined stats with proper BigInt handling
  const activeStreams = allStreams?.filter(s => s.status === StreamStatus.ACTIVE).length || 0;
  const completedStreams = allStreams?.filter(s => s.status === StreamStatus.COMPLETED).length || 0;

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

  const totalStreamed = allStreams?.reduce((sum, stream) => {
    return sum + toBigInt(stream.vestedAmount);
  }, BigInt(0)) || BigInt(0);

  const totalVolume = allStreams?.reduce((sum, stream) => {
    return sum + toBigInt(stream.amount);
  }, BigInt(0)) || BigInt(0);

  console.log('📊 Dashboard Stats:', {
    totalVolume: totalVolume.toString(),
    totalVolumeDisplay: microToDisplay(totalVolume),
    streamCount: allStreams?.length,
  });

  // Calculate role-specific stats
  const totalSending = outgoingStreams.reduce((sum, s) => sum + toBigInt(s.amount), BigInt(0));
  const totalReceiving = incomingStreams.reduce((sum, s) => sum + toBigInt(s.vestedAmount), BigInt(0));
  const availableToWithdraw = incomingStreams.reduce((sum, s) => sum + toBigInt(s.withdrawableAmount), BigInt(0));

  const stats = [
    {
      title: "Total Streamed",
      value: `${microToDisplay(totalStreamed)} sBTC`,
      subtitle: `${completedStreams} completed`,
      icon: Bitcoin,
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950/40",
    },
    {
      title: "Active Streams",
      value: activeStreams.toString(),
      subtitle: `${allStreams?.length || 0} Total`,
      icon: Activity,
      color: "text-pink-500 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-950/40",
    },
    {
      title: "Total Volume",
      value: `${microToDisplay(totalVolume)} sBTC`,
      subtitle: "All streams combined",
      icon: TrendingUp,
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950/40",
    },
    {
      title: "Available to Withdraw",
      value: `${microToDisplay(availableToWithdraw)} sBTC`,
      subtitle: "Ready for withdrawal",
      icon: Wallet,
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-950/40",
    },
  ];

  // Chart data for analytics
  const analyticsData = allStreams && allStreams.length > 0 ?
    allStreams.slice(0, 6).map((stream, i) => ({
      month: `S${i + 1}`,
      amount: Number(microToDisplay(stream.amount)),
    })) : [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
    ];

  // Stream status distribution
  const statusData = [
    { name: 'Active', value: activeStreams },
    { name: 'Completed', value: completedStreams },
    { name: 'Cancelled', value: allStreams?.filter(s => s.status === StreamStatus.CANCELLED).length || 0 },
  ].filter(item => item.value > 0);

  // No mock data needed - we'll pass real streams directly

  // Recent streams for component
  const recentStreams = allStreams ? allStreams.slice(0, 3) : [];

  const loading = blockLoading || streamsLoading;

  if (loading && !blockHeight) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-pink" />
        <p className="ml-3 text-muted-foreground">Loading blockchain data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your Bitcoin streaming activity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
            onClick={() => refetch()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Updating...' : 'Refresh Data'}
          </Button>

          {userAddress && (
            <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
              <Link href="/dashboard/streams/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Stream
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            index={index}
          />
        ))}
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            Overview
          </TabsTrigger>
          {hasOutgoing && (
            <TabsTrigger
              value="sending"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
            >
              <Send className="h-4 w-4 mr-2" />
              Sending ({totalOutgoing})
            </TabsTrigger>
          )}
          {hasIncoming && (
            <TabsTrigger
              value="receiving"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Receiving ({totalIncoming})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecentStreams streams={recentStreams} />
            <QuickActions />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StreamingAnalytics data={analyticsData} />
            <StreamStatusDistribution data={statusData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MarketplaceActivity
              listings={12}
              sales={34}
              nfts={56}
            />
            <TreasuryInfo
              balance="1.234"
              feesCollected="0.056"
            />
          </div>

          <NFTGallery
            recipientStreams={incomingStreams}
            obligationStreams={outgoingStreams}
            displayAmount={microToDisplay}
            userAddress={userAddress}
            onTransfer={(stream) => setSelectedStreamForTransfer(stream)}
            onListMarketplace={(stream) => setSelectedStreamForListing(stream)}
            onCompleteTransfer={handleCompleteTransfer}
          />
        </TabsContent>

        {/* Sending Tab */}
        {hasOutgoing && (
          <TabsContent value="sending" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Streams I'm Sending</CardTitle>
                    <CardDescription>
                      Manage outgoing Bitcoin streams and obligation NFTs
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-pink">{microToDisplay(totalSending)} sBTC</p>
                    <p className="text-xs text-muted-foreground">Total locked</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outgoingStreams.map((stream) => (
                    <Link
                      key={stream.id.toString()}
                      href={`/dashboard/streams/${stream.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-brand-pink/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-pink/10 rounded-full">
                          <ArrowUpRight className="h-5 w-5 text-brand-pink" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Stream #{stream.id.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            To: {stream.recipient.slice(0, 8)}...{stream.recipient.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{microToDisplay(stream.amount)} sBTC</p>
                        <Badge variant={stream.status === StreamStatus.ACTIVE ? 'default' : 'secondary'} className="text-xs">
                          {stream.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Receiving Tab */}
        {hasIncoming && (
          <TabsContent value="receiving" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Streams I'm Receiving</CardTitle>
                    <CardDescription>
                      View incoming Bitcoin streams and withdraw funds
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-teal">{microToDisplay(availableToWithdraw)} sBTC</p>
                    <p className="text-xs text-muted-foreground">Available to withdraw</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableToWithdraw > BigInt(0) && (
                    <Button className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white">
                      <Wallet className="mr-2 h-4 w-4" />
                      Withdraw All ({microToDisplay(availableToWithdraw)} sBTC)
                    </Button>
                  )}

                  {incomingStreams.map((stream) => (
                    <Link
                      key={stream.id.toString()}
                      href={`/dashboard/streams/${stream.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-brand-teal/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-teal/10 rounded-full">
                          <ArrowDownLeft className="h-5 w-5 text-brand-teal" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Stream #{stream.id.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From: {stream.sender.slice(0, 8)}...{stream.sender.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-teal">
                          {microToDisplay(stream.withdrawableAmount)} sBTC
                        </p>
                        <Badge variant={stream.status === StreamStatus.ACTIVE ? 'default' : 'secondary'} className="text-xs">
                          {stream.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Getting Started Card (for new users) */}
      {(!allStreams || allStreams.length === 0) && userAddress && (
        <Card className="border-brand-pink/20 bg-brand-pink/5">
          <CardHeader>
            <CardTitle className="text-brand-pink">🚀 Get Started with BitPay</CardTitle>
            <CardDescription>
              Create your first Bitcoin stream in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  1
                </div>
                <p className="text-sm font-medium">Connect Wallet</p>
                <p className="text-xs text-muted-foreground">Link your Stacks wallet</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  2
                </div>
                <p className="text-sm font-medium">Create Stream</p>
                <p className="text-xs text-muted-foreground">Set recipient and amount</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  3
                </div>
                <p className="text-sm font-medium">Start Streaming</p>
                <p className="text-xs text-muted-foreground">Bitcoin flows automatically</p>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
                <Link href="/dashboard/streams/create">
                  Create Your First Stream
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
