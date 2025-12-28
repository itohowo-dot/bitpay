"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MarketplaceHeaderProps {
  hasListableNFTs: boolean;
  onListClick: () => void;
}

export function MarketplaceHeader({ hasListableNFTs, onListClick }: MarketplaceHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <p className="text-muted-foreground">
          Buy and sell obligation NFTs for invoice factoring
        </p>
      </div>
      {hasListableNFTs && (
        <Button
          onClick={onListClick}
          className="bg-brand-pink hover:bg-brand-pink/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          List NFT for Sale
        </Button>
      )}
    </div>
  );
}
