// NEW FILE: Password reset API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { EmailService } from '@/lib/services/email.service';

// NEW: Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { newPassword, sendEmail = true } = body;

    // Generate new password if not provided
    const password = newPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUser = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send email with new password if requested
    if (sendEmail) {
      await EmailService.sendPasswordReset(
        updatedUser[0].email,
        updatedUser[0].name || 'User',
        password
      );
    }

    return NextResponse.json({ 
      message: 'Password reset successfully',
      temporaryPassword: newPassword ? undefined : password
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}