/**
 * POST /api/notifications/[id]/mark-read
 * Mark a notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';
import { markAsRead } from '@/lib/notifications/notification-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: notificationId } = await params;

    // Mark notification as read
    const success = await markAsRead(notificationId, userId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification not found or already read',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notification as read',
      },
      { status: 500 }
    );
  }
}
