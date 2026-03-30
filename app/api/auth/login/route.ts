import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import redis from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user by email
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const user = userList[0];
    
    // Status checks
    if (user.isBlacklisted) {
      return NextResponse.json({ message: 'Account blacklisted' }, { status: 403 });
    }

    if (user.deletedAt) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }

    if (user.accountStatus === 'disabled') {
       return NextResponse.json({ message: 'Account disabled' }, { status: 403 });
    }

    if (user.accountStatus === 'deactivated') {
       return NextResponse.json({ message: 'Account deactivated' }, { status: 403 });
    }

    // Password verification
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // GENERATE SESSION TOKEN (Edge-safe)
    const sessionId = crypto.randomUUID();
    
    // PERSIST SESSION IN REDIS (30-minute TTL)
    await redis.set(`session:${sessionId}`, JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.accountStatus
    }), { ex: 1800 });

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: sessionId, // Client can treat this as an opaque token
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}