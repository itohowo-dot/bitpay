/**
 * GET /api/notifications/unread-count
 * Get user's unread notification count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';
import { getUnreadCount } from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = payload.userId;

    // Get unread count
    const count = await getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch unread count',
      },
      { status: 500 }
    );
  }
}
