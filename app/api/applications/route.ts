import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { grantApplications } from '@/lib/db/schema';
import { TelegramService } from '@/lib/services/telegram.service';
import { EmailService } from '@/lib/services/email.service';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 🛠️ FIX: Add validation to ensure we have the user's email
    if (!data.userEmail) {
      console.error('Application submission error: userEmail is required for email notification');
      // You might want to get the user's email from the database or auth session
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

    // Send notifications
    await TelegramService.sendApplicationNotification(
      data.applicationId,
      data.businessName,
      Number(data.requestedAmount)
    );

    // 🛠️ FIX: Send application confirmation email - FIXED THE MISSING USER EMAIL
    // The issue was that data.userEmail might be undefined
    if (data.userEmail) {
      await EmailService.sendApplicationStatusEmail({
        name: data.businessName,
        email: data.userEmail, // 🛠️ This was the main issue - make sure this field exists
        applicationNumber: data.applicationId,
        status: 'submitted',
        requestedAmount: Number(data.requestedAmount || 0),
        submissionDate: new Date().toISOString()
      });
      console.log('Application confirmation email sent to:', data.userEmail);
    } else {
      console.warn('Application submitted but no user email provided for notification');
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

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Only fetch applications for the specific user
    const applications = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.userId, userId))
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

// 🆕 NEW: Add this function for status updates
export async function PATCH(request: NextRequest) {
  try {
    const { applicationId, newStatus, userEmail, userName } = await request.json();
    
    // Update application status
    const updatedApp = await db
      .update(grantApplications)
      .set({ status: newStatus })
      .where(eq(grantApplications.applicationId, applicationId))
      .returning();

    // Send status change email
    const application = updatedApp[0];
    
    // 🛠️ FIX: Add email validation here too
    if (userEmail) {
      await EmailService.sendApplicationStatusEmail({
        name: userName || application.businessName,
        email: userEmail,
        applicationNumber: application.applicationId,
        status: newStatus,
        requestedAmount: Number(application.requestedAmount || 0),
        submissionDate: new Date().toISOString()
      });
      console.log('Status update email sent to:', userEmail);
    } else {
      console.warn('Status updated but no user email provided for notification');
    }

    return NextResponse.json({ 
      message: 'Status updated successfully',
      application: updatedApp[0]
    });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
