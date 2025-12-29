"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, AlertCircle } from "lucide-react";

interface TreasuryHeaderProps {
  isMultiSigAdmin: boolean;
  isLegacyAdmin: boolean;
}

export function TreasuryHeader({ isMultiSigAdmin, isLegacyAdmin }: TreasuryHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Treasury Management</h1>
        <p className="text-muted-foreground">
          Multi-sig fee collection and treasury administration
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isMultiSigAdmin ? (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-4 w-4 mr-1" />
            Multi-Sig Admin
          </Badge>
        ) : isLegacyAdmin ? (
          <Badge className="bg-blue-500 text-white">
            <Shield className="h-4 w-4 mr-1" />
            Legacy Admin
          </Badge>
        ) : (
          <Badge variant="secondary">
            <AlertCircle className="h-4 w-4 mr-1" />
            View Only
          </Badge>
        )}
      </div>
    </div>
  );
}
