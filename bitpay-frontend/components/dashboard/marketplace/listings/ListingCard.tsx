"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowUpRight, DollarSign, Percent, Calendar, TrendingUp, CreditCard } from "lucide-react";

interface ListingCardProps {
  listing: {
    streamId: string;
    seller: string;
    price: number;
    discount: number;
    totalAmount: number;
    remainingAmount: number;
    daysRemaining: number;
    apr: number;
    listed: string;
  };
  onBuyDirect: () => void;
  onBuyViaGateway: () => void;
}

export function ListingCard({ listing, onBuyDirect, onBuyViaGateway }: ListingCardProps) {
  return (
    <Card className="overflow-hidden hover:border-brand-pink/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-brand-pink text-white">
            {listing.discount}% OFF
          </Badge>
          <span className="text-xs text-muted-foreground">{listing.listed}</span>
        </div>
        <CardTitle className="text-lg">Stream #{listing.streamId}</CardTitle>
        <CardDescription className="font-mono text-xs">
          {listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="p-4 bg-brand-pink/5 rounded-lg border border-brand-pink/20">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-muted-foreground">Sale Price</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand-pink">
                {listing.price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                {listing.totalAmount.toFixed(2)} sBTC
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-medium">{listing.remainingAmount.toFixed(2)} sBTC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">APR</p>
              <p className="font-medium text-green-600">{listing.apr.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium">{listing.daysRemaining}d</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Profit</p>
              <p className="font-medium text-green-600">
                +{(listing.totalAmount - listing.price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onBuyDirect}
              className="bg-brand-pink hover:bg-brand-pink/90"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Buy Direct
            </Button>
            <Button
              onClick={onBuyViaGateway}
              variant="outline"
              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
              size="sm"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Via Gateway
            </Button>
          </div>
          <Button
            variant="outline"
            asChild
            className="w-full"
            size="sm"
          >
            <Link href={`/dashboard/streams/${listing.streamId}`}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
