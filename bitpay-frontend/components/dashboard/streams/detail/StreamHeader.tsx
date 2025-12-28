"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, XCircle, Pause } from "lucide-react";
import { StreamStatus } from "@/lib/contracts/config";

interface StreamHeaderProps {
  streamId: string;
  status: StreamStatus;
}

const getStatusIcon = (status: StreamStatus) => {
  switch (status) {
    case StreamStatus.ACTIVE:
      return <Clock className="h-5 w-5 text-brand-teal" />;
    case StreamStatus.COMPLETED:
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case StreamStatus.PENDING:
      return <Pause className="h-5 w-5 text-yellow-500" />;
    case StreamStatus.CANCELLED:
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5" />;
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

export function StreamHeader({ streamId, status }: StreamHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold">Stream #{streamId}</h1>
        <p className="text-muted-foreground">Detailed view of payment stream</p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        {getStatusBadge(status)}
      </div>
    </div>
  );
}
