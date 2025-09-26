import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { grantApplications } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create application
    const newApplication = await db
      .insert(grantApplications)
      .values({
        applicationId: data.applicationId,
        userId: data.userId,
        businessName: data.businessName,
        businessType: data.businessType,
        requestedAmount: data.requestedAmount.toString(),
        purpose: data.purpose,
        businessPlan: data.businessPlan,
        documents: data.documents || [],
        status: 'pending',
      })
      .returning();

    // Send notifications
    await TelegramService.sendApplicationNotification(
      data.applicationId,
      data.businessName,
      Number(data.requestedAmount)
    );

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: newApplication[0],
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const applications = await db
      .select()
      .from(grantApplications)
      .orderBy(grantApplications.createdAt);

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}