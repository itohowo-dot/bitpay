"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ParticipationBreakdownProps {
  sentCount: number;
  sentAmount: string;
  receivedCount: number;
  receivedAmount: string;
  totalCount: number;
}

export function ParticipationBreakdown({
  sentCount,
  sentAmount,
  receivedCount,
  receivedAmount,
  totalCount,
}: ParticipationBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Streams Sent vs Received</CardTitle>
        <CardDescription>Your participation breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sent ({sentCount})</span>
              <span className="text-sm text-muted-foreground">
                {sentAmount} sBTC
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-pink"
                style={{
                  width: `${totalCount > 0 ? (sentCount / totalCount) * 100 : 0}%`
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Received ({receivedCount})</span>
              <span className="text-sm text-muted-foreground">
                {receivedAmount} sBTC
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-teal"
                style={{
                  width: `${totalCount > 0 ? (receivedCount / totalCount) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
