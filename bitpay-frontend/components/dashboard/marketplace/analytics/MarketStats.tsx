"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketStatsProps {
  avgDiscount: number;
  avgAPR: number;
  totalVolume: number;
}

export function MarketStats({ avgDiscount, avgAPR, totalVolume }: MarketStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. Discount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand-pink">{avgDiscount.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Across all listings</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. APR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{avgAPR.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Annual return rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalVolume} sBTC</div>
          <p className="text-xs text-muted-foreground mt-1">Listed for sale</p>
        </CardContent>
      </Card>
    </div>
  );
}
