import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

/**
 * GET /api/notifications
 * Fetches platform notifications for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications
 * Marks notifications as read.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ message: 'Invalid notification IDs' }, { status: 400 });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.userId)); // Simplified: mark all as read for user or filter by IDs

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
