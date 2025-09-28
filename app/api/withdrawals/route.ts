import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals, grantApplications, users } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';
import { WebSocketService } from '@/lib/services/websocket.service';
import { EmailService } from '@/lib/services/email.service'; // NEW: Import EmailService
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Enhanced withdrawal creation with validation
    // Verify the application exists and is approved
    const application = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.id, data.applicationId))
      .limit(1);

    if (application.length === 0 || application[0].status !== 'approved') {
      return NextResponse.json(
        { message: 'Invalid or unapproved application' },
        { status: 400 }
      );
    }

    // NEW: Get user info for email notification
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

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

    // NEW: Send withdrawal submission confirmation email to user
    if (userResult.length > 0) {
      const user = userResult[0];
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
        console.log('Withdrawal submission email sent successfully to:', user.email);
      } catch (emailError) {
        console.error('Failed to send withdrawal submission email:', emailError);
        // Don't throw error, continue with other notifications
      }
    }

    // Enhanced notifications
    await TelegramService.sendWithdrawalNotification(
      data.withdrawalId,
      Number(data.amount),
      application[0].businessName
    );

    // Real-time notification to admins
    WebSocketService.emitToAdmins('new_withdrawal', {
      withdrawalId: data.withdrawalId,
      amount: data.amount,
      businessName: application[0].businessName,
      userName: userResult.length > 0 ? `${userResult[0].firstName} ${userResult[0].lastName}` : 'Unknown User'
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

    // Use conditional query building instead of reassignment
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

    // Build the query conditionally without reassigning the type
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