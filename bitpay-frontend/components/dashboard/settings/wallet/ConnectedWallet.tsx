"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Copy, Check, LogOut } from "lucide-react";

interface ConnectedWalletProps {
  userAddress: string | null;
  copiedAddress: boolean;
  onCopyAddress: () => void;
  onDisconnectWallet: () => void;
}

export function ConnectedWallet({
  userAddress,
  copiedAddress,
  onCopyAddress,
  onDisconnectWallet,
}: ConnectedWalletProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Wallet</CardTitle>
        <CardDescription>
          Manage your connected Stacks wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {userAddress ? (
          <>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Wallet</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {userAddress.slice(0, 8)}...{userAddress.slice(-8)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
              </div>
            </div>

            <div className="border-t pt-6" />

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open(`https://explorer.stacks.co/address/${userAddress}?chain=testnet`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={onCopyAddress}
              >
                {copiedAddress ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy Address
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={onDisconnectWallet}
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No wallet connected</p>
            <Button className="bg-brand-pink hover:bg-brand-pink/90">
              Connect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
