import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create withdrawal request
    const newWithdrawal = await db
      .insert(withdrawals)
      .values({
        withdrawalId: data.withdrawalId,
        userId: data.userId,
        applicationId: data.applicationId,
        amount: data.amount.toString(),
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        routingNumber: data.routingNumber,
        accountHolderName: data.accountHolderName,
        status: 'pending',
      })
      .returning();

    // Send notifications
    await TelegramService.sendWithdrawalNotification(
      data.withdrawalId,
      Number(data.amount),
      data.accountHolderName
    );

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: newWithdrawal[0],
    });
  } catch (error) {
    console.error('Withdrawal submission error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const withdrawalList = await db
      .select()
      .from(withdrawals)
      .orderBy(withdrawals.createdAt);

    return NextResponse.json(withdrawalList);
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}