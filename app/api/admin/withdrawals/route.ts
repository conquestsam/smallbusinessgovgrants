// NEW FILE: Admin withdrawals management API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { withdrawals, users, grantApplications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { EmailService } from '@/lib/services/email.service';
import { WebSocketService } from '@/lib/services/websocket.service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access via Redis session lookup
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch withdrawals with user and application data
    const withdrawalsList = await db
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
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        application: {
          applicationId: grantApplications.applicationId,
          businessName: grantApplications.businessName,
        }
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .leftJoin(grantApplications, eq(withdrawals.applicationId, grantApplications.id))
      .orderBy(withdrawals.createdAt);

    return NextResponse.json(withdrawalsList);
  } catch (error) {
    console.error('Admin withdrawals fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { withdrawalId, status, adminNotes } = await request.json();
    
    // Verify admin access via Redis session lookup
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Update withdrawal
    const updatedWithdrawal = await db
      .update(withdrawals)
      .set({
        status,
        adminNotes,
        processedBy: session.userId,
        processedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(withdrawals.withdrawalId, withdrawalId))
      .returning();

    if (updatedWithdrawal.length === 0) {
      return NextResponse.json({ message: 'Withdrawal not found' }, { status: 404 });
    }

    // Get user info for notifications
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, updatedWithdrawal[0].userId!))
      .limit(1);

    if (userResult.length > 0) {
      const user = userResult[0];
      
      // NEW: Send withdrawal status email notification
      try {
        await EmailService.sendWithdrawalStatusEmail({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          withdrawalId: withdrawalId,
          amount: Number(updatedWithdrawal[0].amount),
          status: status as 'pending' | 'approved' | 'rejected' | 'processed' | 'completed',
          paymentMethod: updatedWithdrawal[0].bankName.includes('Transfer') ? updatedWithdrawal[0].bankName : 'Bank Transfer',
          bankName: updatedWithdrawal[0].bankName,
          accountNumber: updatedWithdrawal[0].accountNumber,
          accountHolderName: updatedWithdrawal[0].accountHolderName,
          processedAt: updatedWithdrawal[0].processedAt?.toISOString() || new Date().toISOString(),
          notes: adminNotes
        });
        console.log('Withdrawal status email sent successfully to:', user.email);
      } catch (emailError) {
        console.error('Failed to send withdrawal status email:', emailError);
        // Don't throw error, continue with the response
      }
      
      // Send success email (legacy - can be removed if using new status emails)
      if (status === 'completed') {
        await EmailService.sendWithdrawalSuccess(
          user.email,
          withdrawalId,
          Number(updatedWithdrawal[0].amount)
        );
        
        // Real-time notification
        WebSocketService.emitToUser(user.id, 'withdrawal_completed', {
          withdrawalId,
          amount: updatedWithdrawal[0].amount
        });
      }
    }

    return NextResponse.json({
      message: 'Withdrawal updated successfully',
      withdrawal: updatedWithdrawal[0],
    });
  } catch (error) {
    console.error('Withdrawal update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}