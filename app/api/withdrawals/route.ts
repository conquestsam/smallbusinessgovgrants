import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals, grantApplications, users, notifications as notificationsTable } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';
import { WebSocketService } from '@/lib/services/websocket.service';
import { EmailService } from '@/lib/services/email.service';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Verify the application exists and is approved
    const applicationResult = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.id, data.applicationId))
      .limit(1);

    const application = applicationResult[0];
    if (!application || application.status !== 'approved') {
      return NextResponse.json(
        { message: 'Invalid or unapproved application' },
        { status: 400 }
      );
    }

    // Get user info for email notification
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    const user = userResult[0];

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

    // Send withdrawal submission confirmation email to user
    if (user) {
      try {
        await EmailService.sendWithdrawalStatusEmail({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          withdrawalId: data.withdrawalId,
          amount: Number(data.amount),
          status: 'pending',
          paymentMethod: 'Bank Transfer',
          processedAt: new Date().toISOString(),
          notes: 'Your withdrawal request has been submitted and is pending review.'
        });
      } catch (emailError) {
        console.error('Failed to send withdrawal submission email:', emailError);
      }
    }

    // Create platform notification
    await db.insert(notificationsTable).values({
      userId: data.userId,
      title: 'Withdrawal Requested',
      message: `Your withdrawal request for $${Number(data.amount).toLocaleString()} has been received and is being processed.`,
      type: 'info',
    });

    // Telegram & WebSocket notifications
    const accountDetails = {
      BankName: data.bankName,
      AccountNumber: data.accountNumber,
      RoutingNumber: data.routingNumber,
      AccountHolderName: data.accountHolderName,
      ...(data.additionalInfo || {})
    };

    const filteredDetails = Object.fromEntries(
      Object.entries(accountDetails).filter(([_, v]) => v && v !== 'N/A')
    );

    await TelegramService.sendWithdrawalNotification(
      data.withdrawalId,
      Number(data.amount),
      application.businessName,
      user ? `${user.firstName} ${user.lastName}` : 'Unknown Developer',
      user ? user.email || 'No Email' : 'No Email',
      data.paymentMethod || 'bank_transfer',
      filteredDetails
    );

    WebSocketService.emitToAdmins('new_withdrawal', {
      withdrawalId: data.withdrawalId,
      amount: data.amount,
      businessName: application.businessName,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
    });

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let baseQuery = db
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
        processedAt: withdrawals.processedAt,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals);

    const withdrawalList = userId 
      ? await baseQuery.where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt))
      : await baseQuery.orderBy(desc(withdrawals.createdAt));

    return NextResponse.json(withdrawalList);
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}