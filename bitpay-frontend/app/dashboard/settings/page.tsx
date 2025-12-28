"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/dashboard/settings/SettingsHeader";
import { ProfileInfo } from "@/components/dashboard/settings/profile/ProfileInfo";
import { AppearanceSettings } from "@/components/dashboard/settings/profile/AppearanceSettings";
import { ConnectedWallet } from "@/components/dashboard/settings/wallet/ConnectedWallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  Wallet,
  Bell,
  Shield,
  Mail,
  Key,
  Image as ImageIcon,
  UserCog,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import walletService from "@/lib/wallet/wallet-service";

export default function SettingsPage() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [streamNotifications, setStreamNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNFTMetadata, setShowNFTMetadata] = useState(true);
  const [nftGridSize, setNftGridSize] = useState("medium");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const address = await walletService.getCurrentAddress();
        setUserAddress(address);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleCopyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopiedAddress(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      toast.success("Wallet disconnected");
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to disconnect wallet");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SettingsHeader />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="nft-preferences" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">NFT</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileInfo
            userAddress={userAddress}
            copiedAddress={copiedAddress}
            onCopyAddress={handleCopyAddress}
          />

          <AppearanceSettings
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <ConnectedWallet
            userAddress={userAddress}
            copiedAddress={copiedAddress}
            onCopyAddress={handleCopyAddress}
            onDisconnectWallet={handleDisconnectWallet}
          />

          {/* Network Info */}
          <Card>
            <CardHeader>
              <CardTitle>Network Settings</CardTitle>
              <CardDescription>
                Current network configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-muted-foreground">Stacks Testnet</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Token</span>
                <span className="text-sm text-muted-foreground">sBTC (Testnet)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Manage how you receive updates via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label>Stream Updates</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notifications when streams are created or completed
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label>Withdrawal Alerts</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get notified when recipients withdraw from your streams
                  </p>
                </div>
                <Switch
                  checked={streamNotifications}
                  onCheckedChange={setStreamNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In-App Notifications</CardTitle>
              <CardDescription>
                Real-time notifications within BitPay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show browser notifications for important updates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for stream events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Protect your account and transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <Label>Transaction Confirmation</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Require wallet confirmation for all transactions
                  </p>
                </div>
                <Switch defaultChecked disabled />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Automatically disconnect after period of inactivity
                </p>
                <select className="w-full px-3 py-2 border rounded-md bg-background">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-red-600 dark:text-red-400">Danger Zone</Label>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that affect your account
                </p>
                <Button variant="destructive" className="w-full mt-4">
                  Clear All Stream History
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <li>• Never share your private keys or seed phrase</li>
                <li>• Always verify recipient addresses before creating streams</li>
                <li>• Use a hardware wallet for large amounts</li>
                <li>• Keep your wallet software up to date</li>
                <li>• Enable all available security features in your wallet</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Preferences Tab */}
        <TabsContent value="nft-preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                NFT Display Settings
              </CardTitle>
              <CardDescription>
                Customize how your stream NFTs are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show NFT Metadata</Label>
                  <p className="text-sm text-muted-foreground">
                    Display token ID, owner, and other details on NFT cards
                  </p>
                </div>
                <Switch
                  checked={showNFTMetadata}
                  onCheckedChange={setShowNFTMetadata}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Grid Size</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose how many NFTs to display per row
                </p>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={nftGridSize}
                  onChange={(e) => setNftGridSize(e.target.value)}
                >
                  <option value="small">Small (4 columns)</option>
                  <option value="medium">Medium (3 columns)</option>
                  <option value="large">Large (2 columns)</option>
                </select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-refresh NFTs</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically update NFT status when streams change
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Transfer History</Label>
                  <p className="text-sm text-muted-foreground">
                    Display obligation NFT transfer history on detail page
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-teal/20 bg-brand-teal/5">
            <CardHeader>
              <CardTitle className="text-brand-teal">Dual NFT System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-brand-teal mt-0.5" />
                <div>
                  <p className="font-medium">Recipient NFTs (Soul-bound)</p>
                  <p className="text-muted-foreground">Non-transferable proof of payment receipt</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-brand-pink mt-0.5" />
                <div>
                  <p className="font-medium">Obligation NFTs (Transferable)</p>
                  <p className="text-muted-foreground">Can be transferred for invoice factoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Treasury Administration
                </CardTitle>
                <CardDescription>
                  Manage treasury settings and protocol parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Admin Status</p>
                    <p className="text-xs text-muted-foreground">
                      You have full treasury admin permissions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-pink animate-pulse" />
                    <span className="text-sm text-brand-pink">Admin</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Quick Actions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = '/dashboard/treasury'}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Manage Treasury
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.location.href = '/dashboard/treasury?tab=access-control'}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Access Control
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Protocol Settings</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Current Cancellation Fee</span>
                      <span className="font-medium">1% (100 BPS)</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Treasury Balance</span>
                      <span className="font-medium">0.00 sBTC</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Total Fees Collected</span>
                      <span className="font-medium">0.00 sBTC</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Admin Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li>• Manage treasury fee parameters responsibly</li>
                  <li>• Only authorize trusted contracts for vault access</li>
                  <li>• Regularly review access control permissions</li>
                  <li>• Use two-step admin transfer for security</li>
                  <li>• Monitor fee collection and withdrawals</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
