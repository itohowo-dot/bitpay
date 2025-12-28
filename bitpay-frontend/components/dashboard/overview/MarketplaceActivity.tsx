"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ShoppingBag, TrendingUp, Package } from "lucide-react";

interface MarketplaceActivityProps {
  listings: number;
  sales: number;
  nfts: number;
}

export function MarketplaceActivity({ listings, sales, nfts }: MarketplaceActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketplace Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground">Active Listings</span>
            </div>
            <Badge variant="secondary">{listings}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Total Sales</span>
            </div>
            <Badge variant="secondary">{sales}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-muted-foreground">NFTs Listed</span>
            </div>
            <Badge variant="secondary">{nfts}</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
