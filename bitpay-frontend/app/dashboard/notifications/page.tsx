/**
 * Notification Center Page
 * Full page view of all notifications with filtering
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Archive, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type { Notification, NotificationStatus } from '@/types/notification';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const status =
        activeTab === 'all' ? '' : `&status=${activeTab}`;
      const response = await fetch(`/api/notifications?limit=50${status}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, status: 'read' as const } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: 'read' as const }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    // Return emoji icons based on notification type
    switch (type) {
      case 'stream_created':
        return '🔵';
      case 'stream_withdrawal':
        return '💰';
      case 'stream_cancelled':
        return '❌';
      case 'purchase_completed':
        return '🛒';
      case 'sale_completed':
        return '💸';
      case 'withdrawal_proposal':
      case 'withdrawal_approved':
      case 'withdrawal_executed':
        return '🏦';
      case 'security_alert':
      case 'unauthorized_access':
        return '🚨';
      default:
        return '🔔';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your BitPay activity
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/notifications/preferences">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Preferences
            </Button>
          </Link>
          <Button
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.status === 'read')}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge variant="secondary" className="ml-2">
              {notifications.filter((n) => n.status === 'unread').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const notificationId = notification._id;
                if (!notificationId) return null;

                return (
                  <div
                    key={notificationId}
                    className={`border rounded-lg p-4 hover:bg-accent transition-colors ${
                      notification.status === 'unread'
                        ? 'bg-accent/50 border-primary/50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                          <Badge
                            variant={getPriorityColor(notification.priority)}
                          >
                            {notification.priority}
                          </Badge>
                        </div>

                        {/* Action */}
                        {notification.actionUrl && (
                          <Link href={notification.actionUrl}>
                            <Button variant="link" size="sm" className="p-0 h-auto">
                              {notification.actionText || 'View details'} →
                            </Button>
                          </Link>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </span>
                          {notification.emailSent && (
                            <span className="flex items-center gap-1">
                              ✉️ Email sent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {notification.status === 'unread' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notificationId)}
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
