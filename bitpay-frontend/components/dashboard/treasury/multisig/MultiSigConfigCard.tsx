"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { microToDisplay } from "@/lib/contracts/config";

interface MultiSigConfigCardProps {
  config: {
    requiredSignatures?: any;
    timelockBlocks?: any;
    dailyLimit?: any;
    withdrawnToday?: any;
    proposalExpiryBlocks?: any;
  };
}

export function MultiSigConfigCard({ config }: MultiSigConfigCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Current multi-sig treasury settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Required Signatures</p>
            <p className="text-2xl font-bold">
              {String(config.requiredSignatures?.value || config.requiredSignatures || 3)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Timelock</p>
            <p className="text-2xl font-bold">
              {String(config.timelockBlocks?.value || config.timelockBlocks || 144)}
            </p>
            <p className="text-xs text-muted-foreground">~24 hours</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Limit</p>
            <p className="text-2xl font-bold">
              {microToDisplay(config.dailyLimit?.value || config.dailyLimit || BigInt(10000000000))}
            </p>
            <p className="text-xs text-muted-foreground">sBTC per day</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Withdrawn Today</p>
            <p className="text-2xl font-bold">
              {microToDisplay(config.withdrawnToday?.value || config.withdrawnToday || BigInt(0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Proposal Expiry</p>
            <p className="text-2xl font-bold">
              {String(config.proposalExpiryBlocks?.value || config.proposalExpiryBlocks || 1008)}
            </p>
            <p className="text-xs text-muted-foreground">~7 days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
