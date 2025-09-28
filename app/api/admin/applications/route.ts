// NEW FILE: Admin applications management API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { grantApplications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { EmailService } from '@/lib/services/email.service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch applications with user data
    const applications = await db
      .select({
        id: grantApplications.id,
        applicationId: grantApplications.applicationId,
        userId: grantApplications.userId,
        businessName: grantApplications.businessName,
        businessType: grantApplications.businessType,
        requestedAmount: grantApplications.requestedAmount,
        approvedAmount: grantApplications.approvedAmount,
        purpose: grantApplications.purpose,
        status: grantApplications.status,
        adminNotes: grantApplications.adminNotes,
        reviewedAt: grantApplications.reviewedAt,
        createdAt: grantApplications.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(grantApplications)
      .leftJoin(users, eq(grantApplications.userId, users.id))
      .orderBy(grantApplications.createdAt);

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Admin applications fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { applicationId, status, approvedAmount, adminNotes } = await request.json();
    
    // Verify admin access
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get current application data for email
    const currentApplication = await db
      .select()
      .from(grantApplications)
      .where(eq(grantApplications.applicationId, applicationId))
      .limit(1);

    if (currentApplication.length === 0) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Update application
    const updatedApplication = await db
      .update(grantApplications)
      .set({
        status,
        approvedAmount: approvedAmount ? approvedAmount.toString() : null,
        adminNotes,
        reviewedBy: decoded.userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(grantApplications.applicationId, applicationId))
      .returning();

    if (updatedApplication.length === 0) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    // Send notification email based on status
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, updatedApplication[0].userId!))
      .limit(1);

    if (userResult.length > 0) {
      const user = userResult[0];
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com';

      if (status === 'approved') {
        // Send approval email
        const emailData = {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          applicationId: applicationId,
          requestedAmount: Number(currentApplication[0].requestedAmount),
          approvedAmount: Number(approvedAmount),
          GrantPurpose: currentApplication[0].purpose || 'Business Grant',
          repaymentTerm: 0, // Add appropriate value if available
          approvalDate: new Date().toLocaleDateString(),
          availableForWithdrawal: Number(approvedAmount),
          appUrl: appUrl
        };

        await EmailService.sendApplicationApproval(user.email, emailData, appUrl);
      } else {
        // Send status update email for other status changes
        const emailData = {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          applicationNumber: applicationId,
          status: status as 'submitted' | 'under_review' | 'approved' | 'rejected',
          requestedAmount: Number(currentApplication[0].requestedAmount),
          approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
          submissionDate: currentApplication[0].createdAt?.toISOString() || new Date().toISOString(),
          appUrl: appUrl
        };

        await EmailService.sendApplicationStatusEmail(emailData);
      }
    }

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication[0],
    });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}