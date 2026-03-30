import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { supportTickets, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all tickets for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, session.userId))
      .orderBy(desc(supportTickets.createdAt));

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { category, subject, description, priority = 'medium' } = body;

    if (!category || !subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Set SLA deadline based on priority (Enterprise SLA)
    const slaHours = priority === 'emergency' ? 4 : priority === 'high' ? 24 : 72;
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + slaHours);

    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        userId: session.userId,
        category,
        subject,
        description,
        priority,
        status: 'open',
        slaDeadline,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTicket);
  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
