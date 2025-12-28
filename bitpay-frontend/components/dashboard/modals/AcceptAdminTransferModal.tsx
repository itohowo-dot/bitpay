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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

interface AcceptAdminTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: string;
  onSuccess?: () => void;
}

export function AcceptAdminTransferModal({
  isOpen,
  onClose,
  currentAdmin,
  onSuccess,
}: AcceptAdminTransferModalProps) {
  const [understood, setUnderstood] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!understood) {
      setError("Please confirm you understand the responsibilities");
      return;
    }

    setIsAccepting(true);
    setError("");

    try {
      // TODO: Implement actual contract call
      // Call bitpay-treasury.accept-admin-transfer()
      console.log("Accepting admin transfer");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Admin transfer accepted!", {
        description: "You are now the treasury admin",
      });

      onSuccess?.();
      onClose();
      setUnderstood(false);
    } catch (err: any) {
      setError(err.message || "Failed to accept admin transfer");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-4 w-4 text-brand-teal" />
            Accept Admin Transfer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete the admin transfer and take control of the treasury
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Current Admin Info */}
          <div className="p-2.5 border rounded-lg bg-muted/30">
            <Label className="text-[10px] text-muted-foreground">Transferring From</Label>
            <p className="font-mono text-xs mt-0.5">{currentAdmin}</p>
          </div>

          {/* Responsibilities Alert */}
          <Alert className="py-2">
            <Shield className="h-3 w-3 text-brand-teal" />
            <AlertDescription>
              <p className="font-medium mb-1 text-xs">Admin Responsibilities</p>
              <ul className="text-[11px] space-y-0 ml-3 list-disc">
                <li>Manage treasury funds and collected fees</li>
                <li>Authorize and revoke contract access to vault</li>
                <li>Withdraw collected cancellation fees</li>
                <li>Propose future admin transfers</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Warning */}
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <p className="font-medium">Important:</p>
              <p className="text-[11px]">By accepting, you will immediately become the treasury admin. Make sure you understand the responsibilities and have secure key management.</p>
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-2.5 border rounded-lg">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => {
                setUnderstood(checked as boolean);
                setError("");
              }}
              disabled={isAccepting}
              className="mt-0.5"
            />
            <div className="grid gap-0.5 leading-none">
              <Label
                htmlFor="understand"
                className="text-xs font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand the admin responsibilities
              </Label>
              <p className="text-[10px] text-muted-foreground">
                I have read and understand my duties as treasury admin
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAccepting}
            className="h-8 text-xs"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isAccepting || !understood}
            className="bg-brand-teal hover:bg-brand-teal/90 text-white h-8 text-xs"
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-1.5 h-3 w-3" />
                Accept Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
