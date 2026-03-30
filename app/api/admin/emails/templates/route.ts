import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { emailTemplates, adminActionsLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const list = await db.select().from(emailTemplates).orderBy(emailTemplates.templateName);
  return NextResponse.json(list);
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { id, data } = await request.json();
    await db.update(emailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(emailTemplates.id, id));

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: 'email_template_update',
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ message: 'Updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const data = await request.json();
    const [entry] = await db.insert(emailTemplates).values(data).returning();

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: 'email_template_create',
      targetId: entry?.id,
      metadata: data,
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
