// NEW FILE: Email center API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users, emailLogs } from '@/lib/db/schema';
import { EmailService } from '@/lib/services/email.service';
import { eq } from 'drizzle-orm';

// NEW: Send bulk email/newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, content, recipients, type = 'newsletter' } = body;

    let targetUsers = [];

    if (recipients === 'all') {
      // Send to all users
      targetUsers = await db.select().from(users);
    } else if (recipients === 'users') {
      // Send to regular users only
      targetUsers = await db.select().from(users).where(eq(users.role, 'user'));
    } else if (recipients === 'admins') {
      // Send to admins only
      targetUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    } else if (Array.isArray(recipients)) {
      // Send to specific user IDs
      targetUsers = await db.select().from(users).where(
        // Use IN clause for multiple IDs
        sql`${users.id} IN ${recipients}`
      );
    }

    const emailPromises = targetUsers.map(async (user) => {
      try {
        await EmailService.sendNewsletter(user.email, user.name || 'User', subject, content);
        
        // Log successful email
        await db.insert(emailLogs).values({
          id: crypto.randomUUID(),
          userId: user.id,
          type,
          subject,
          content,
          status: 'sent',
          sentAt: new Date(),
        });

        return { userId: user.id, status: 'sent' };
      } catch (error) {
        // Log failed email
        await db.insert(emailLogs).values({
          id: crypto.randomUUID(),
          userId: user.id,
          type,
          subject,
          content,
          status: 'failed',
          error: error.message,
          sentAt: new Date(),
        });

        return { userId: user.id, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      message: `Email sent to ${successful} recipients, ${failed} failed`,
      results,
      summary: { successful, failed, total: results.length }
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// NEW: Get email logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await db
      .select({
        id: emailLogs.id,
        userId: emailLogs.userId,
        type: emailLogs.type,
        subject: emailLogs.subject,
        status: emailLogs.status,
        sentAt: emailLogs.sentAt,
        error: emailLogs.error,
        userName: users.name,
        userEmail: users.email,
      })
      .from(emailLogs)
      .leftJoin(users, eq(emailLogs.userId, users.id))
      .orderBy(emailLogs.sentAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}