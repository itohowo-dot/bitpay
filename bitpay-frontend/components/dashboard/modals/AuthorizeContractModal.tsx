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
import { Loader2, Shield, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

interface AuthorizeContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuthorizedContracts: string[];
  onSuccess?: () => void;
}

export function AuthorizeContractModal({
  isOpen,
  onClose,
  currentAuthorizedContracts,
  onSuccess,
}: AuthorizeContractModalProps) {
  const [contractAddress, setContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthorize = async () => {
    setError("");

    // Validate contract address format (Stacks principal format)
    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    // Check if it's a valid Stacks contract address format
    if (!contractAddress.includes(".")) {
      setError("Invalid contract address format. Must be: address.contract-name");
      return;
    }

    const [address, contractName] = contractAddress.split(".");

    if (!address.startsWith("SP") && !address.startsWith("ST")) {
      setError("Invalid Stacks address. Must start with SP or ST");
      return;
    }

    if (!contractName || contractName.length === 0) {
      setError("Contract name is required");
      return;
    }

    // Check if already authorized
    if (currentAuthorizedContracts.includes(contractAddress)) {
      setError("This contract is already authorized");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call bitpay-access-control.authorize-contract(contract-address)
      console.log("Authorizing contract:", contractAddress);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Contract authorized successfully!", {
        description: `${contractName} can now access vault functions`,
      });

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (err) {
      console.error("Error authorizing contract:", err);
      setError("Failed to authorize contract. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setContractAddress("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-4 w-4 text-brand-teal" />
            Authorize Contract
          </DialogTitle>
          <DialogDescription className="text-xs">
            Grant vault access permissions to a contract
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-2 overflow-y-auto flex-1">
          {/* Currently Authorized Contracts */}
          <div className="bg-muted/50 border rounded-lg p-2.5">
            <p className="text-xs font-medium mb-1">Currently Authorized</p>
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {currentAuthorizedContracts.length > 0 ? (
                currentAuthorizedContracts.map((contract) => (
                  <div
                    key={contract}
                    className="flex items-center gap-1.5 text-[10px] font-mono bg-background p-1 rounded"
                  >
                    <Shield className="h-2.5 w-2.5 text-brand-teal flex-shrink-0" />
                    <span className="text-muted-foreground truncate">{contract}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground">No contracts authorized yet</p>
              )}
            </div>
          </div>

          {/* Contract Address Input */}
          <div className="space-y-1">
            <Label htmlFor="contract-address" className="text-xs">Contract Address</Label>
            <Input
              id="contract-address"
              type="text"
              placeholder="SP...ABC.contract-name"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value);
                setError("");
              }}
              className={`font-mono text-xs h-8 ${error ? "border-red-500" : ""}`}
            />
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            <p className="text-[10px] text-muted-foreground">
              Format: address.contract-name
            </p>
          </div>

          {/* Warning Alert */}
          <Alert className="border-yellow-500/50 bg-yellow-500/5 py-1.5">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Security Warning</p>
              <p className="mt-0.5 text-[11px]">
                Authorized contracts can call <code className="text-[10px]">transfer-from-vault</code>. Only authorize trusted contracts.
              </p>
            </AlertDescription>
          </Alert>

          {/* Info Alert */}
          <Alert className="py-1.5">
            <Info className="h-3 w-3 text-brand-teal" />
            <AlertDescription className="text-xs">
              <p className="font-medium">Process</p>
              <ol className="text-[11px] space-y-0 ml-3 list-decimal mt-0.5">
                <li>Added to access control whitelist</li>
                <li>Can immediately call vault functions</li>
                <li>Revocable anytime from Access Control</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleAuthorize}
            disabled={isLoading || !contractAddress}
            className="bg-brand-teal hover:bg-brand-teal/90 h-8 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1.5" />
                Authorize Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
