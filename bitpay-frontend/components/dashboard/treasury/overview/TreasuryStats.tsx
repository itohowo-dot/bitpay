"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Settings, UserCog, FileText } from "lucide-react";

interface TreasuryStatsProps {
  balance: string;
  totalFees: string;
  adminCount: number;
  pendingProposals: number;
}

export function TreasuryStats({ balance, totalFees, adminCount, pendingProposals }: TreasuryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand-teal">
            {balance} sBTC
          </div>
          <p className="text-xs text-muted-foreground">
            Available for withdrawal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees Collected</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalFees} sBTC
          </div>
          <p className="text-xs text-muted-foreground">
            All-time collection
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Multi-Sig Admins</CardTitle>
          <UserCog className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand-pink">
            {adminCount}/5
          </div>
          <p className="text-xs text-muted-foreground">
            3 approvals required
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">
            {pendingProposals}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting action
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
