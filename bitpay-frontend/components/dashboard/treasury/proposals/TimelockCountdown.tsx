"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TimelockCountdownProps {
  proposedAt: number;
  currentBlock: number | null;
  timelockBlocks?: number;
}

export function TimelockCountdown({
  proposedAt,
  currentBlock,
  timelockBlocks = 144, // 24 hours default
}: TimelockCountdownProps) {
  const [progress, setProgress] = useState(0);

  const unlockBlock = proposedAt + timelockBlocks;
  const blocksRemaining = currentBlock ? Math.max(0, unlockBlock - currentBlock) : 0;
  const isUnlocked = blocksRemaining === 0;

  // Calculate progress
  useEffect(() => {
    if (!currentBlock) return;
    const elapsed = currentBlock - proposedAt;
    const progressPercent = Math.min(100, (elapsed / timelockBlocks) * 100);
    setProgress(progressPercent);
  }, [currentBlock, proposedAt, timelockBlocks]);

  // Format time (rough estimate: 10 min per block)
  const formatTime = (blocks: number): string => {
    if (blocks === 0) return "Ready";
    const totalMinutes = blocks * 10;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isUnlocked) {
    return (
      <Badge className="bg-green-500 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Timelock Elapsed
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Timelock</span>
        </div>
        <span className="font-medium">{formatTime(blocksRemaining)}</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {blocksRemaining} blocks remaining
      </p>
    </div>
  );
}
