"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users } from "lucide-react";
import { StreamsTable } from "./StreamsTable";

interface BulkStreamEntry {
  recipient: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  status: "pending" | "processing" | "success" | "error";
  txId?: string;
  error?: string;
}

interface StreamsPreviewProps {
  streams: BulkStreamEntry[];
  isProcessing: boolean;
  currentIndex: number;
  progress: number;
  onProcess: () => void;
}

export function StreamsPreview({
  streams,
  isProcessing,
  currentIndex,
  progress,
  onProcess,
}: StreamsPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Streams Preview ({streams.length})
            </CardTitle>
            <CardDescription>Review before processing</CardDescription>
          </div>
          <Button
            onClick={onProcess}
            disabled={isProcessing || streams.every((s) => s.status === "success")}
            className="bg-brand-pink hover:bg-brand-pink/90"
          >
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
            ) : (
              "Process All Streams"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isProcessing && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {currentIndex + 1} / {streams.length}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <StreamsTable streams={streams} />
      </CardContent>
    </Card>
  );
}
