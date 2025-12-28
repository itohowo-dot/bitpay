"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface BulkStreamEntry {
  recipient: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  status: "pending" | "processing" | "success" | "error";
  txId?: string;
  error?: string;
}

interface StreamsTableProps {
  streams: BulkStreamEntry[];
}

export function StreamsTable({ streams }: StreamsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left">
            <th className="pb-2">#</th>
            <th className="pb-2">Recipient</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Start Block</th>
            <th className="pb-2">End Block</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {streams.map((stream, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2">{idx + 1}</td>
              <td className="py-2 font-mono text-xs">
                {stream.recipient.slice(0, 8)}...{stream.recipient.slice(-6)}
              </td>
              <td className="py-2">{stream.amount} sBTC</td>
              <td className="py-2">{stream.startBlock}</td>
              <td className="py-2">{stream.endBlock}</td>
              <td className="py-2">
                {stream.status === "pending" && (
                  <Badge variant="secondary">Pending</Badge>
                )}
                {stream.status === "processing" && (
                  <Badge className="bg-blue-500">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Processing
                  </Badge>
                )}
                {stream.status === "success" && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                )}
                {stream.status === "error" && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
