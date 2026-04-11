import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { contactMethods, adminActionsLog } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

// [WHY] Prevents Vercel edge caching — admin changes reflect immediately
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const list = await db.select().from(contactMethods).orderBy(asc(contactMethods.displayOrder));
  return NextResponse.json(list);
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { id, data } = await request.json();
    await db.update(contactMethods).set({ ...data, updatedAt: new Date() }).where(eq(contactMethods.id, id));

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: 'contact_config_update',
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
    const [entry] = await db.insert(contactMethods).values(data).returning();

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: 'contact_config_create',
      targetId: entry?.id,
      metadata: data,
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    await db.delete(contactMethods).where(eq(contactMethods.id, id));

    await db.insert(adminActionsLog).values({
      adminId: session.userId,
      actionType: 'contact_config_delete',
      targetId: id,
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
