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
import { Loader2, UserCog, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

interface ProposeAdminTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: string;
  onSuccess?: () => void;
}

export function ProposeAdminTransferModal({
  isOpen,
  onClose,
  currentAdmin,
  onSuccess,
}: ProposeAdminTransferModalProps) {
  const [newAdmin, setNewAdmin] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [error, setError] = useState("");

  const handlePropose = async () => {
    if (!newAdmin.trim()) {
      setError("Please enter a valid Stacks address");
      return;
    }

    // Validate Stacks address format
    if (!newAdmin.startsWith("SP") && !newAdmin.startsWith("ST")) {
      setError("Invalid Stacks address format");
      return;
    }

    if (newAdmin.toLowerCase() === currentAdmin.toLowerCase()) {
      setError("New admin cannot be the same as current admin");
      return;
    }

    setIsProposing(true);
    setError("");

    try {
      // TODO: Implement actual contract call
      // Call bitpay-treasury.propose-admin-transfer(new-admin)
      console.log("Proposing admin transfer:", { currentAdmin, newAdmin });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Admin transfer proposed successfully", {
        description: `Waiting for ${newAdmin.slice(0, 8)}... to accept`,
      });

      onSuccess?.();
      onClose();
      setNewAdmin("");
    } catch (err: any) {
      setError(err.message || "Failed to propose admin transfer");
    } finally {
      setIsProposing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserCog className="h-4 w-4 text-brand-teal" />
            Propose Admin Transfer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Initiate a two-step admin transfer process for treasury security
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Current Admin Info */}
          <div className="p-2.5 border rounded-lg bg-muted/30">
            <Label className="text-[10px] text-muted-foreground">Current Admin</Label>
            <p className="font-mono text-xs mt-0.5">{currentAdmin}</p>
          </div>

          {/* Two-Step Process Info */}
          <Alert className="py-2">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription>
              <p className="font-medium mb-0.5 text-xs">Two-Step Transfer Process</p>
              <ol className="text-[11px] space-y-0 ml-3 list-decimal">
                <li>You propose the new admin address</li>
                <li>New admin must accept the transfer to complete it</li>
              </ol>
              <p className="text-[10px] text-muted-foreground mt-1">
                You can cancel the proposal before the new admin accepts.
              </p>
            </AlertDescription>
          </Alert>

          {/* New Admin Input */}
          <div className="space-y-1.5">
            <Label htmlFor="new-admin" className="text-xs">New Admin Address</Label>
            <Input
              id="new-admin"
              placeholder="SP... or ST..."
              value={newAdmin}
              onChange={(e) => {
                setNewAdmin(e.target.value);
                setError("");
              }}
              disabled={isProposing}
              className="font-mono text-xs h-8"
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the Stacks address of the new treasury admin
            </p>
          </div>

          {/* Warning */}
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <p className="font-medium">Important:</p>
              <p className="text-[11px]">Only propose admin transfer to addresses you control or trust. The new admin will have full control over the treasury.</p>
            </AlertDescription>
          </Alert>

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
            disabled={isProposing}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePropose}
            disabled={isProposing || !newAdmin.trim()}
            className="bg-brand-teal hover:bg-brand-teal/90 text-white h-8 text-xs"
          >
            {isProposing ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Proposing...
              </>
            ) : (
              <>
                <UserCog className="mr-1.5 h-3 w-3" />
                Propose Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
              