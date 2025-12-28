"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Tag,
  TrendingUp,
  Info,
  Plus,
} from "lucide-react";
import walletService from "@/lib/wallet/wallet-service";
import { useUserStreamsByRole } from "@/hooks/use-user-streams";
import { StreamStatus, microToDisplay } from "@/lib/contracts/config";
import { ListObligationNFTModal } from "@/components/dashboard/modals/ListObligationNFTModal";
import { BuyObligationNFTModal } from "@/components/dashboard/modals/BuyObligationNFTModal";
import { NFTGridSkeleton } from "@/components/dashboard/NFTCardSkeleton";
import { MarketplaceHeader } from "@/components/dashboard/marketplace/listings/MarketplaceHeader";
import { MarketplaceFilters } from "@/components/dashboard/marketplace/filters/MarketplaceFilters";
import { ListingCard } from "@/components/dashboard/marketplace/listings/ListingCard";
import { EmptyMarketplace } from "@/components/dashboard/marketplace/listings/EmptyMarketplace";
import { MarketStats } from "@/components/dashboard/marketplace/analytics/MarketStats";
import { MarketInsights } from "@/components/dashboard/marketplace/analytics/MarketInsights";

interface MarketplaceListing {
  streamId: string;
  seller: string;
  price: number;
  discount: number;
  totalAmount: number;
  vestedAmount: number;
  remainingAmount: number;
  endBlock: number;
  daysRemaining: number;
  apr: number;
  listed: string;
}

export default function MarketplacePage() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [selectedNFTToList, setSelectedNFTToList] = useState<any | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyMethod, setBuyMethod] = useState<"direct" | "gateway">("direct");
  const [sortBy, setSortBy] = useState("discount");
  const [filterDiscount, setFilterDiscount] = useState("all");

  const { outgoingStreams, isLoading } = useUserStreamsByRole(userAddress);

  useEffect(() => {
    const loadWallet = async () => {
      const address = await walletService.getCurrentAddress();
      setUserAddress(address);
    };
    loadWallet();
  }, []);

  // Mock marketplace listings (in production, fetch from backend)
  const mockListings: MarketplaceListing[] = [
    {
      streamId: "1",
      seller: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
      price: 9.5,
      discount: 5,
      totalAmount: 10,
      vestedAmount: 3,
      remainingAmount: 7,
      endBlock: 150000,
      daysRemaining: 45,
      apr: 12.5,
      listed: "2 days ago",
    },
    {
      streamId: "2",
      seller: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE",
      price: 18,
      discount: 10,
      totalAmount: 20,
      vestedAmount: 8,
      remainingAmount: 12,
      endBlock: 160000,
      daysRemaining: 60,
      apr: 18.2,
      listed: "5 hours ago",
    },
    {
      streamId: "3",
      seller: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE",
      price: 28.5,
      discount: 15,
      totalAmount: 35,
      vestedAmount: 5,
      remainingAmount: 30,
      endBlock: 170000,
      daysRemaining: 90,
      apr: 22.8,
      listed: "1 day ago",
    },
  ];

  // Filter active obligation NFTs that can be listed
  const listableNFTs = outgoingStreams.filter(
    (stream) => stream.status === StreamStatus.ACTIVE && !stream.cancelled
  );

  // Filter and sort listings
  let filteredListings = mockListings.filter((listing) =>
    listing.streamId.includes(searchTerm) ||
    listing.seller.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterDiscount !== "all") {
    const minDiscount = parseInt(filterDiscount);
    filteredListings = filteredListings.filter((l) => l.discount >= minDiscount);
  }

  // Sort listings
  filteredListings.sort((a, b) => {
    switch (sortBy) {
      case "discount":
        return b.discount - a.discount;
      case "apr":
        return b.apr - a.apr;
      case "amount":
        return b.remainingAmount - a.remainingAmount;
      case "time":
        return a.daysRemaining - b.daysRemaining;
      default:
        return 0;
    }
  });

  const calculateDiscount = (price: number, totalAmount: number) => {
    return ((totalAmount - price) / totalAmount) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <MarketplaceHeader hasListableNFTs={false} onListClick={() => {}} />
        <NFTGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketplaceHeader
        hasListableNFTs={listableNFTs.length > 0}
        onListClick={() => setShowListModal(true)}
      />

      {/* Info Alert */}
      <Alert className="border-brand-teal/30 bg-brand-teal/5">
        <Info className="h-4 w-4 text-brand-teal" />
        <AlertDescription>
          <p className="font-medium text-brand-teal mb-1">What is Invoice Factoring?</p>
          <p className="text-sm">
            Obligation NFTs represent future payment streams. Sellers can list them at a discount for
            immediate liquidity, while buyers earn returns by collecting the full stream amount over time.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Listings ({filteredListings.length})
          </TabsTrigger>
          <TabsTrigger value="my-listings">
            <Tag className="h-4 w-4 mr-2" />
            My Listings (0)
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Market Analytics
          </TabsTrigger>
        </TabsList>

        {/* Browse Listings Tab */}
        <TabsContent value="browse" className="space-y-6">
          <MarketplaceFilters
            searchTerm={searchTerm}
            sortBy={sortBy}
            filterDiscount={filterDiscount}
            onSearchChange={setSearchTerm}
            onSortChange={setSortBy}
            onDiscountFilterChange={setFilterDiscount}
          />

          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <EmptyMarketplace
              hasListableNFTs={listableNFTs.length > 0}
              isFiltered={searchTerm !== "" || filterDiscount !== "all"}
              onListClick={() => setShowListModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.streamId}
                  listing={listing}
                  onBuyDirect={() => {
                    setSelectedListing(listing);
                    setBuyMethod("direct");
                    setShowBuyModal(true);
                  }}
                  onBuyViaGateway={() => {
                    setSelectedListing(listing);
                    setBuyMethod("gateway");
                    setShowBuyModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Listings Tab */}
        <TabsContent value="my-listings" className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Active Listings</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  You haven't listed any obligation NFTs for sale yet.
                </p>
                {listableNFTs.length > 0 && (
                  <Button
                    onClick={() => setShowListModal(true)}
                    className="bg-brand-pink hover:bg-brand-pink/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    List Your First NFT
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <MarketStats
            avgDiscount={10.2}
            avgAPR={17.8}
            totalVolume={65}
          />

          <MarketInsights
            activeListings={mockListings.length}
            avgDaysRemaining={65}
            bestDiscount={15}
            bestAPR={22.8}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedNFTToList && (
        <ListObligationNFTModal
          isOpen={showListModal}
          onClose={() => {
            setShowListModal(false);
            setSelectedNFTToList(null);
          }}
          streamId={selectedNFTToList.id?.toString() || ""}
          obligationTokenId={selectedNFTToList.id?.toString() || ""}
          currentAmount={microToDisplay(selectedNFTToList.totalAmount || BigInt(0)).toString()}
          onSuccess={() => {
            setShowListModal(false);
            setSelectedNFTToList(null);
            // Refresh listings
          }}
        />
      )}

      {selectedListing && (
        <BuyObligationNFTModal
          isOpen={showBuyModal}
          onClose={() => {
            setShowBuyModal(false);
            setSelectedListing(null);
          }}
          listing={selectedListing}
          onSuccess={() => {
            setShowBuyModal(false);
            setSelectedListing(null);
            // Refresh listings
          }}
        />
      )}
    </div>
  );
}
