"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StreamsSummaryProps {
  totalStreams: number;
  successCount: number;
  errorCount: number;
}

export function StreamsSummary({
  totalStreams,
  successCount,
  errorCount,
}: StreamsSummaryProps) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{totalStreams}</p>
            <p className="text-xs text-muted-foreground">Total Streams</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{successCount}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{errorCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
