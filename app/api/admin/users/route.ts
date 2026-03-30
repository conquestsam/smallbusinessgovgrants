// NEW FILE: Admin users management API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

import { AdminService } from '@/lib/services/admin.service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access via Redis session lookup
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse Query Parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const isBlacklisted = url.searchParams.get('isBlacklisted') === 'true' ? true : 
                         url.searchParams.get('isBlacklisted') === 'false' ? false : undefined;
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const result = await AdminService.getUsers({
      search,
      status,
      isBlacklisted,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();
    
    // Verify admin access via Redis session lookup
    const session = await getAuthSession(request);
    
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json({
      message: 'User updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}