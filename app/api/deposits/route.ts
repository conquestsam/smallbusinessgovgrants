// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

// [WHY] This API handles deposit creation, fetching, and admin accept/reject for the $400 processing fee
// [WHAT] POST creates a deposit, GET fetches deposits, PATCH allows admin to accept/reject
// [WHAT] Sends Telegram notifications on deposit creation and status changes

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { deposits, notifications as notificationsTable, users, systemSettings, paymentMethods, grantApplications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TelegramService } from '@/lib/services/telegram.service';

export const dynamic = 'force-dynamic';

// [WHY] POST: User creates a deposit record after selecting a payment method
export async function POST(request: NextRequest) {
  try {
    const { userId, applicationId, paymentMethod, amount } = await request.json();

    // [WHY] Validate required fields
    if (!userId || !paymentMethod) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // [WHY] Fetch admin-configured countdown duration with fallback to 10 minutes
    let countdownMinutes = 10;
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'deposit_countdown_minutes'))
        .limit(1);
      if (setting?.value) countdownMinutes = Number(setting.value);
    } catch {
      // [WHY] Fallback to 10 minutes if settings table query fails
    }

    // [WHAT] Calculate expiry timestamp based on countdown duration
    const expiresAt = new Date(Date.now() + countdownMinutes * 60 * 1000);

    // [WHY] Fetch admin account details for the selected payment method
    // [WHAT] Look up paymentMethods table for the method-specific account details
    let accountDetails: Record<string, any> = {};
    try {
      const [methodConfig] = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.methodName, paymentMethod))
        .limit(1);

      if (methodConfig) {
        // [WHY] Build account details from the paymentMethods table fields
        if (methodConfig.accountName) accountDetails.accountName = methodConfig.accountName;
        if (methodConfig.accountNumber) accountDetails.accountNumber = methodConfig.accountNumber;
        if (methodConfig.routingNumber) accountDetails.routingNumber = methodConfig.routingNumber;
        if (methodConfig.bankName) accountDetails.bankName = methodConfig.bankName;
        if (methodConfig.swiftCode) accountDetails.swiftCode = methodConfig.swiftCode;
        // [WHY] config JSON field may contain method-specific details (e.g. BTC address, PayPal email)
        if (methodConfig.config) {
          const configData = methodConfig.config as Record<string, any>;
          accountDetails = { ...accountDetails, ...configData };
        }
        if (methodConfig.instructions) accountDetails.instructions = methodConfig.instructions;
      }
    } catch {
      // [WHY] If paymentMethods lookup fails, proceed without details — admin can update later
    }

    // [WHY] Resolve a valid applicationId — the FK constraint requires a real grant_applications.id
    let resolvedApplicationId = applicationId;
    if (!resolvedApplicationId) {
      try {
        // [WHAT] Find the user's most recent grant application to link the deposit
        const [latestApp] = await db
          .select({ id: grantApplications.id })
          .from(grantApplications)
          .where(eq(grantApplications.userId, userId))
          .orderBy(desc(grantApplications.createdAt))
          .limit(1);
        if (latestApp) {
          resolvedApplicationId = latestApp.id;
        }
      } catch {
        // continue — will fail below if no application found
      }
    }

    if (!resolvedApplicationId) {
      return NextResponse.json(
        { message: 'No grant application found. Please submit a grant application before making a deposit.' },
        { status: 400 }
      );
    }

    // [WHAT] Insert deposit record into DB
    const [newDeposit] = await db
      .insert(deposits)
      .values({
        userId,
        applicationId: resolvedApplicationId,
        amount: (amount || 400).toString(),
        paymentMethod,
        status: 'pending',
        expiresAt,
      })
      .returning();

    // [WHY] Get user details for notifications
    let userName = 'Unknown User';
    let userEmail = '';
    try {
      const [user] = await db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
        userEmail = user.email;
      }
    } catch {
      // continue
    }

    // [WHY] Notify all admin users about the new deposit for quick evaluation
    try {
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      // [WHAT] Create notification for each admin user
      if (adminUsers.length > 0) {
        await db.insert(notificationsTable).values(
          adminUsers.map(admin => ({
            userId: admin.id,
            title: 'New Deposit Pending',
            message: `A new $${amount || 400} deposit via ${paymentMethod} requires verification.`,
            type: 'info',
          }))
        );
      }
    } catch (notifError) {
      // [WHY] Don't fail the deposit creation if notification send fails
      console.error('Admin notification failed:', notifError);
    }

    // [WHY] Send instant Telegram notification to admin on deposit initiation
    try {
      await TelegramService.sendDepositNotification(
        newDeposit.id,
        userName,
        userEmail,
        amount || 400,
        paymentMethod,
        applicationId || 'N/A',
        accountDetails
      );
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
    }

    return NextResponse.json({
      deposit: newDeposit,
      depositDetails: { accountDetails },
      countdownMinutes,
    });
  } catch (error: any) {
    console.error('Deposit creation error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create deposit' },
      { status: 500 }
    );
  }
}

// [WHY] GET: Fetch deposits for a user or all deposits for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    const userDeposits = await db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(desc(deposits.createdAt));

    return NextResponse.json(userDeposits);
  } catch (error) {
    console.error('Fetch deposits error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// [WHY] PATCH: Admin accepts or rejects a deposit
export async function PATCH(request: NextRequest) {
  try {
    const { depositId, action, adminId, adminNotes } = await request.json();

    if (!depositId || !action || !adminId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // [WHY] Validate action is either 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // [WHAT] Update deposit status and record admin action
    const [updatedDeposit] = await db
      .update(deposits)
      .set({
        status: newStatus,
        adminNotes: adminNotes || null,
        processedBy: adminId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId))
      .returning();

    if (!updatedDeposit) {
      return NextResponse.json({ message: 'Deposit not found' }, { status: 404 });
    }

    // [WHY] Get user details for notifications
    let userName = 'Unknown User';
    let userEmail = '';
    try {
      const [user] = await db
        .select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, updatedDeposit.userId))
        .limit(1);
      if (user) {
        userName = `${user.firstName} ${user.lastName}`;
        userEmail = user.email;
      }
    } catch {
      // continue
    }

    // [WHY] Send notification to the user about deposit status — async, fire-and-forget
    try {
      const notifTitle = action === 'approve' ? 'Deposit Approved ✅' : 'Deposit Rejected ❌';
      const notifMessage = action === 'approve'
        ? `Your $${updatedDeposit.amount} deposit has been verified and approved. Your grant application is now being processed.`
        : `Your deposit was rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more details.'}`;

      await db.insert(notificationsTable).values({
        userId: updatedDeposit.userId,
        title: notifTitle,
        message: notifMessage,
        type: action === 'approve' ? 'success' : 'error',
      });
    } catch (notifError) {
      console.error('User notification failed:', notifError);
    }

    // [WHY] Send Telegram notification on deposit status change
    try {
      await TelegramService.sendDepositStatusNotification(
        depositId,
        userName,
        Number(updatedDeposit.amount),
        updatedDeposit.paymentMethod,
        action as 'approved' | 'rejected',
        adminNotes
      );
    } catch (telegramError) {
      console.error('Telegram status notification failed:', telegramError);
    }

    return NextResponse.json({
      message: `Deposit ${newStatus} successfully`,
      deposit: updatedDeposit,
    });
  } catch (error: any) {
    console.error('Deposit update error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update deposit' },
      { status: 500 }
    );
  }
}
