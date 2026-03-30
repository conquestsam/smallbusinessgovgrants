import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { EmailService } from '@/lib/services/email.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({ message: 'Recipient email is required' }, { status: 400 });
    }

    // Send a test email using the existing EmailService
    const result = await EmailService.sendRegistrationEmail({
      name: 'Test User',
      email: to,
      isSuccess: true,
    });

    return NextResponse.json({
      success: true,
      message: `Test email dispatched to ${to}`,
      result,
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Email delivery failed',
        error: error?.message || 'Unknown error',
        details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      },
      { status: 500 }
    );
  }
}
