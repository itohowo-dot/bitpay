"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TreasuryOverviewCardProps {
  feeRate: number;
  balance: string;
  totalFees: string;
  adminCount: number;
}

export function TreasuryOverviewCard({ feeRate, balance, totalFees, adminCount }: TreasuryOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treasury Overview</CardTitle>
        <CardDescription>
          Fee collection and treasury statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Current Fee Rate</span>
            <span className="font-semibold">{feeRate.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Treasury Balance</span>
            <span className="font-semibold">{balance} sBTC</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Total Fees Collected</span>
            <span className="font-semibold">{totalFees} sBTC</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Multi-Sig Status</span>
            <Badge className="bg-green-500 text-white">
              {adminCount}/5 Admins Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
