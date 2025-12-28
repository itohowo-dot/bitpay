"use client";

import { Progress } from "@/components/ui/progress";

interface StreamProgressProps {
  progress: number;
}

export function StreamProgress({ progress }: StreamProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Vesting Progress</span>
        <span className="font-medium">{progress.toFixed(2)}%</span>
      </div>
      <Progress value={progress} className="h-3" />
    </div>
  );
}
