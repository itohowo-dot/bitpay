"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DualNFTExplanation() {
  return (
    <Alert className="border-brand-teal/30 bg-brand-teal/5">
      <Info className="h-4 w-4 text-brand-teal" />
      <AlertDescription>
        <p className="font-medium mb-2 text-brand-teal">Dual NFT System</p>
        <div className="text-sm space-y-1">
          <p><strong>Recipient NFTs (Soul-bound):</strong> Non-transferable proof of payment receipt. Can't be sold or transferred.</p>
          <p><strong>Obligation NFTs (Transferable):</strong> Represents payment obligation. Can be transferred for invoice factoring.</p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
