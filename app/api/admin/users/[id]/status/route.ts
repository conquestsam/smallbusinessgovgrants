import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/admin.service';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email.service';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const adminId = session.userId;

  try {
    const { action, reason } = await request.json();
    const userId = params.id;

    // Fetch target user for email notifications
    const [targetUser] = await db
      .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userName = `${targetUser.firstName} ${targetUser.lastName}`;

    switch (action) {
      case 'disable':
        await AdminService.disableUser(userId, adminId, reason);
        // Notify user via email
        await EmailService.sendAccountStatusEmail({
          name: userName,
          email: targetUser.email,
          status: 'disabled',
          reason: reason || 'Your account has been temporarily disabled by an administrator.',
        });
        break;

      case 'enable':
        await AdminService.enableUser(userId, adminId);
        await EmailService.sendAccountStatusEmail({
          name: userName,
          email: targetUser.email,
          status: 'enabled',
          reason: 'Your account has been re-enabled. You may now log in normally.',
        });
        break;

      case 'deactivate':
        await AdminService.deactivateUser(userId, adminId, reason);
        await EmailService.sendAccountStatusEmail({
          name: userName,
          email: targetUser.email,
          status: 'deactivated',
          reason: reason || 'Your account has been deactivated.',
        });
        break;

      case 'soft_delete':
        await AdminService.softDeleteUser(userId, adminId, reason);
        await EmailService.sendAccountStatusEmail({
          name: userName,
          email: targetUser.email,
          status: 'deleted',
          reason: reason || 'Your account has been removed from the platform.',
        });
        break;

      case 'blacklist':
        await AdminService.blacklist('user', userId, adminId, reason);
        // No email for blacklisted users (silent enforcement)
        break;

      case 'reset_password':
        const tempPassword = crypto.randomUUID().slice(0, 12);
        const hashed = await bcrypt.hash(tempPassword, 12);
        await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, userId));
        
        await EmailService.sendPasswordResetEmail(
          targetUser.email,
          userName,
          tempPassword
        );
        break;

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `User ${action} successfully` });
  } catch (error: any) {
    console.error('Admin user status update error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
