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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Tag, Info, Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { microToDisplay, displayToMicro } from "@/lib/contracts/config";
import { useListNFT } from "@/hooks/use-marketplace";

interface ListObligationNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  obligationTokenId: string;
  currentAmount: string;
  onSuccess?: () => void;
}

export function ListObligationNFTModal({
  isOpen,
  onClose,
  streamId,
  obligationTokenId,
  currentAmount,
  onSuccess,
}: ListObligationNFTModalProps) {
  const [listingPrice, setListingPrice] = useState("");
  const [error, setError] = useState("");
  const { listNFT, isLoading, error: listError } = useListNFT();

  // Use the passed amount directly
  const totalAmount = parseFloat(currentAmount) || 0;
  const price = parseFloat(listingPrice) || 0;
  const discount = totalAmount > 0 ? ((totalAmount - price) / totalAmount) * 100 : 0;

  const handleList = async () => {
    setError("");

    // Validation
    if (!listingPrice || price <= 0) {
      setError("Please enter a valid listing price");
      return;
    }

    if (price >= totalAmount) {
      setError("Listing price must be less than the total stream amount");
      return;
    }

    if (discount < 1) {
      setError("Minimum discount of 1% required to attract buyers");
      return;
    }

    try {
      console.log("Listing NFT:", {
        streamId: streamId,
        obligationTokenId: obligationTokenId,
        priceInsBTC: price,
        discount: discount.toFixed(2),
      });

      // Call marketplace contract to list NFT
      // The price is in sBTC, convert to sats (micro units)
      const priceInSats = BigInt(displayToMicro(price));

      const txId = await listNFT(Number(streamId), priceInSats);

      if (txId) {
        const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;

        toast.success("NFT Listed Successfully!", {
          description: (
            <div className="space-y-2 mt-1">
              <p className="text-sm">Your Obligation NFT is now live on the marketplace at {discount.toFixed(1)}% discount!</p>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono block hover:underline"
              >
                {txId.substring(0, 20)}...
              </a>
            </div>
          ),
          duration: 15000,
        });

        console.log('✅ NFT listed on marketplace!');
        console.log('📋 Transaction ID:', txId);
        console.log('🔗 Explorer:', explorerUrl);

        if (onSuccess) {
          onSuccess();
        }

        handleClose();
      }
    } catch (err: any) {
      console.error("Error listing NFT:", err);
      setError(err.message || "Failed to list NFT. Please try again.");
    }
  };

  const handleClose = () => {
    setListingPrice("");
    setError("");
    onClose();
  };

  // Preset discount options
  const applyDiscount = (discountPercent: number) => {
    const discountedPrice = totalAmount * (1 - discountPercent / 100);
    setListingPrice(discountedPrice.toFixed(8));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-4 w-4 text-brand-pink" />
            List Obligation NFT for Sale
          </DialogTitle>
          <DialogDescription className="text-xs">
            Set your price and list your obligation NFT on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Info Alert */}
          <Alert className="py-2">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-xs">
              <p className="font-medium mb-0.5">Invoice Factoring</p>
              <p className="text-[11px]">
                Sell your future payment stream at a discount for immediate liquidity. Buyers earn
                returns by collecting the full stream amount over time.
              </p>
            </AlertDescription>
          </Alert>

          {/* NFT Details */}
          <div className="p-3 bg-muted rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Obligation NFT #{streamId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{totalAmount.toFixed(8)} sBTC</span>
            </div>
          </div>

          {/* Listing Price */}
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs">Listing Price (sBTC)</Label>
            <Input
              id="price"
              type="number"
              step="0.00000001"
              min="0"
              max={totalAmount}
              placeholder="0.00000000"
              value={listingPrice}
              onChange={(e) => {
                setListingPrice(e.target.value);
                setError("");
              }}
              className={`h-8 text-xs ${error ? "border-red-500" : ""}`}
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </div>

          {/* Quick Discount Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs">Quick Discount Presets</Label>
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyDiscount(5)}
                className="text-[10px] h-7"
              >
                5% Off
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyDiscount(10)}
                className="text-[10px] h-7"
              >
                10% Off
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyDiscount(15)}
                className="text-[10px] h-7"
              >
                15% Off
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyDiscount(20)}
                className="text-[10px] h-7"
              >
                20% Off
              </Button>
            </div>
          </div>

          {/* Calculation Preview */}
          {price > 0 && (
            <div className="p-3 bg-brand-pink/5 border border-brand-pink/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Calculator className="h-3 w-3 text-brand-pink" />
                <h4 className="font-semibold text-brand-pink text-xs">Deal Summary</h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Listing Price:</span>
                  <span className="font-bold text-brand-pink">{price.toFixed(8)} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount Offered:</span>
                  <span className="font-medium text-green-600">{discount.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Stream Value:</span>
                  <span className="font-medium">{totalAmount.toFixed(8)} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You Receive:</span>
                  <span className="font-medium">{price.toFixed(8)} sBTC</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {price > 0 && discount > 25 && (
            <Alert className="border-yellow-500/50 bg-yellow-500/5 py-2">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <AlertDescription className="text-[11px] text-yellow-800">
                High discount! Consider if this price provides enough immediate liquidity value.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleList}
            disabled={isLoading || !listingPrice || price <= 0}
            className="bg-brand-pink hover:bg-brand-pink/90 h-8 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Listing...
              </>
            ) : (
              <>
                <Tag className="h-3 w-3 mr-1.5" />
                List for Sale
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
