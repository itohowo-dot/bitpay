"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shuffle, ArrowRight } from "lucide-react";

export function EmptyObligationNFTs() {
  return (
    <Card className="border-dashed border-brand-pink/30">
      <CardContent className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-pink/10 mb-4">
            <Shuffle className="h-10 w-10 text-brand-pink" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Obligation NFTs Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            When you create a payment stream, you'll receive an obligation NFT representing the payment commitment. These NFTs are transferable and can be sold for invoice factoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
              <Link href="/dashboard/streams/create">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Stream
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shuffle className="h-4 w-4" />
            <span>Transferable • Invoice Factoring</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
