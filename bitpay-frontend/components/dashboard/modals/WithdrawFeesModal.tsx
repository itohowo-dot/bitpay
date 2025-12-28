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
import { Loader2, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface WithdrawFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFeesAvailable: string;
  onSuccess?: () => void;
}

export function WithdrawFeesModal({
  isOpen,
  onClose,
  totalFeesAvailable,
  onSuccess,
}: WithdrawFeesModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWithdraw = async () => {
    setError("");

    // Validate amount
    const withdrawAmount = parseFloat(amount);
    const availableFees = parseFloat(totalFeesAvailable);

    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > availableFees) {
      setError(`Cannot withdraw more than ${totalFeesAvailable} sBTC`);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call bitpay-treasury.withdraw-fees(amount)
      console.log("Withdrawing fees:", {
        amount: withdrawAmount,
        amountInMicro: withdrawAmount * 1_000_000,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Fees withdrawn successfully!", {
        description: `${amount} sBTC has been transferred to your wallet`,
      });

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (err) {
      console.error("Error withdrawing fees:", err);
      setError("Failed to withdraw fees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    onClose();
  };

  const handleMaxClick = () => {
    setAmount(totalFeesAvailable);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-4 w-4 text-brand-pink" />
            Withdraw Collected Fees
          </DialogTitle>
          <DialogDescription className="text-xs">
            Withdraw accumulated cancellation fees from the treasury
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Available Fees Display */}
          <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Fees Available</p>
            <p className="text-2xl font-bold text-brand-pink">{totalFeesAvailable} sBTC</p>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs">Withdrawal Amount (sBTC)</Label>
            <div className="flex gap-1.5">
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                max={totalFeesAvailable}
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className={`h-8 text-xs ${error ? "border-red-500" : ""}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMaxClick}
                className="border-brand-pink text-brand-pink hover:bg-brand-pink/10 h-8 px-3 text-xs"
              >
                MAX
              </Button>
            </div>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </div>

          {/* Info Alert */}
          <Alert className="py-2">
            <CheckCircle className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-xs">
              <p className="font-medium mb-0.5">Withdrawal Process</p>
              <ol className="text-[11px] space-y-0 ml-3 list-decimal">
                <li>Fees transferred from treasury to your wallet</li>
                <li>Transaction recorded on-chain</li>
                <li>Balance updates after confirmation</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Warning for full withdrawal */}
          {amount === totalFeesAvailable && parseFloat(amount) > 0 && (
            <Alert className="border-yellow-500/50 bg-yellow-500/5 py-2">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <AlertDescription className="text-[11px] text-yellow-800">
                You are withdrawing all available fees. Treasury balance will be zero after this transaction.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="bg-brand-pink hover:bg-brand-pink/90 h-8 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-3 w-3 mr-1.5" />
                Withdraw Fees
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
