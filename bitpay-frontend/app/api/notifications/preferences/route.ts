/**
 * GET/POST /api/notifications/preferences
 * Manage user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';
import {
  getUserPreferences,
  updateUserPreferences,
} from '@/lib/notifications/notification-service';

/**
 * GET - Fetch user's notification preferences
 */
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

    // Get preferences
    const preferences = await getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Update user's notification preferences
 */
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

    // Parse request body
    const updates = await request.json();

    // Validate updates
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid preferences data',
        },
        { status: 400 }
      );
    }

    // Update preferences
    const preferences = await updateUserPreferences(userId, updates);

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification preferences',
      },
      { status: 500 }
    );
  }
}
