// NEW FILE: Withdrawal receipt download API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PDFService } from '@/lib/services/pdf.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const withdrawalId = params.id;

    // Fetch withdrawal with user data
    const withdrawalData = await db
      .select({
        withdrawal: withdrawals,
        user: users,
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.id, withdrawalId))
      .limit(1);

    if (withdrawalData.length === 0) {
      return NextResponse.json({ message: 'Withdrawal not found' }, { status: 404 });
    }

    const { withdrawal, user } = withdrawalData[0];

    if (withdrawal.status !== 'completed') {
      return NextResponse.json({ message: 'Receipt not available for pending withdrawals' }, { status: 400 });
    }

    // Generate PDF receipt
    const receiptHTML = PDFService.generateWithdrawalReceipt(withdrawal, user);

    // In a real implementation, you would convert HTML to PDF
    // For now, return the HTML content
    return new NextResponse(receiptHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="receipt-${withdrawal.withdrawalId}.html"`,
      },
    });
  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}