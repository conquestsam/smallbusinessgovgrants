import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import redis from '@/lib/redis';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Lookup user — always return success to prevent email enumeration
    const [user] = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      // Generate a secure single-use token
      const token = crypto.randomUUID();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sbagovgrants.com';
      const resetLink = `${appUrl}/reset-password?token=${token}`;

      // Store token → userId mapping in Redis with 15-minute TTL
      await redis.set(`reset:${token}`, JSON.stringify({
        userId: user.id,
        email: user.email,
      }), { ex: 900 });

      // Generate a temporary display code (last 8 chars of token for reference)
      const displayCode = token.slice(-8).toUpperCase();

      // Send reset email using existing template
      await EmailService.sendPasswordResetEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        resetLink  // Pass the deeplink as the "temporary password" field — the template displays it
      );
    }

    // Always return success (security: no email enumeration)
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
