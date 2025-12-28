/**
 * Notification Dropdown Component
 * Displays recent notifications in a dropdown
 */

'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Notification } from '@/types/notification';

interface NotificationDropdownProps {
  onNotificationRead?: () => void;
  onMarkAllRead?: () => void;
}

export function NotificationDropdown({
  onNotificationRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=10');
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
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, status: 'read' as const } : n
          )
        );
        onNotificationRead?.();
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
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: 'read' as const }))
        );
        onMarkAllRead?.();
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

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={notifications.every((n) => n.status === 'read')}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Link href="/dashboard/notifications/preferences">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const notificationId = notification._id;
              if (!notificationId) return null;
              
              return (
                <div
                  key={notificationId}
                  className={`flex gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
                    notification.status === 'unread' ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => {
                    if (notification.status === 'unread') {
                      markAsRead(notificationId);
                    }
                  }}
                >
                {/* Unread indicator */}
                {notification.status === 'unread' && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <Badge
                      variant={getPriorityColor(notification.priority)}
                      className="text-xs"
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  {notification.actionUrl && (
                    <Link
                      href={notification.actionUrl}
                      className="inline-flex items-center text-xs text-primary hover:underline"
                    >
                      View details
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" className="w-full" size="sm">
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}
