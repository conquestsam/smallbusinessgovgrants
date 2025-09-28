// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/email.service';
import { TelegramService } from '@/lib/services/telegram.service';

// Add this export to force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if the request is FormData
    const contentType = request.headers.get('content-type') || '';
    
    let formData;
    let firstName, lastName, email, phone, password, confirmPassword;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData from the frontend
      formData = await request.formData();
      
      firstName = formData.get('firstName') as string;
      lastName = formData.get('lastName') as string;
      email = formData.get('email') as string;
      phone = formData.get('phone') as string;
      password = formData.get('password') as string;
      confirmPassword = formData.get('confirmPassword') as string;
      
      // Handle avatar file if present
      const avatarFile = formData.get('avatar') as File | null;
      if (avatarFile && avatarFile.size > 0) {
        // Here you can process the avatar file
        // For now, we'll just log it since your schema doesn't have an avatar field
        console.log('Avatar file received:', avatarFile.name, avatarFile.size);
      }
    } else {
      // Handle JSON data (fallback)
      const body = await request.json();
      firstName = body.firstName;
      lastName = body.lastName;
      email = body.email;
      phone = body.phone;
      password = body.password;
      confirmPassword = body.confirmPassword;
    }

    // Validate required fields for registration
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return success (exclude password)
    const { password: _, ...userWithoutPassword } = newUser[0];

    // Send registration email - use the actual user data
    await EmailService.sendRegistrationEmail({
      name: `${firstName} ${lastName}`,
      email,
      isSuccess: true, // Since registration was successful
      errorMessage: undefined
    });

    // Send Telegram notification for successful registration
    await TelegramService.sendRegistrationNotification(
      `${firstName} ${lastName}`, 
      email
    );

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error in user registration:', error);
    
    // Send failure email if there was an error during registration
    try {
      // For FormData requests, we can't easily re-read the body
      // So we'll skip the error email for FormData or use a different approach
      const contentType = request.headers.get('content-type') || '';
      
      if (!contentType.includes('multipart/form-data')) {
        const body = await request.json();
        await EmailService.sendRegistrationEmail({
          name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          isSuccess: false,
          errorMessage: error instanceof Error ? error.message : 'Registration failed'
        });
      }
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to register user', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}