"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Bitcoin, 
  Calendar, 
  Clock, 
  User, 
  ArrowUpRight, 
  Pause, 
  Play, 
  X,
  Copy,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Stream {
  id: string;
  recipient: string;
  recipientName?: string;
  totalAmount: string;
  vestedAmount: string;
  withdrawnAmount: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  progress: number;
}

interface StreamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stream: Stream | null;
  onAction?: (actionType: 'withdraw' | 'pause' | 'resume' | 'cancel') => void;
}

export function StreamDetailsModal({ 
  isOpen, 
  onClose, 
  stream,
  onAction
}: StreamDetailsModalProps) {
  if (!stream) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 12)}...${address.slice(-12)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(stream.recipient);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-brand-teal text-white";
      case "completed": return "bg-green-500 text-white";
      case "paused": return "bg-yellow-500 text-white";
      case "cancelled": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const availableAmount = parseFloat(stream.vestedAmount) - parseFloat(stream.withdrawnAmount);
  const remainingAmount = parseFloat(stream.totalAmount) - parseFloat(stream.vestedAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bitcoin className="h-4 w-4 text-brand-pink" />
            Stream Details
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete information about this payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stream Overview */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold">{stream.description}</h3>
                <p className="text-xs text-muted-foreground">Stream ID: {stream.id}</p>
              </div>
              <Badge className={getStatusColor(stream.status)}>
                {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{stream.progress}% complete</span>
              </div>
              <Progress value={stream.progress} className="h-1.5" />
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Recipient Information
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {stream.recipientName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{stream.recipientName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Address:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px]">{formatAddress(stream.recipient)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-5 w-5 p-0"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    asChild
                  >
                    <a 
                      href={`https://explorer.stacks.co/address/${stream.recipient}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Financial Details */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1.5">
              <Bitcoin className="h-3 w-3" />
              Financial Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">{stream.totalAmount} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vested Amount:</span>
                  <span className="font-semibold text-brand-pink">{stream.vestedAmount} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawn:</span>
                  <span className="font-semibold">{stream.withdrawnAmount} sBTC</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-semibold text-brand-teal">{availableAmount.toFixed(8)} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-semibold">{remainingAmount.toFixed(8)} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="font-semibold">
                    {(parseFloat(stream.totalAmount) / ((new Date(stream.endDate).getTime() - new Date(stream.startDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(8)} sBTC/day
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Timeline */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Timeline
            </h4>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium">{formatDate(stream.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium">{formatDate(stream.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {Math.ceil((new Date(stream.endDate).getTime() - new Date(stream.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {stream.status === "active" && availableAmount > 0 && (
              <Button 
                onClick={() => onAction?.('withdraw')}
                size="sm"
                className="bg-brand-teal hover:bg-brand-teal/90 text-white h-8 text-xs"
              >
                <ArrowUpRight className="h-3 w-3 mr-1.5" />
                Withdraw ({availableAmount.toFixed(4)} sBTC)
              </Button>
            )}
            
            {stream.status === "active" && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onAction?.('pause')}
                className="h-8 text-xs"
              >
                <Pause className="h-3 w-3 mr-1.5" />
                Pause Stream
              </Button>
            )}
            
            {stream.status === "paused" && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onAction?.('resume')}
                className="h-8 text-xs"
              >
                <Play className="h-3 w-3 mr-1.5" />
                Resume Stream
              </Button>
            )}
            
            {(stream.status === "active" || stream.status === "paused") && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onAction?.('cancel')}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1.5" />
                Cancel Stream
              </Button>
            )}
            
            <div className="flex-1" />
            
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}