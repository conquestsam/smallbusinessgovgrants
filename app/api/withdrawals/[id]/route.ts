import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const result = await db
      .select({
        id: withdrawals.id,
        withdrawalId: withdrawals.withdrawalId,
        userId: withdrawals.userId,
        applicationId: withdrawals.applicationId,
        amount: withdrawals.amount,
        bankName: withdrawals.bankName,
        accountNumber: withdrawals.accountNumber,
        accountHolderName: withdrawals.accountHolderName,
        status: withdrawals.status,
        adminNotes: withdrawals.adminNotes,
        processedAt: withdrawals.processedAt,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals)
      .where(eq(withdrawals.withdrawalId, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ message: 'Withdrawal not found' }, { status: 404 });
    }

    const withdrawal = result[0];

    // Check if the user is authorized to see this withdrawal
    if (session.role !== 'admin' && withdrawal.userId !== session.userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(withdrawal);
  } catch (error) {
    console.error('Withdrawal fetch single error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
