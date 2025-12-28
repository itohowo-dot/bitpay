"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Info, Calculator, TrendingUp, CheckCircle, Calendar, Wallet, CreditCard } from "lucide-react";
import { toast } from "sonner";

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

interface BuyObligationNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: MarketplaceListing;
  onSuccess?: () => void;
}

export function BuyObligationNFTModal({
  isOpen,
  onClose,
  listing,
  onSuccess,
}: BuyObligationNFTModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"direct" | "gateway">("direct");

  const profit = listing.totalAmount - listing.price;
  const roi = (profit / listing.price) * 100;

  const handleBuy = async () => {
    if (!agreedToTerms) {
      toast.error("Please review and accept the terms");
      return;
    }

    setIsLoading(true);

    try {
      if (paymentMethod === "direct") {
        // TODO: Call marketplace smart contract to buy NFT directly
        // marketplace.buy-nft(stream-id) with sBTC payment
        console.log("Buying NFT directly:", {
          streamId: listing.streamId,
          price: listing.price * 1_000_000, // Convert to micro units
          seller: listing.seller,
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success("Purchase successful!", {
          description: `You now own the obligation NFT for Stream #${listing.streamId}`,
        });
      } else {
        // TODO: Create payment stream for the purchase
        // User creates a payment stream to the seller for the listing price
        // Once stream is created, marketplace contract transfers NFT
        console.log("Creating payment stream for NFT:", {
          streamId: listing.streamId,
          price: listing.price * 1_000_000,
          seller: listing.seller,
          duration: "30 days", // Configurable
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success("Payment stream created!", {
          description: `NFT will transfer once payment stream is active`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (err) {
      console.error("Error buying NFT:", err);
      toast.error("Purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAgreedToTerms(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-4 w-4 text-brand-pink" />
            Purchase Obligation NFT
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review the details before completing your purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Listing Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Stream #{listing.streamId}</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                {listing.seller.slice(0, 12)}...{listing.seller.slice(-8)}
              </p>
            </div>
            <Badge className="bg-brand-pink text-white px-2.5 py-1">
              {listing.discount.toFixed(1)}% OFF
            </Badge>
          </div>

          <Separator className="my-1.5" />

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="flex items-start space-x-2 p-2.5 border rounded-lg hover:border-brand-pink/50 transition-colors cursor-pointer">
                <RadioGroupItem value="direct" id="direct" className="mt-0.5" />
                <Label htmlFor="direct" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Wallet className="h-3 w-3 text-brand-pink" />
                    <span className="font-semibold text-xs">Direct Purchase</span>
                    <Badge variant="secondary" className="text-[10px] h-4">Instant</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Pay {listing.price.toFixed(2)} sBTC immediately. NFT transfers instantly.
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2.5 border rounded-lg hover:border-brand-teal/50 transition-colors cursor-pointer">
                <RadioGroupItem value="gateway" id="gateway" className="mt-0.5" />
                <Label htmlFor="gateway" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CreditCard className="h-3 w-3 text-brand-teal" />
                    <span className="font-semibold text-xs">Payment Stream</span>
                    <Badge variant="secondary" className="text-[10px] h-4">Flexible</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Stream payment to seller over time (e.g., 30 days). NFT transfers when stream starts.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator className="my-1.5" />

          {/* Price Breakdown */}
          <div className="p-3 bg-brand-pink/5 border border-brand-pink/20 rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Calculator className="h-3 w-3 text-brand-pink" />
              <h4 className="font-semibold text-brand-pink text-xs">Investment Summary</h4>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price:</span>
                <span className="font-bold text-brand-pink">{listing.price.toFixed(2)} sBTC</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Value:</span>
                <span className="line-through text-muted-foreground text-[11px]">
                  {listing.totalAmount.toFixed(2)} sBTC
                </span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between">
                <span className="text-muted-foreground">You Will Receive:</span>
                <span className="font-bold">{listing.totalAmount.toFixed(2)} sBTC</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Profit:</span>
                <span className="font-bold text-green-600">
                  +{profit.toFixed(2)} sBTC ({roi.toFixed(1)}% ROI)
                </span>
              </div>
            </div>
          </div>

          {/* Investment Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-muted rounded-lg">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-[10px] text-muted-foreground">Annual Return</span>
              </div>
              <p className="text-lg font-bold text-green-600">{listing.apr.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">APR</p>
            </div>

            <div className="p-2.5 bg-muted rounded-lg">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="h-3 w-3 text-brand-teal" />
                <span className="text-[10px] text-muted-foreground">Duration</span>
              </div>
              <p className="text-lg font-bold">{listing.daysRemaining}</p>
              <p className="text-[10px] text-muted-foreground">days remaining</p>
            </div>
          </div>

          {/* Stream Details */}
          <div className="p-3 bg-muted rounded-lg space-y-1.5 text-xs">
            <h4 className="font-semibold mb-1">Stream Details</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stream Amount:</span>
              <span className="font-medium">{listing.totalAmount.toFixed(2)} sBTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Vested:</span>
              <span className="font-medium">{listing.vestedAmount.toFixed(2)} sBTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining to Vest:</span>
              <span className="font-medium text-brand-teal">
                {listing.remainingAmount.toFixed(2)} sBTC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Block:</span>
              <span className="font-medium font-mono text-[11px]">{listing.endBlock}</span>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="py-2">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-[11px]">
              <p className="font-medium mb-0.5">What Happens Next</p>
              <ol className="space-y-0 ml-3 list-decimal text-[10px]">
                <li>You pay {listing.price.toFixed(2)} sBTC to purchase the obligation NFT</li>
                <li>The NFT ownership transfers to you immediately</li>
                <li>You can withdraw vested amounts as the stream continues</li>
                <li>You receive the full {listing.totalAmount.toFixed(2)} sBTC over time</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Terms Acceptance */}
          <div className="flex items-start gap-2 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-[11px] cursor-pointer">
              <span className="font-medium">I understand and accept the terms</span>
              <ul className="mt-1 space-y-0 text-muted-foreground">
                <li>• Payment streams vest linearly over time</li>
                <li>• The seller cannot cancel after you purchase</li>
                <li>• You become the new recipient of the stream</li>
                <li>• Returns are dependent on stream completion</li>
              </ul>
            </label>
          </div>

          {/* Investment Highlight */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <h4 className="font-semibold text-green-800 dark:text-green-400 text-xs">Good Investment</h4>
            </div>
            <p className="text-[11px] text-green-700 dark:text-green-300">
              {listing.apr > 15 && "High APR! "}
              {listing.discount > 10 && "Great discount! "}
              This listing offers attractive returns for passive income.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleBuy}
            disabled={isLoading || !agreedToTerms}
            className={`h-8 text-xs ${paymentMethod === "direct" ? "bg-brand-pink hover:bg-brand-pink/90" : "bg-brand-teal hover:bg-brand-teal/90"}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === "direct" ? (
              <>
                <ShoppingCart className="h-3 w-3 mr-1.5" />
                Buy for {listing.price.toFixed(2)} sBTC
              </>
            ) : (
              <>
                <CreditCard className="h-3 w-3 mr-1.5" />
                Create Payment Stream
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
