// NEW FILE: Password change API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication via Redis session lookup
    const session = await getAuthSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    const { currentPassword, newPassword } = await request.json();

    // Get current user
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userList[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}