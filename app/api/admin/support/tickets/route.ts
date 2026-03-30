import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { supportTickets, users } from '@/lib/db/schema';
import { eq, desc, ne, and, asc } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all active and pending tickets for administration
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let filters = [];
    if (status && status !== 'all') {
      filters.push(eq(supportTickets.status, status));
    }
    if (priority && priority !== 'all') {
      filters.push(eq(supportTickets.priority, priority));
    }

    const tickets = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        slaDeadline: supportTickets.slaDeadline,
        createdAt: supportTickets.createdAt,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userEmail: users.email
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(and(...filters))
      .orderBy(asc(supportTickets.slaDeadline));

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Admin support tickets fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { sql } from 'drizzle-orm';
