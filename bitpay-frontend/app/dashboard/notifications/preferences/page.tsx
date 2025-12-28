/**
 * Notification Preferences Page
 * Allow users to customize their notification settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Bell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NotificationPreferences } from '@/types/notification';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      setToastMessage({
        title: 'Error',
        description: 'Failed to load notification preferences',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setToastMessage({
          title: 'Success',
          description: 'Notification preferences saved successfully',
          type: 'success',
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setToastMessage({
        title: 'Error',
        description: 'Failed to save notification preferences',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  const updateInAppPreference = (
    key: keyof NotificationPreferences['inApp'],
    value: boolean
  ) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      inApp: {
        ...preferences.inApp,
        [key]: value,
      },
    });
  };

  const updateEmailPreference = (
    key: keyof NotificationPreferences['emailNotifications'],
    value: boolean
  ) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      emailNotifications: {
        ...preferences.emailNotifications,
        [key]: value,
      },
    });
  };

  if (loading || !preferences) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Notification Preferences
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize how you receive notifications
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Configure your email address and verify it to receive email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={preferences.emailAddress || ''}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailAddress: e.target.value })
                }
                placeholder="your@email.com"
              />
              {preferences.emailVerified ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  ✓ Verified
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Email not verified. Check your inbox for a verification link.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Choose which events trigger in-app notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-streams" className="font-medium">
                  Stream Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about payment streams (created, withdrawn, cancelled)
                </p>
              </div>
              <Switch
                id="inapp-streams"
                checked={preferences.inApp.streams}
                onCheckedChange={(value) => updateInAppPreference('streams', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-marketplace" className="font-medium">
                  Marketplace Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about purchases and sales
                </p>
              </div>
              <Switch
                id="inapp-marketplace"
                checked={preferences.inApp.marketplace}
                onCheckedChange={(value) =>
                  updateInAppPreference('marketplace', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-treasury" className="font-medium">
                  Treasury Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about multi-sig treasury proposals and approvals
                </p>
              </div>
              <Switch
                id="inapp-treasury"
                checked={preferences.inApp.treasury}
                onCheckedChange={(value) => updateInAppPreference('treasury', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-security" className="font-medium">
                  Security Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Critical security notifications (always recommended)
                </p>
              </div>
              <Switch
                id="inapp-security"
                checked={preferences.inApp.security}
                onCheckedChange={(value) => updateInAppPreference('security', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp-system" className="font-medium">
                  System Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Platform updates and maintenance notifications
                </p>
              </div>
              <Switch
                id="inapp-system"
                checked={preferences.inApp.system}
                onCheckedChange={(value) => updateInAppPreference('system', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which events trigger email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-streams" className="font-medium">
                  Stream Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Email about payment streams
                </p>
              </div>
              <Switch
                id="email-streams"
                checked={preferences.emailNotifications.streams}
                onCheckedChange={(value) =>
                  updateEmailPreference('streams', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-marketplace" className="font-medium">
                  Marketplace Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Email about purchases and sales
                </p>
              </div>
              <Switch
                id="email-marketplace"
                checked={preferences.emailNotifications.marketplace}
                onCheckedChange={(value) =>
                  updateEmailPreference('marketplace', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-treasury" className="font-medium">
                  Treasury Events
                </Label>
                <p className="text-sm text-muted-foreground">
                  Email about treasury proposals
                </p>
              </div>
              <Switch
                id="email-treasury"
                checked={preferences.emailNotifications.treasury}
                onCheckedChange={(value) =>
                  updateEmailPreference('treasury', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-security" className="font-medium">
                  Security Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Critical security emails (always recommended)
                </p>
              </div>
              <Switch
                id="email-security"
                checked={preferences.emailNotifications.security}
                onCheckedChange={(value) =>
                  updateEmailPreference('security', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-system" className="font-medium">
                  System Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Platform updates via email
                </p>
              </div>
              <Switch
                id="email-system"
                checked={preferences.emailNotifications.system}
                onCheckedChange={(value) =>
                  updateEmailPreference('system', value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-digest" className="font-medium">
                  Daily Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of all notifications
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={preferences.emailNotifications.digest}
                onCheckedChange={(value) =>
                  updateEmailPreference('digest', value)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
