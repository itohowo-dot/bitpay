"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, ExternalLink } from "lucide-react";

interface RecipientNFTCardProps {
  stream: {
    id: bigint;
    sender: string;
    amount: bigint;
    vestedAmount: bigint;
  };
  displayAmount: (amount: bigint) => string;
}

export function RecipientNFTCard({ stream, displayAmount }: RecipientNFTCardProps) {
  return (
    <Card className="overflow-hidden hover:border-brand-teal/50 transition-colors">
      {/* NFT Visualization */}
      <div className="relative h-48 bg-brand-teal/10 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-brand-teal/50 mb-2" />
          <p className="text-2xl font-bold">#{stream.id.toString()}</p>
        </div>
        <Badge className="absolute top-3 right-3 bg-brand-teal">
          <Lock className="h-3 w-3 mr-1" />
          Soul-Bound
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="text-lg">Receipt NFT #{stream.id.toString()}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>From:</span>
            <span className="font-mono">{stream.sender.slice(0, 8)}...{stream.sender.slice(-4)}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stream Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Total Amount</p>
            <p className="font-semibold">{displayAmount(stream.amount)} sBTC</p>
          </div>
          <div>
            <p className="text-muted-foreground">Received</p>
            <p className="font-semibold text-brand-teal">
              {displayAmount(stream.vestedAmount)} sBTC
            </p>
          </div>
        </div>

        <Alert>
          <Lock className="h-4 w-4 text-brand-teal" />
          <AlertDescription className="text-xs">
            Non-transferable. Permanent proof of receipt.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
          asChild
        >
          <Link href={`/dashboard/streams/${stream.id}`}>
            View Stream <ExternalLink className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
