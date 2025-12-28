"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KeyStatisticsProps {
  avgStreamSize: string;
  avgDuration: string;
  successRate: string;
  platformFees: string;
}

export function KeyStatistics({
  avgStreamSize,
  avgDuration,
  successRate,
  platformFees,
}: KeyStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Statistics</CardTitle>
        <CardDescription>Important metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Avg Stream Size</span>
          <Badge variant="outline">
            {avgStreamSize} sBTC
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Avg Duration</span>
          <Badge variant="outline">
            {avgDuration} blocks
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Success Rate</span>
          <Badge className="bg-green-500 text-white">
            {successRate}%
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Platform Fees</span>
          <Badge variant="outline">{platformFees} sBTC</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
