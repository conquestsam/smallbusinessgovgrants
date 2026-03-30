import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminSession } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify admin access via Redis session lookup
    const session = await getAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { email, subject, bodyHtml } = await request.json();

    if (!email || !subject || !bodyHtml) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'SBA Admin Test <noreply@notifications.sbasmallbusinessgrants.com>',
      to: email,
      subject: `[TEST] ${subject}`,
      html: bodyHtml,
    });

    return NextResponse.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { message: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
