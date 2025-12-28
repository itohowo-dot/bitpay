"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsHeader } from "@/components/dashboard/analytics/AnalyticsHeader";
import { KeyMetricsGrid } from "@/components/dashboard/analytics/metrics/KeyMetricsGrid";
import { VestingChart } from "@/components/dashboard/analytics/charts/VestingChart";
import { StatusPieChart } from "@/components/dashboard/analytics/charts/StatusPieChart";
import { ParticipationBreakdown } from "@/components/dashboard/analytics/overview/ParticipationBreakdown";
import { KeyStatistics } from "@/components/dashboard/analytics/overview/KeyStatistics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  Loader2,
  BarChart3,
  Shuffle,
  Shield,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserStreamsByRole } from "@/hooks/use-user-streams";
import { useTotalFeesCollected } from "@/hooks/use-bitpay-read";
import { useBlockHeight } from "@/hooks/use-block-height";
import { microToDisplay, StreamStatus, calculateProgress } from "@/lib/contracts/config";

export default function AnalyticsPage() {
  // Get user address from authenticated session instead of wallet
  const { user } = useAuth();
  const userAddress = user?.walletAddress || null;

  const { blockHeight } = useBlockHeight();
  const {
    outgoingStreams,
    incomingStreams,
    allStreams,
    isLoading
  } = useUserStreamsByRole(userAddress);
  const { data: totalFees } = useTotalFeesCollected();

  // Calculate analytics
  const activeStreams = allStreams?.filter((s) => s.status === StreamStatus.ACTIVE) || [];
  const completedStreams = allStreams?.filter((s) => s.status === StreamStatus.COMPLETED) || [];
  const pendingStreams = allStreams?.filter((s) => s.status === StreamStatus.PENDING) || [];
  const cancelledStreams = allStreams?.filter((s) => s.status === StreamStatus.CANCELLED) || [];

  // Helper to convert to BigInt safely
  const toBigInt = (val: any): bigint => {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'string') return BigInt(val);
    if (typeof val === 'number') return BigInt(Math.floor(val));
    return BigInt(0);
  };

  const totalStreamed = allStreams?.reduce((sum, s) => sum + toBigInt(s.vestedAmount), BigInt(0)) || BigInt(0);
  const totalVolume = allStreams?.reduce((sum, s) => sum + toBigInt(s.amount), BigInt(0)) || BigInt(0);
  const totalWithdrawn = allStreams?.reduce((sum, s) => sum + toBigInt(s.withdrawn), BigInt(0)) || BigInt(0);
  const totalAvailable = allStreams?.reduce((sum, s) => sum + toBigInt(s.withdrawableAmount), BigInt(0)) || BigInt(0);

  // Status distribution for pie chart
  const statusData = [
    { name: "Active", value: activeStreams.length, color: "#14b8a6" },
    { name: "Completed", value: completedStreams.length, color: "#22c55e" },
    { name: "Pending", value: pendingStreams.length, color: "#eab308" },
    { name: "Cancelled", value: cancelledStreams.length, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Monthly volume data
  const monthlyData = allStreams
    ?.slice(0, 6)
    .map((stream, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        month: "short",
      }),
      volume: Number(microToDisplay(stream.amount)),
      vested: Number(microToDisplay(stream.vestedAmount)),
    })) || [];

  // Progress distribution
  const progressBuckets = allStreams?.reduce(
    (acc, stream) => {
      if (!blockHeight) return acc;
      const progress = calculateProgress(
        stream["start-block"],
        stream["end-block"],
        BigInt(blockHeight)
      );

      if (progress < 25) acc["0-25%"]++;
      else if (progress < 50) acc["25-50%"]++;
      else if (progress < 75) acc["50-75%"]++;
      else acc["75-100%"]++;

      return acc;
    },
    { "0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0 }
  ) || { "0-25%": 0, "25-50%": 0, "50-75%": 0, "75-100%": 0 };

  const progressData = Object.entries(progressBuckets).map(([range, count]) => ({
    range,
    count,
  }));

  // Cancellation rate analysis
  const cancellationRate = allStreams && allStreams.length > 0
    ? (cancelledStreams.length / allStreams.length) * 100
    : 0;

  const cancellationData = [
    { month: 'Jan', cancellations: 2, streams: 15 },
    { month: 'Feb', cancellations: 1, streams: 20 },
    { month: 'Mar', cancellations: 3, streams: 18 },
    { month: 'Apr', cancellations: 0, streams: 22 },
    { month: 'May', cancellations: 4, streams: 25 },
    { month: 'Jun', cancellations: cancelledStreams.length, streams: allStreams?.length || 0 },
  ];

  // NFT Transfer Activity (mock data - would come from obligation NFT events)
  const nftTransferData = [
    { date: '1 week ago', transfers: 0 },
    { date: '6 days ago', transfers: 0 },
    { date: '5 days ago', transfers: 1 },
    { date: '4 days ago', transfers: 0 },
    { date: '3 days ago', transfers: 2 },
    { date: '2 days ago', transfers: 1 },
    { date: 'Today', transfers: 0 },
  ];

  // Average stream duration
  const avgDuration = allStreams && allStreams.length > 0
    ? allStreams.reduce((sum, s) => sum + Number(s["end-block"] - s["start-block"]), 0) / allStreams.length
    : 0;

  // Withdrawal pattern (mock data)
  const withdrawalPattern = [
    { day: 'Mon', withdrawals: 2, amount: 1.5 },
    { day: 'Tue', withdrawals: 1, amount: 0.8 },
    { day: 'Wed', withdrawals: 3, amount: 2.1 },
    { day: 'Thu', withdrawals: 0, amount: 0 },
    { day: 'Fri', withdrawals: 2, amount: 1.2 },
    { day: 'Sat', withdrawals: 1, amount: 0.5 },
    { day: 'Sun', withdrawals: 0, amount: 0 },
  ];

  if (isLoading && !allStreams) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-pink" />
        <p className="ml-3 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader />

      <KeyMetricsGrid
        totalVolume={microToDisplay(totalVolume)}
        totalStreams={allStreams?.length || 0}
        totalVested={microToDisplay(totalStreamed)}
        vestedPercentage={((Number(totalStreamed) / Number(totalVolume || 1)) * 100).toFixed(1)}
        totalAvailable={microToDisplay(totalAvailable)}
        cancellationRate={cancellationRate.toFixed(1)}
        cancelledCount={cancelledStreams.length}
      />

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="distribution"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <Activity className="h-4 w-4 mr-2" />
            Distribution
          </TabsTrigger>
          <TabsTrigger
            value="nfts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            NFT Activity
          </TabsTrigger>
          <TabsTrigger
            value="patterns"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-pink data-[state=active]:bg-transparent"
          >
            <Clock className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <VestingChart data={monthlyData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParticipationBreakdown
              sentCount={outgoingStreams.length}
              sentAmount={microToDisplay(outgoingStreams.reduce((sum, s) => sum + s.amount, BigInt(0)))}
              receivedCount={incomingStreams.length}
              receivedAmount={microToDisplay(incomingStreams.reduce((sum, s) => sum + s.amount, BigInt(0)))}
              totalCount={allStreams?.length || 0}
            />

            <KeyStatistics
              avgStreamSize={allStreams && allStreams.length > 0 ? microToDisplay(totalVolume / BigInt(allStreams.length)) : "0"}
              avgDuration={Math.round(avgDuration).toLocaleString()}
              successRate={allStreams && allStreams.length > 0 ? ((completedStreams.length / allStreams.length) * 100).toFixed(1) : "0"}
              platformFees={totalFees ? microToDisplay(totalFees) : "0"}
            />
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusPieChart data={statusData} />

            <Card>
              <CardHeader>
                <CardTitle>Vesting Progress</CardTitle>
                <CardDescription>Streams by completion %</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" className="text-xs" tickLine={false} />
                      <YAxis className="text-xs" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="#e91e63" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cancellation Analysis</CardTitle>
              <CardDescription>Track stream cancellations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cancellationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tickLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="streams" fill="#14b8a6" name="Total Streams" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="cancellations" fill="#ef4444" name="Cancellations" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Activity Tab */}
        <TabsContent value="nfts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-teal" />
                  Recipient NFTs
                </CardTitle>
                <CardDescription>Soul-bound receipt NFTs owned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-brand-teal mb-2">
                  {incomingStreams.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Non-transferable proof of payment receipts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-brand-pink" />
                  Obligation NFTs
                </CardTitle>
                <CardDescription>Transferable payment obligations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-brand-pink mb-2">
                  {outgoingStreams.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Available for invoice factoring
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Obligation NFT Transfer Activity</CardTitle>
              <CardDescription>Weekly transfers for invoice factoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nftTransferData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tickLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="transfers"
                      stroke="#e91e63"
                      strokeWidth={2}
                      dot={{ fill: '#e91e63', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#e91e63', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Patterns</CardTitle>
              <CardDescription>When users withdraw their vested funds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={withdrawalPattern}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tickLine={false} />
                    <YAxis className="text-xs" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="withdrawals" fill="#14b8a6" name="Withdrawals" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Peak Withdrawal Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Wednesday</div>
                <p className="text-xs text-muted-foreground mt-1">Most active day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Time to Withdraw
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.5 days</div>
                <p className="text-xs text-muted-foreground mt-1">From vesting</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Withdrawal Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73%</div>
                <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
