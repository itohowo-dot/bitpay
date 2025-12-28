"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AuthorizeContractModal } from "./modals/AuthorizeContractModal";

interface AuthorizedContract {
  address: string;
  name: string;
  authorizedAt: string;
  isActive: boolean;
}

export function AccessControlPanel() {
  const [contracts, setContracts] = useState<AuthorizedContract[]>([
    {
      address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitpay-core",
      name: "bitpay-core",
      authorizedAt: "2025-01-15",
      isActive: true,
    },
    {
      address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitpay-treasury",
      name: "bitpay-treasury",
      authorizedAt: "2025-01-15",
      isActive: true,
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [revokingContract, setRevokingContract] = useState<string | null>(null);

  const handleAuthorizeSuccess = () => {
    // Refresh the contracts list
    // In a real app, this would refetch from the blockchain
    toast.success("Contract list will be refreshed");
  };

  const handleRevoke = async (contractAddress: string) => {
    setRevokingContract(contractAddress);

    try {
      // TODO: Implement actual contract call
      // Call bitpay-access-control.revoke-contract(contract-address)
      console.log("Revoking contract:", contractAddress);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setContracts(
        contracts.map((c) =>
          c.address === contractAddress ? { ...c, isActive: false } : c
        )
      );
      toast.success("Contract access revoked");
    } catch (error) {
      toast.error("Failed to revoke contract access");
    } finally {
      setRevokingContract(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-teal" />
            Access Control
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage which contracts can access the vault
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-brand-teal hover:bg-brand-teal/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Authorize Contract
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4 text-brand-teal" />
        <AlertDescription>
          <p className="font-medium mb-1">Vault Protection</p>
          <p className="text-sm">
            Only authorized contracts can call <code className="bg-muted px-1 rounded text-xs">transfer-from-vault</code>.
            This prevents unauthorized drainage of treasury funds. Only add contracts you trust.
          </p>
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">
              {contracts.filter((c) => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revoked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {contracts.filter((c) => !c.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authorized Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Authorized Contracts</CardTitle>
          <CardDescription>
            Contracts with permission to access the vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No contracts authorized yet</p>
                <p className="text-sm">Add contracts to grant vault access</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div
                  key={contract.address}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-brand-teal/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {contract.isActive ? (
                      <div className="p-2 bg-brand-teal/10 rounded-full">
                        <Unlock className="h-5 w-5 text-brand-teal" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-500/10 rounded-full">
                        <Lock className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{contract.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {contract.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Authorized: {contract.authorizedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={contract.isActive ? "default" : "secondary"}
                      className={
                        contract.isActive
                          ? "bg-brand-teal hover:bg-brand-teal/90"
                          : ""
                      }
                    >
                      {contract.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Revoked
                        </>
                      )}
                    </Badge>

                    {contract.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(contract.address)}
                        disabled={revokingContract === contract.address}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        {revokingContract === contract.address ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Authorize Contract Modal */}
      <AuthorizeContractModal
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        currentAuthorizedContracts={contracts.map((c) => c.address)}
        onSuccess={handleAuthorizeSuccess}
      />
    </div>
  );
}
