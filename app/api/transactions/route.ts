// [WHY] Unified transactions API that merges payment deposits and withdrawal requests
// [WHAT] Returns a combined, sorted list of all financial transactions for a user

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { deposits, withdrawals, paymentTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // [WHY] Fetch all three transaction types in parallel for efficiency
    const [userDeposits, userWithdrawals, userPayments] = await Promise.all([
      db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt)),
      db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt)),
      db.select().from(paymentTransactions).where(eq(paymentTransactions.userId, userId)).orderBy(desc(paymentTransactions.createdAt)),
    ]);

    // [WHAT] Normalize all transaction types into a unified shape for the frontend
    const unified = [
      ...userDeposits.map(d => ({
        id: d.id,
        type: 'deposit' as const,
        // [WHY] Use descriptive reference IDs to help users identify transactions
        referenceId: `DEP-${d.id.slice(0, 8)}`,
        amount: Number(d.amount),
        status: d.status,
        method: d.paymentMethod,
        date: d.createdAt,
        description: `Processing fee deposit via ${d.paymentMethod}`,
      })),
      ...userWithdrawals.map(w => ({
        id: w.id,
        type: 'withdrawal' as const,
        referenceId: w.withdrawalId,
        amount: Number(w.amount),
        status: w.status,
        method: 'bank_transfer',
        date: w.createdAt,
        description: `Withdrawal to ${w.bankName}`,
      })),
      ...userPayments.map(p => ({
        id: p.id,
        type: 'payment' as const,
        referenceId: p.transactionId,
        amount: Number(p.amount),
        status: p.status,
        method: p.provider,
        date: p.createdAt,
        description: `Payment via ${p.provider}`,
      })),
    ];

    // [WHY] Sort all transactions by date descending (newest first)
    unified.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(unified);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
