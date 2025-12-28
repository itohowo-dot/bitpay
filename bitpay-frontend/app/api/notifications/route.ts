/**
 * GET /api/notifications
 * Fetch user's notifications with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';
import {
  getUserNotifications,
  getUnreadCount,
} from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = payload.userId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status') as
      | 'unread'
      | 'read'
      | 'archived'
      | null;

    // Fetch notifications
    const notifications = await getUserNotifications(userId, {
      limit,
      skip,
      status: status || undefined,
    });

    // Get unread count
    const unreadCount = await getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}
