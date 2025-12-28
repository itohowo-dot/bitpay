"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";

interface ProfileInfoProps {
  userAddress: string | null;
  copiedAddress: boolean;
  onCopyAddress: () => void;
}

export function ProfileInfo({ userAddress, copiedAddress, onCopyAddress }: ProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Your account details and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="wallet-address">Wallet Address</Label>
          <div className="flex gap-2">
            <Input
              id="wallet-address"
              value={userAddress || "Not connected"}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onCopyAddress}
              disabled={!userAddress}
            >
              {copiedAddress ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="display-name">Display Name (Optional)</Label>
          <Input
            id="display-name"
            placeholder="Enter your display name"
            defaultValue=""
          />
          <p className="text-sm text-muted-foreground">
            This name will be visible to stream recipients
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            defaultValue=""
          />
          <p className="text-sm text-muted-foreground">
            Receive notifications about your streams
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-brand-pink hover:bg-brand-pink/90">
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
