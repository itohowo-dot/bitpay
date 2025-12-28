"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Download, XCircle } from "lucide-react";

interface KeyMetricsGridProps {
  totalVolume: string;
  totalStreams: number;
  totalVested: string;
  vestedPercentage: string;
  totalAvailable: string;
  cancellationRate: string;
  cancelledCount: number;
}

export function KeyMetricsGrid({
  totalVolume,
  totalStreams,
  totalVested,
  vestedPercentage,
  totalAvailable,
  cancellationRate,
  cancelledCount,
}: KeyMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVolume} sBTC</div>
          <p className="text-xs text-muted-foreground">Across {totalStreams} streams</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vested</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand-teal">
            {totalVested} sBTC
          </div>
          <p className="text-xs text-muted-foreground">
            {vestedPercentage}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <Download className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand-pink">
            {totalAvailable} sBTC
          </div>
          <p className="text-xs text-muted-foreground">Ready to withdraw</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {cancellationRate}%
          </div>
          <p className="text-xs text-muted-foreground">{cancelledCount} cancelled</p>
        </CardContent>
      </Card>
    </div>
  );
}
