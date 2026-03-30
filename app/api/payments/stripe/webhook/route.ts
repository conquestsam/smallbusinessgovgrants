import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { paymentTransactions } from '@/lib/db/schema';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await db.insert(paymentTransactions).values({
        transactionId: session.id,
        provider: 'stripe',
        userId: session.metadata?.userId || null,
        amount: ((session.amount_total || 0) / 100).toString(), // Convert cents to dollars
        currency: session.currency?.toUpperCase() || 'USD',
        status: 'completed',
        paymentReference: session.payment_intent as string,
        metadata: {
          customerEmail: session.customer_email,
          paymentStatus: session.payment_status,
        },
      });

      console.log(`Stripe payment recorded: ${session.id} for user ${session.metadata?.userId}`);
    } catch (dbError) {
      console.error('Failed to record Stripe payment:', dbError);
    }
  }

  return NextResponse.json({ received: true });
}
