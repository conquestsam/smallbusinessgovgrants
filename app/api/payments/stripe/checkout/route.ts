import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'usd' } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ message: 'Amount must be at least $1' }, { status: 400 });
    }

    // Fetch user details for Stripe metadata
    const [user] = await db
      .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sbagovgrants.com';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user?.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'SBA Grant Platform — Account Funding',
              description: `Funding deposit by ${user?.firstName} ${user?.lastName}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.userId,
        type: 'funding',
      },
      success_url: `${appUrl}/dashboard/funding?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/funding?status=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ message: error.message || 'Checkout failed' }, { status: 500 });
  }
}
