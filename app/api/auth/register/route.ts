// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/connection';
import { users as usersTable, notifications as notificationsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email.service';
import { TelegramService } from '@/lib/services/telegram.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key');

  try {
    const contentType = request.headers.get('content-type') || '';
    let firstName: string | undefined, lastName: string | undefined, email: string | undefined, phone: string | undefined, password: string | undefined, confirmPassword: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      firstName = formData.get('firstName') as string;
      lastName = formData.get('lastName') as string;
      email = formData.get('email') as string;
      phone = formData.get('phone') as string;
      password = formData.get('password') as string;
      confirmPassword = formData.get('confirmPassword') as string;
    } else {
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
      email = body.email;
      phone = body.phone;
      password = body.password;
      confirmPassword = body.confirmPassword;
    }

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // ATOMIC REGISTRATION TRANSACTION
    const result = await db.transaction(async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const [existingByIdempotency] = await tx
          .select()
          .from(usersTable)
          .where(eq(usersTable.idempotencyKey, idempotencyKey))
          .limit(1);
        
        if (existingByIdempotency) {
          const { password: _, ...user } = existingByIdempotency;
          return { alreadyRegistered: true, user };
        }
      }

      // 2. Duplicate Email Check
      const [existingUser] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email!))
        .limit(1);

      if (existingUser) {
        throw new Error('User already exists');
      }

      // 3. Hash & Insert
      const hashedPassword = await bcrypt.hash(password!, 12);
      const newUserResult = await tx
        .insert(usersTable)
        .values({
          firstName: firstName!,
          lastName: lastName!,
          email: email!,
          phone: phone || null,
          password: hashedPassword,
          idempotencyKey,
          role: 'user',
          isActive: true,
          isEmailVerified: false,
        })
        .returning();
      const newUser = (newUserResult as any[])[0];

      const { password: _, ...userWithoutPassword } = newUser;
      return { alreadyRegistered: false, user: userWithoutPassword };
    });

    if (result.alreadyRegistered) {
        return NextResponse.json({ 
            success: true, 
            message: 'User already registered (idempotent)',
            user: result.user 
        });
    }

    // Side effects (outside transaction but post-success)
    try {
      await Promise.all([
        EmailService.sendRegistrationEmail({
          name: `${firstName} ${lastName}`,
          email,
          isSuccess: true,
        }),
        TelegramService.sendRegistrationNotification(`${firstName} ${lastName}`, email),
        // Create platform notification
        db.insert(notificationsTable).values({
          userId: result.user.id,
          title: 'Welcome to SBA Grant Management',
          message: `Hello ${firstName}, your account has been successfully created. You can now start your grant application.`,
          type: 'info',
        })
      ]);
    } catch (sideEffectError) {
      console.error('Registration side-effect failed:', sideEffectError);
      // We don't fail the request if side effects fail, but we log it.
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: result.user
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: error.message === 'User already exists' ? 400 : 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, idempotency-key',
    },
  });
}