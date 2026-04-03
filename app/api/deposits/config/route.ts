// [WHY] This endpoint returns admin-configured fee amount and countdown duration
// [WHAT] Falls back to $400 and 10 minutes if settings are not found in DB

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { systemSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // [WHY] Fetch both settings in parallel for efficiency
    const [feeResult, countdownResult] = await Promise.all([
      db.select().from(systemSettings).where(eq(systemSettings.key, 'deposit_fee_amount')).limit(1),
      db.select().from(systemSettings).where(eq(systemSettings.key, 'deposit_countdown_minutes')).limit(1),
    ]);

    return NextResponse.json({
      // [WHY] Fallback to $400 if admin hasn't configured the fee
      feeAmount: feeResult[0]?.value || '400',
      // [WHY] Fallback to 10 minutes if admin hasn't configured the countdown
      countdownMinutes: countdownResult[0]?.value || '10',
    });
  } catch (error) {
    // [WHY] Return defaults on any DB error so the frontend always works
    console.error('Config fetch error:', error);
    return NextResponse.json({
      feeAmount: '400',
      countdownMinutes: '10',
    });
  }
}
