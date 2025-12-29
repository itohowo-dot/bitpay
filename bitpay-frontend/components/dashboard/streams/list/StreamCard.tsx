"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, Pause, ArrowUpRight, Loader2 } from "lucide-react";
import { microToDisplay, StreamStatus } from "@/lib/contracts/config";

interface StreamCardProps {
  stream: {
    id: bigint;
    sender: string;
    recipient: string;
    amount: bigint;
    vestedAmount: bigint;
    withdrawn: bigint;
    withdrawableAmount: bigint;
    "start-block": bigint;
    "end-block": bigint;
    status: StreamStatus;
  };
  isRecipient: boolean;
  progress: number;
  onWithdraw?: (streamId: bigint) => void;
  onCancel?: (streamId: bigint) => void;
  isWithdrawing?: boolean;
  isCancelling?: boolean;
}

const getStatusIcon = (status: StreamStatus) => {
  switch (status) {
    case StreamStatus.ACTIVE:
      return <Clock className="h-4 w-4 text-brand-teal" />;
    case StreamStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case StreamStatus.PENDING:
      return <Pause className="h-4 w-4 text-yellow-500" />;
    case StreamStatus.CANCELLED:
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: StreamStatus) => {
  switch (status) {
    case StreamStatus.ACTIVE:
      return <Badge className="bg-brand-teal text-white">Active</Badge>;
    case StreamStatus.COMPLETED:
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    case StreamStatus.PENDING:
      return <Badge variant="secondary">Pending</Badge>;
    case StreamStatus.CANCELLED:
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function StreamCard({
  stream,
  isRecipient,
  progress,
  onWithdraw,
  onCancel,
  isWithdrawing,
  isCancelling,
}: StreamCardProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getStatusIcon(stream.status)}
              <CardTitle className="text-lg">Stream #{stream.id.toString()}</CardTitle>
              {getStatusBadge(stream.status)}
            </div>
            <CardDescription>
              {isRecipient ? "Receiving from" : "Sending to"}{" "}
              {truncateAddress(isRecipient ? stream.sender : stream.recipient)}
            </CardDescription>
          </div>
          <Link href={`/dashboard/streams/${stream.id}`}>
            <Button variant="ghost" size="sm">
              View Details
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Amounts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
            <p className="text-lg font-semibold">{microToDisplay(stream.amount)} sBTC</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vested</p>
            <p className="text-lg font-semibold text-brand-teal">
              {microToDisplay(stream.vestedAmount)} sBTC
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Withdrawn</p>
            <p className="text-lg font-semibold">{microToDisplay(stream.withdrawn)} sBTC</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-lg font-semibold text-brand-pink">
              {microToDisplay(stream.withdrawableAmount)} sBTC
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Block Info */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start: Block {stream["start-block"].toString()}</span>
          <span>End: Block {stream["end-block"].toString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isRecipient && stream.withdrawableAmount > BigInt(0) && stream.status !== StreamStatus.CANCELLED && onWithdraw && (
            <Button
              onClick={() => onWithdraw(stream.id)}
              disabled={isWithdrawing}
              className="bg-brand-teal hover:bg-brand-teal/90"
            >
              {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Withdraw
            </Button>
          )}
          {!isRecipient && stream.status === StreamStatus.ACTIVE && onCancel && (
            <Button
              variant="destructive"
              onClick={() => onCancel(stream.id)}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Stream
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/streams/${stream.id}`}>View Full Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
