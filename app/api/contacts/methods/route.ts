import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { contactMethods } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const contacts = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.enabled, true))
      .orderBy(asc(contactMethods.displayOrder));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Public contacts fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
