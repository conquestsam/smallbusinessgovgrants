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
    // Read the body only once
    const body = await request.json();
    
    // Extract all fields from the single body object
    const { firstName, lastName, email, phone, password, confirmPassword } = body;

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
      const body = JSON.parse(await request.text()); // Try to get the original data for error email
      await EmailService.sendRegistrationEmail({
        name: `${body.firstName} ${body.lastName}`,
        email: body.email,
        isSuccess: false,
        errorMessage: error instanceof Error ? error.message : 'Registration failed'
      });
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}