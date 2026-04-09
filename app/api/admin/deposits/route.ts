// [WHY] Admin deposits API — fetches all deposits with user info for the admin management page
// [WHAT] GET returns all deposits joined with user data, supports status filtering

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { deposits, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // [WHY] Join deposits with users to get user names and emails for admin view
    let query = db
      .select({
        id: deposits.id,
        userId: deposits.userId,
        applicationId: deposits.applicationId,
        amount: deposits.amount,
        paymentMethod: deposits.paymentMethod,
        receiptUrl: deposits.receiptUrl,
        status: deposits.status,
        expiresAt: deposits.expiresAt,
        adminNotes: deposits.adminNotes,
        processedBy: deposits.processedBy,
        processedAt: deposits.processedAt,
        createdAt: deposits.createdAt,
        updatedAt: deposits.updatedAt,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userEmail: users.email,
      })
      .from(deposits)
      .leftJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));

    const allDeposits = await query;

    // [WHY] Apply status filter in JS since drizzle dynamic where chaining is complex
    const filtered = statusFilter && statusFilter !== 'all'
      ? allDeposits.filter((d: any) => d.status === statusFilter)
      : allDeposits;

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('Admin deposits fetch error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}
