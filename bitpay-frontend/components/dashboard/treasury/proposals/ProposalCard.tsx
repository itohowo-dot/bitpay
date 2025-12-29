"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import { microToDisplay } from "@/lib/contracts/config";
import { WithdrawalProposal } from "@/hooks/use-multisig-treasury";
import { useState } from "react";

interface ProposalCardProps {
  proposal: WithdrawalProposal;
  currentBlock: number | null;
  userAddress: string | null;
  isUserAdmin: boolean;
  onApprove: (proposalId: number) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
  isApproving?: boolean;
  isExecuting?: boolean;
}

export function ProposalCard({
  proposal,
  currentBlock,
  userAddress,
  isUserAdmin,
  onApprove,
  onExecute,
  isApproving = false,
  isExecuting = false,
}: ProposalCardProps) {
  const [localApproving, setLocalApproving] = useState(false);
  const [localExecuting, setLocalExecuting] = useState(false);

  // Calculate status
  const approvalCount = proposal.approvals.length;
  const requiredApprovals = 3;
  const hasEnoughApprovals = approvalCount >= requiredApprovals;

  const TIMELOCK_BLOCKS = 144; // 24 hours
  const timelockBlock = proposal.proposedAt + TIMELOCK_BLOCKS;
  const timelockElapsed = currentBlock ? currentBlock >= timelockBlock : false;
  const blocksUntilTimelock = currentBlock ? Math.max(0, timelockBlock - currentBlock) : 0;

  const isExpired = currentBlock ? currentBlock >= proposal.expiresAt : false;
  const blocksUntilExpiry = currentBlock ? Math.max(0, proposal.expiresAt - currentBlock) : 0;

  const userHasApproved = userAddress
    ? proposal.approvals.some(addr => addr.toLowerCase() === userAddress.toLowerCase())
    : false;

  const canApprove = isUserAdmin && !userHasApproved && !proposal.executed && !isExpired;
  const canExecute = isUserAdmin && hasEnoughApprovals && timelockElapsed && !proposal.executed && !isExpired;

  // Status badge
  const getStatusBadge = () => {
    if (proposal.executed) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Executed
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (canExecute) {
      return (
        <Badge className="bg-brand-teal text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to Execute
        </Badge>
      );
    }
    if (hasEnoughApprovals && !timelockElapsed) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Timelock Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pending Approvals
      </Badge>
    );
  };

  // Progress percentage
  const approvalProgress = (approvalCount / requiredApprovals) * 100;

  // Format block time (rough estimate: 10 min per block)
  const formatBlockTime = (blocks: number): string => {
    if (blocks === 0) return "Now";
    const hours = Math.floor((blocks * 10) / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return `${blocks * 10}min`;
  };

  const handleApprove = async () => {
    setLocalApproving(true);
    try {
      await onApprove(proposal.id);
    } finally {
      setLocalApproving(false);
    }
  };

  const handleExecute = async () => {
    setLocalExecuting(true);
    try {
      await onExecute(proposal.id);
    } finally {
      setLocalExecuting(false);
    }
  };

  return (
    <Card className={`overflow-hidden ${proposal.executed ? 'opacity-60' : ''} ${isExpired ? 'border-red-300' : ''}`}>
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">Proposal #{proposal.id}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3" />
                <span>Proposed by: {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-4)}</span>
              </div>
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-pink">
              {microToDisplay(proposal.amount)} sBTC
            </p>
            <p className="text-xs text-muted-foreground">Withdrawal Amount</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Description */}
        {proposal.description && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">{proposal.description}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Recipient */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Recipient</span>
          <span className="font-mono text-sm">{proposal.recipient.slice(0, 10)}...{proposal.recipient.slice(-8)}</span>
        </div>

        {/* Approval Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Approvals</span>
            <span className="font-medium">
              {approvalCount}/{requiredApprovals} required
            </span>
          </div>
          <Progress value={approvalProgress} className="h-2" />

          {/* Approval list */}
          <div className="flex flex-wrap gap-1 mt-2">
            {proposal.approvals.map((approver, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {approver.slice(0, 6)}...{approver.slice(-4)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Timelock Status */}
        {hasEnoughApprovals && !proposal.executed && !isExpired && (
          <Alert className={timelockElapsed ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
            <Clock className={`h-4 w-4 ${timelockElapsed ? "text-green-500" : "text-yellow-500"}`} />
            <AlertDescription>
              {timelockElapsed ? (
                <p className="text-sm font-medium text-green-600">
                  ✓ Timelock elapsed - Ready to execute
                </p>
              ) : (
                <div className="text-sm">
                  <p className="font-medium text-yellow-600 mb-1">
                    ⏱ Timelock active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Executable in {formatBlockTime(blocksUntilTimelock)} (~{blocksUntilTimelock} blocks)
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Expiry Warning */}
        {!proposal.executed && !isExpired && blocksUntilExpiry < 1008 && (
          <Alert className="border-orange-500/50 bg-orange-500/5">
            <Calendar className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-sm text-orange-600">
              Expires in {formatBlockTime(blocksUntilExpiry)} (~{blocksUntilExpiry} blocks)
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={localApproving || isApproving}
              className="flex-1 bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              {(localApproving || isApproving) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
          )}

          {canExecute && (
            <Button
              onClick={handleExecute}
              disabled={localExecuting || isExecuting}
              className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white"
            >
              {(localExecuting || isExecuting) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Execute Withdrawal
            </Button>
          )}

          {userHasApproved && !proposal.executed && (
            <Badge variant="outline" className="py-2 px-4">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              You've Approved
            </Badge>
          )}
        </div>

        {/* Block Info */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
          <div>
            <span className="block">Proposed At:</span>
            <span className="font-mono">Block {proposal.proposedAt}</span>
          </div>
          <div>
            <span className="block">Expires At:</span>
            <span className="font-mono">Block {proposal.expiresAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
