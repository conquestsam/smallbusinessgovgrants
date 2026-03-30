import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { grantApplications, notifications as notificationsTable } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';
import { EmailService } from '@/lib/services/email.service';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
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

    // Send Telegram Notification
    await TelegramService.sendApplicationNotification(
      data.applicationId,
      data.businessName,
      Number(data.requestedAmount)
    );

    // Create Platform Notification
    await db.insert(notificationsTable).values({
      userId: data.userId,
      title: 'Application Submitted',
      message: `Your grant application for ${data.businessName} has been received and is currently under review.`,
      type: 'info',
    });

    // Send Email Notification
    if (data.userEmail) {
      await EmailService.sendApplicationStatusEmail({
        name: data.businessName,
        email: data.userEmail,
        applicationNumber: data.applicationId,
        status: 'submitted',
        requestedAmount: Number(data.requestedAmount || 0),
        submissionDate: new Date().toISOString()
      });
    }

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const applications = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.userId, userId))
      .orderBy(grantApplications.createdAt);

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Applications fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { applicationId, newStatus, userEmail, userName } = await request.json();
    
    // Update application status
    const updatedApp = await db
      .update(grantApplications)
      .set({ status: newStatus })
      .where(eq(grantApplications.applicationId, applicationId))
      .returning();

    const application = updatedApp[0];
    if (!application) throw new Error('Application not found');

    // Send status change email
    if (userEmail) {
      await EmailService.sendApplicationStatusEmail({
        name: userName || application.businessName,
        email: userEmail,
        applicationNumber: application.applicationId,
        status: newStatus,
        requestedAmount: Number(application.requestedAmount || 0),
        submissionDate: new Date().toISOString()
      });
    }

    // Create platform notification for status update
    await db.insert(notificationsTable).values({
      userId: application.userId as string,
      title: 'Application Status Updated',
      message: `Your application ${application.applicationId} status has been updated to: ${newStatus.toUpperCase()}.`,
      type: newStatus === 'approved' ? 'success' : newStatus === 'rejected' ? 'error' : 'info',
    });

    return NextResponse.json({ 
      message: 'Status updated successfully',
      application: application
    });
  } catch (error: any) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
