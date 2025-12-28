"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";

export function EmptyRecipientNFTs() {
  return (
    <Card className="border-dashed border-brand-teal/30">
      <CardContent className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-teal/10 mb-4">
            <Shield className="h-10 w-10 text-brand-teal" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Recipient NFTs Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            When someone creates a payment stream to you, you'll automatically receive a soul-bound receipt NFT. These NFTs serve as permanent proof of income and cannot be transferred.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Soul-bound • Non-transferable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
