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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { useProposeWithdrawal } from "@/hooks/use-multisig-treasury";
import { toast } from "sonner";

interface ProposeWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryBalance: string; // in display format (sBTC)
  onSuccess?: () => void;
}

export function ProposeWithdrawalModal({
  isOpen,
  onClose,
  treasuryBalance,
  onSuccess,
}: ProposeWithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");

  const { propose, isLoading } = useProposeWithdrawal();

  const maxAmount = parseFloat(treasuryBalance) || 0;
  const dailyLimit = 100; // 100 sBTC

  const handlePropose = async () => {
    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (amountNum > maxAmount) {
      toast.error("Amount exceeds treasury balance");
      return;
    }

    if (amountNum > dailyLimit) {
      toast.error(`Amount exceeds daily limit of ${dailyLimit} sBTC`);
      return;
    }

    if (!recipient || !recipient.startsWith("SP") || recipient.length < 20) {
      toast.error("Invalid recipient address");
      return;
    }

    if (description.length === 0 || description.length > 256) {
      toast.error("Description must be between 1-256 characters");
      return;
    }

    // Convert to micro-units
    const amountMicro = BigInt(Math.floor(amountNum * 1_000_000));

    const txId = await propose(amountMicro, recipient, description);

    if (txId) {
      toast.success("Proposal Created!", {
        description: "Multi-sig approval process initiated",
      });
      setAmount("");
      setRecipient("");
      setDescription("");
      onClose();
      onSuccess?.();
    }
  };

  const handleSetMax = () => {
    const maxWithdrawable = Math.min(maxAmount, dailyLimit);
    setAmount(maxWithdrawable.toFixed(6));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-4 w-4 text-brand-pink" />
            Propose Multi-Sig Withdrawal
          </DialogTitle>
          <DialogDescription className="text-xs">
            3-of-5 multi-sig approval • 24-hour timelock
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 overflow-y-auto flex-1 py-1">
          {/* Multi-Sig Info - Compact */}
          <Alert className="border-brand-teal/30 bg-brand-teal/5 py-1.5">
            <Shield className="h-3 w-3 text-brand-teal" />
            <AlertDescription>
              <p className="font-medium text-brand-teal text-[11px] mb-0.5">Process:</p>
              <ol className="text-[10px] space-y-0 list-decimal list-inside">
                <li>You propose (auto-approved as 1st)</li>
                <li>2 more admins approve (3 total)</li>
                <li>Wait 24h timelock (144 blocks)</li>
                <li>Any admin executes</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-xs">Withdrawal Amount (sBTC)</Label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-xs h-8"
                  disabled={isLoading}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSetMax}
                disabled={isLoading}
                className="text-xs px-2.5 h-8"
              >
                Max
              </Button>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Available: {treasuryBalance} sBTC</span>
              <span>Daily Limit: {dailyLimit} sBTC</span>
            </div>
          </div>

          {/* Recipient Input */}
          <div className="space-y-1">
            <Label htmlFor="recipient" className="text-xs">Recipient Address</Label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                id="recipient"
                placeholder="SP..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="pl-7 font-mono text-[11px] h-8"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <div className="relative">
              <FileText className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Textarea
                id="description"
                placeholder="Reason for withdrawal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-7 min-h-[60px] text-[11px]"
                maxLength={256}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Required for audit trail</span>
              <span>{description.length}/256</span>
            </div>
          </div>

          {/* Summary - Compact */}
          {amount && recipient && description && (
            <Alert className="py-1.5">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <AlertDescription>
                <p className="font-medium text-[11px] mb-0.5">Summary:</p>
                <div className="text-[10px] space-y-0">
                  <p>• Amount: <span className="font-bold text-brand-pink">{amount} sBTC</span></p>
                  <p>• To: <span className="font-mono">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span></p>
                  <p>• Approvals: <span className="font-bold">3</span> (incl. yours)</p>
                  <p>• Timelock: <span className="font-bold">24h</span> after 3rd</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning - Compact */}
          <Alert className="border-yellow-500/50 bg-yellow-500/5 py-1.5">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <AlertDescription className="text-[10px]">
              <p className="font-medium text-yellow-600 mb-0.5">Important:</p>
              <ul className="list-disc list-inside space-y-0 text-muted-foreground">
                <li>Auto-approved by you (1/3)</li>
                <li>Expires after 7 days</li>
                <li>Limit: 100 sBTC/24h</li>
                <li>Irreversible when executed</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-shrink-0 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePropose}
            disabled={isLoading || !amount || !recipient || !description}
            className="bg-brand-pink hover:bg-brand-pink/90 text-white h-8 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                Creating...
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1.5" />
                Create
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
