"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTurnkey, AuthState, ClientState } from "@turnkey/react-wallet-kit";
import { Wallet, Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TurnkeyLoginButton() {
  const router = useRouter();
  const turnkeyContext = useTurnkey();

  // Safely access Turnkey properties
  const handleLogin = turnkeyContext.handleLogin;
  const logout = (turnkeyContext as any).logout;
  const authState = turnkeyContext.authState;
  const clientState = turnkeyContext.clientState;
  const currentWallet = (turnkeyContext as any).currentWallet || (turnkeyContext as any).wallet;

  // Show loading state while client is initializing
  if (clientState === ClientState.Loading) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Show error state
  if (clientState === ClientState.Error) {
    return (
      <Button
        onClick={() => window.location.reload()}
        variant="destructive"
      >
        Error - Click to Reload
      </Button>
    );
  }

  // If authenticated and wallet exists, show wallet info
  if (authState === AuthState.Authenticated && currentWallet) {
    const stacksAccount = currentWallet.accounts?.find(
      (acc: any) => acc.curve === "CURVE_SECP256K1"
    );

    const address = stacksAccount?.address || currentWallet.accounts[0]?.address;
    const truncatedAddress = address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Unknown";

    const copyAddress = () => {
      if (address) {
        navigator.clipboard.writeText(address);
        toast.success("Address copied to clipboard");
      }
    };

    const viewExplorer = () => {
      if (address) {
        const networkType = process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
        const explorerUrl =
          networkType === "mainnet"
            ? `https://explorer.hiro.so/address/${address}?chain=mainnet`
            : `https://explorer.hiro.so/address/${address}?chain=testnet`;
        window.open(explorerUrl, "_blank");
      }
    };

    const handleLogout = async () => {
      await logout();
      toast.success("Logged out successfully");
      router.push("/");
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-600/20 hover:border-purple-600/40"
          >
            <Wallet className="h-4 w-4" />
            {truncatedAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Wallet</p>
              <p className="text-xs leading-none text-muted-foreground font-mono">
                {truncatedAddress}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewExplorer} className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View in Explorer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not authenticated - show connect button
  return (
    <Button
      onClick={() => handleLogin()}
      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
