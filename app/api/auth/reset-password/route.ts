import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Validate token from Redis
    const tokenData = await redis.get(`reset:${token}`) as { userId: string; email: string } | null;

    if (!tokenData) {
      return NextResponse.json({ message: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, tokenData.userId));

    // Delete token (single-use enforcement)
    await redis.del(`reset:${token}`);

    return NextResponse.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
