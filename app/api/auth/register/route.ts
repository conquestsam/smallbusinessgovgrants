// app/api/auth/register/route.ts
// [SAFETY CHECKLIST]
// - [ ] No existing test fails.
// - [ ] No public interface changes unless approved.
// - [ ] No new runtime exceptions possible.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/connection';
import { users as usersTable, notifications as notificationsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email.service';
import { TelegramService } from '@/lib/services/telegram.service';
// [WHY] Import CloudinaryService to handle avatar uploads
// [WHAT] Used to upload profile picture to Cloudinary and get back a public URL
import { CloudinaryService } from '@/lib/services/cloudinary.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('idempotency-key');

  try {
    const contentType = request.headers.get('content-type') || '';
    let firstName: string | undefined, lastName: string | undefined, email: string | undefined, phone: string | undefined, password: string | undefined, confirmPassword: string | undefined;
    // [WHY] Track avatar file separately so we can upload it outside the DB transaction
    // [WHAT] avatarFile holds the raw File object from the multipart form
    let avatarFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      firstName = formData.get('firstName') as string;
      lastName = formData.get('lastName') as string;
      email = formData.get('email') as string;
      phone = formData.get('phone') as string;
      password = formData.get('password') as string;
      confirmPassword = formData.get('confirmPassword') as string;
      // [WHY] Extract avatar file from FormData — this was previously ignored
      // [WHAT] The client sends a file under the 'avatar' key; we capture it here
      // [RISK] avatarFile may be null if user didn't upload one — that's intentional
      const rawAvatar = formData.get('avatar');
      if (rawAvatar && rawAvatar instanceof File && rawAvatar.size > 0) {
        avatarFile = rawAvatar;
      }
    } else {
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
      email = body.email;
      phone = body.phone;
      password = body.password;
      confirmPassword = body.confirmPassword;
      // [WHY] JSON body can't carry binary files — avatar is only available via FormData
    }

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // [WHY] Upload avatar BEFORE the DB transaction to avoid long-running transactions
    // [WHAT] Convert the File to Buffer and upload via Cloudinary; get back a URL
    // [RISK] If Cloudinary upload fails, registration still proceeds without avatar
    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        const arrayBuffer = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // [WHAT] Use a temporary unique ID for the upload path since we don't have
        //        the user ID yet — Cloudinary will create a unique public_id
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        avatarUrl = await CloudinaryService.uploadAvatar(buffer, tempId);
      } catch (avatarError) {
        // [WHY] Avatar upload failure should NOT block registration
        // [WHAT] Log the error and proceed — user can update avatar later via profile
        console.error('Avatar upload failed (non-blocking):', avatarError);
      }
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
          // [WHY] Store the Cloudinary avatar URL in the DB
          // [WHAT] Will be null if no avatar was uploaded or if upload failed
          avatar: avatarUrl,
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