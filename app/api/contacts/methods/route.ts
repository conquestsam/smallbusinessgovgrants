import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { contactMethods } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

// [WHY] Prevents Vercel edge caching — admin changes reflect immediately on client
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const contacts = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.enabled, true))
      .orderBy(asc(contactMethods.displayOrder));

    return NextResponse.json(contacts, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Public contacts fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
