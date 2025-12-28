/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';
import { clientPromise } from '@/lib/db';

export async function POST(request: NextRequest) {
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

    // Update all unread notifications to read
    const client = await clientPromise;
    const db = client.db();

    const result = await db
      .collection('notifications')
      .updateMany(
        { userId, status: 'unread' },
        { $set: { status: 'read', readAt: new Date() } }
      );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark all notifications as read',
      },
      { status: 500 }
    );
  }
}
