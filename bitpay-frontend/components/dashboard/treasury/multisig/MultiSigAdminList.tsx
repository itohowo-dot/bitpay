"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  UserPlus,
  UserMinus,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { useState } from "react";

interface Admin {
  address: string;
  isActive: boolean;
}

interface MultiSigAdminListProps {
  admins: Admin[];
  totalSlots: number;
  requiredSignatures: number;
  currentUserAddress: string | null;
  isCurrentUserAdmin: boolean;
  onProposeAdd?: () => void;
  onProposeRemove?: (address: string) => void;
}

export function MultiSigAdminList({
  admins,
  totalSlots,
  requiredSignatures,
  currentUserAddress,
  isCurrentUserAdmin,
  onProposeAdd,
  onProposeRemove,
}: MultiSigAdminListProps) {
  const activeAdmins = admins.filter(a => a.isActive);
  const activeCount = activeAdmins.length;
  const hasEmptySlots = activeCount < totalSlots;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-teal" />
              Multi-Sig Administrators
            </CardTitle>
            <CardDescription>
              {activeCount}/{totalSlots} slots filled • {requiredSignatures} approvals required
            </CardDescription>
          </div>
          {isCurrentUserAdmin && hasEmptySlots && onProposeAdd && (
            <Button
              onClick={onProposeAdd}
              size="sm"
              className="bg-brand-teal hover:bg-brand-teal/90 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Propose Add Admin
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Config Info */}
        <Alert className="border-brand-teal/30 bg-brand-teal/5">
          <Shield className="h-4 w-4 text-brand-teal" />
          <AlertDescription>
            <p className="text-sm">
              <strong>{requiredSignatures}-of-{totalSlots}</strong> multi-signature configuration
              with <strong>24-hour timelock</strong> and <strong>100 sBTC daily limit</strong>.
            </p>
          </AlertDescription>
        </Alert>

        {/* Admin List */}
        <div className="space-y-3">
          {admins.map((admin, index) => {
            const isCurrentUser = currentUserAddress?.toLowerCase() === admin.address.toLowerCase();
            const isEmpty = !admin.isActive;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isEmpty
                    ? 'border-dashed border-muted'
                    : isCurrentUser
                    ? 'border-brand-teal bg-brand-teal/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isEmpty
                      ? 'bg-muted'
                      : isCurrentUser
                      ? 'bg-brand-teal text-white'
                      : 'bg-brand-pink text-white'
                  }`}>
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div>
                    {isEmpty ? (
                      <p className="text-sm text-muted-foreground italic">Empty Slot</p>
                    ) : (
                      <>
                        <p className="font-mono text-sm">
                          {admin.address.slice(0, 10)}...{admin.address.slice(-8)}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <CheckCircle className="h-3 w-3 mr-1 text-brand-teal" />
                            You
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!isEmpty && isCurrentUserAdmin && !isCurrentUser && onProposeRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProposeRemove(admin.address)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty Slots Info */}
        {hasEmptySlots && (
          <Alert className="border-yellow-500/30 bg-yellow-500/5">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              <p className="font-medium text-yellow-600 mb-1">
                {totalSlots - activeCount} empty slot{totalSlots - activeCount !== 1 ? 's' : ''} available
              </p>
              <p className="text-xs text-muted-foreground">
                Adding more admins increases decentralization and security. Admins can propose
                adding new members through multi-sig governance.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Management Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Adding or removing admins requires a multi-sig proposal
            with {requiredSignatures} approvals from existing admins. Changes take effect
            immediately after execution (no timelock for admin management).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
