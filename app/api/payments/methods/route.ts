import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { paymentMethods, paymentWallets } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch enabled payment methods ordered by priority
    const methods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.enabled, true))
      .orderBy(asc(paymentMethods.displayPriority));

    // Fetch enabled payment wallets
    const wallets = await db
      .select()
      .from(paymentWallets)
      .where(eq(paymentWallets.enabled, true));

    return NextResponse.json({
      methods,
      wallets
    });
  } catch (error) {
    console.error('Public payments fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
