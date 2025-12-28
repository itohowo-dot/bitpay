"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Loader2, AlertTriangle, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";

interface Stream {
  id: string;
  description: string;
  recipient: string;
  recipientName?: string;
  totalAmount: string;
  vestedAmount: string;
  withdrawnAmount?: string;
}

interface CancelStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream | null;
  onSuccess?: () => void;
}

export function CancelStreamModal({ isOpen, onClose, stream, onSuccess }: CancelStreamModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [understood, setUnderstood] = useState(false);

  if (!stream) return null;

  // Calculate amounts
  const totalAmount = parseFloat(stream.totalAmount);
  const vestedAmount = parseFloat(stream.vestedAmount);
  const unvestedAmount = totalAmount - vestedAmount;

  // 1% cancellation fee on unvested amount (100 BPS = 1%)
  const cancellationFee = unvestedAmount * 0.01;
  const unvestedAfterFee = unvestedAmount - cancellationFee;

  const isConfirmValid = confirmText.toLowerCase() === "cancel stream" && understood;

  const handleCancel = async () => {
    if (!isConfirmValid) {
      toast.error("Please confirm by typing 'cancel stream' and checking the box");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual contract call
      // Call bitpay-core.cancel-stream(stream-id)
      console.log("Cancelling stream:", stream.id);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Stream cancelled. ${unvestedAfterFee.toFixed(8)} sBTC returned to your wallet`);
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      toast.error("Failed to cancel stream");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmText("");
    setUnderstood(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <X className="h-4 w-4 text-red-500" />
            Cancel Stream
          </DialogTitle>
          <DialogDescription className="text-xs">
            Permanently cancel this payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Danger Warning */}
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <span className="font-medium">⚠️ This action cannot be undone.</span> The stream will be permanently cancelled.
            </AlertDescription>
          </Alert>

          {/* Stream Info */}
          <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
            <div>
              <p className="font-medium text-sm">{stream.description}</p>
              <p className="text-xs text-muted-foreground">
                To: {stream.recipientName || `${stream.recipient.slice(0, 8)}...${stream.recipient.slice(-8)}`}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{totalAmount.toFixed(8)} sBTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Vested:</span>
                <span className="font-medium text-brand-teal">{vestedAmount.toFixed(8)} sBTC</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unvested Amount:</span>
                <span className="font-medium">{unvestedAmount.toFixed(8)} sBTC</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Cancellation Fee (1%):</span>
                <span className="font-medium">-{cancellationFee.toFixed(8)} sBTC</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between font-bold">
                <span>You'll Receive:</span>
                <span className="text-brand-pink">{unvestedAfterFee.toFixed(8)} sBTC</span>
              </div>
            </div>
          </div>

          {/* Fee Info Alert - Compact */}
          <Alert className="py-2">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-xs">
              1% fee on unvested amount goes to treasury. Recipient keeps {vestedAmount.toFixed(8)} sBTC already vested.
            </AlertDescription>
          </Alert>

          {/* Confirmation */}
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs">Type "cancel stream" to confirm:</Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="cancel stream"
                disabled={isLoading}
                className="font-mono h-8 text-sm"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label htmlFor="understood" className="text-xs cursor-pointer leading-tight">
                I understand this action cannot be undone and accept the 1% fee
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 h-9 text-sm" disabled={isLoading}>
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Keep Stream
            </Button>
            <Button
              onClick={handleCancel}
              disabled={!isConfirmValid || isLoading}
              variant="destructive"
              className="flex-1 h-9 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1.5" />
                  Cancel Stream
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
