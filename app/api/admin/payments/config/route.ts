import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { paymentMethods, paymentWallets, adminActionsLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

// [WHY] Prevents Vercel edge caching — admin changes reflect immediately
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const methods = await db.select().from(paymentMethods).orderBy(paymentMethods.displayPriority);
  const wallets = await db.select().from(paymentWallets).orderBy(paymentWallets.symbol);

  return NextResponse.json({ methods, wallets });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { type, id, data } = await request.json();

    if (type === 'method') {
      await db.update(paymentMethods).set({ ...data, updatedAt: new Date() }).where(eq(paymentMethods.id, id));
    } else if (type === 'wallet') {
      await db.update(paymentWallets).set({ ...data, updatedAt: new Date() }).where(eq(paymentWallets.id, id));
    }

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: `payment_config_update_${type}`,
      targetId: id,
      metadata: data,
    });

    return NextResponse.json({ message: 'Configuration updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { type, data } = await request.json();

    if (type === 'wallet') {
      await db.insert(paymentWallets).values({ ...data });
    } else if (type === 'method') {
       await db.insert(paymentMethods).values({ ...data });
    }

    await db.insert(adminActionsLog).values({
      adminId,
      actionType: `payment_config_create_${type}`,
      metadata: data,
    });

    return NextResponse.json({ message: 'Created successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { type, id } = await request.json();

    if (type === 'wallet') {
      await db.delete(paymentWallets).where(eq(paymentWallets.id, id));
    } else if (type === 'method') {
      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    }

    await db.insert(adminActionsLog).values({
      adminId: session.userId,
      actionType: `payment_config_delete_${type}`,
      targetId: id,
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
