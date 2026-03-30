import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { supportMessages, supportTickets } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all messages for a specific ticket
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify ticket ownership or admin status
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, params.id))
      .limit(1);

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, params.id))
      .orderBy(asc(supportMessages.createdAt));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Support messages fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST send a message in a ticket
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { body: messageBody, attachments } = body;

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    // Verify ticket existence and ownership
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, params.id))
      .limit(1);

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use transaction to ensure both message is created and ticket updatedAt is refreshed
    const [newMessage] = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(supportMessages)
        .values({
          ticketId: params.id,
          senderId: session.userId,
          body: messageBody,
          attachments,
          type: session.role === 'admin' ? (body.type || 'public') : 'public',
        })
        .returning();

      // Update ticket updatedAt and optionally status
      await tx
        .update(supportTickets)
        .set({ 
            updatedAt: new Date(),
            status: session.role === 'admin' ? 'in_progress' : 'open' 
        })
        .where(eq(supportTickets.id, params.id));

      return [msg];
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Support message creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
