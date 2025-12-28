"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketInsightsProps {
  activeListings: number;
  avgDaysRemaining: number;
  bestDiscount: number;
  bestAPR: number;
}

export function MarketInsights({ activeListings, avgDaysRemaining, bestDiscount, bestAPR }: MarketInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Insights</CardTitle>
        <CardDescription>Key statistics and trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Active Listings</span>
            <span className="font-medium">{activeListings}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Avg. Days Remaining</span>
            <span className="font-medium">{avgDaysRemaining} days</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Best Discount</span>
            <span className="font-medium text-brand-pink">{bestDiscount}%</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Best APR</span>
            <span className="font-medium text-green-600">{bestAPR}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
