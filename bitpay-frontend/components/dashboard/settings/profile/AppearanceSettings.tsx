"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

interface AppearanceSettingsProps {
  darkMode: boolean;
  onDarkModeChange: (checked: boolean) => void;
}

export function AppearanceSettings({ darkMode, onDarkModeChange }: AppearanceSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how BitPay looks for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <Label>Dark Mode</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Use dark theme across the application
            </p>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={onDarkModeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
