"use client";

import { Card, CardContent } from "@/components/ui/card";

interface NFTStatsProps {
  recipientCount: number;
  obligationCount: number;
  totalReceived: string;
  totalObligations: string;
}

export function NFTStats({ recipientCount, obligationCount, totalReceived, totalObligations }: NFTStatsProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-brand-teal">{recipientCount}</p>
            <p className="text-xs text-muted-foreground">Recipient NFTs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-pink">{obligationCount}</p>
            <p className="text-xs text-muted-foreground">Obligation NFTs</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalReceived}</p>
            <p className="text-xs text-muted-foreground">Total Received (sBTC)</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalObligations}</p>
            <p className="text-xs text-muted-foreground">Total Obligations (sBTC)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
