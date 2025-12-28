"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";

interface EmptyMarketplaceProps {
  hasListableNFTs: boolean;
  isFiltered: boolean;
  onListClick: () => void;
}

export function EmptyMarketplace({ hasListableNFTs, isFiltered, onListClick }: EmptyMarketplaceProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Listings Found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {isFiltered
              ? "Try adjusting your filters to see more listings."
              : "Be the first to list an obligation NFT for sale!"}
          </p>
          {hasListableNFTs && (
            <Button
              onClick={onListClick}
              className="bg-brand-pink hover:bg-brand-pink/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              List Your NFT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
