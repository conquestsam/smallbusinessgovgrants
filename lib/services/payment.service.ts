import { db } from '@/lib/db/connection';
import { paymentMethods, paymentTransactions, paymentWallets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Payment Provider Strategy Interface
export interface PaymentProvider {
  createPayment(amount: number, currency: string, userId: string, metadata?: any): Promise<{ transactionId: string; url?: string; instructions?: string; qrCode?: string }>;
  verifyPayment(transactionId: string, reference?: string): Promise<boolean>;
}

// STRIPE PROVIDER
export class StripeProvider implements PaymentProvider {
  async createPayment(amount: number, currency: string, userId: string, metadata?: any) {
    const idempotencyKey = metadata?.idempotencyKey;
    
    return await db.transaction(async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(paymentTransactions)
          .where(and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.idempotencyKey, idempotencyKey)))
          .limit(1);
        
        if (existing) return { transactionId: existing.transactionId, url: (existing.metadata as Record<string, any>)?.checkoutUrl };
      }

      const transactionId = `pi_${Math.random().toString(36).substring(7)}`;
      const checkoutUrl = `https://checkout.stripe.com/pay/${transactionId}`;

      // 2. Persist Transaction
      await tx.insert(paymentTransactions).values({
        transactionId,
        provider: 'stripe',
        userId,
        amount: (amount / 100).toString(),
        currency,
        status: 'pending',
        idempotencyKey,
        metadata: { ...metadata, checkoutUrl },
      });

      return { transactionId, url: checkoutUrl };
    });
  }

  async verifyPayment(transactionId: string) {
    return true;
  }
}

// CRYPTO PROVIDER (Manual Reference)
export class CryptoProvider implements PaymentProvider {
  async createPayment(amount: number, currency: string, userId: string, metadata?: any) {
    const idempotencyKey = metadata?.idempotencyKey;
    const symbol = metadata.symbol || 'USDT';

    return await db.transaction(async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(paymentTransactions)
          .where(and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.idempotencyKey, idempotencyKey)))
          .limit(1);
        
        if (existing) return { transactionId: existing.transactionId, instructions: (existing.metadata as Record<string, any>)?.instructions };
      }

      // 2. Get Admin Wallet Address
      const [wallet] = await tx.select().from(paymentWallets).where(and(eq(paymentWallets.symbol, symbol), eq(paymentWallets.enabled, true))).limit(1);

      if (!wallet) throw new Error(`No enabled wallet for ${symbol}`);

      const transactionId = `cryp_${Date.now()}`;
      const instructions = `Please send ${amount} ${symbol} to address: ${wallet.address} on ${wallet.network} network.`;

      // 3. Persist
      await tx.insert(paymentTransactions).values({
        transactionId,
        provider: 'crypto',
        userId,
        amount: amount.toString(),
        currency,
        status: 'pending',
        idempotencyKey,
        metadata: { ...metadata, walletAddress: wallet.address, instructions },
      });

      return { transactionId, instructions };
    });
  }

  async verifyPayment(transactionId: string, reference: string) {
    return await db.transaction(async (tx) => {
      // Use optimistic locking (version) implicitly handled by condition
      const [existing] = await tx.select().from(paymentTransactions).where(eq(paymentTransactions.transactionId, transactionId)).limit(1);
      
      if (!existing) throw new Error('Transaction not found');
      if (existing.status !== 'pending') return true; // Already processed

      await tx.update(paymentTransactions)
        .set({ 
            paymentReference: reference, 
            status: 'pending_verification',
            version: existing.version + 1,
            updatedAt: new Date()
        })
        .where(and(eq(paymentTransactions.id, existing.id), eq(paymentTransactions.version, existing.version)));
      
      return true;
    });
  }
}

// MANUAL PROVIDER (CashApp, Venmo, PayPal)
export class ManualProvider implements PaymentProvider {
    constructor(private providerName: string) {}

  async createPayment(amount: number, currency: string, userId: string, metadata?: any) {
    const idempotencyKey = metadata?.idempotencyKey;

    return await db.transaction(async (tx) => {
      if (idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(paymentTransactions)
          .where(and(eq(paymentTransactions.userId, userId), eq(paymentTransactions.idempotencyKey, idempotencyKey)))
          .limit(1);
        
        if (existing) return { transactionId: existing.transactionId, instructions: (existing.metadata as Record<string, any>)?.instructions };
      }

      const transactionId = `${this.providerName}_${Date.now()}`;
      const [method] = await tx.select().from(paymentMethods).where(eq(paymentMethods.methodName, this.providerName)).limit(1);
      const instructions = method?.instructions || `Please pay ${amount} ${currency} via ${this.providerName}.`;

      await tx.insert(paymentTransactions).values({
        transactionId,
        provider: this.providerName,
        userId,
        amount: amount.toString(),
        currency,
        status: 'pending',
        idempotencyKey,
        metadata: { ...metadata, instructions },
      });

      return { transactionId, instructions };
    });
  }

  async verifyPayment(transactionId: string, reference: string) {
    await db.update(paymentTransactions)
      .set({ paymentReference: reference, status: 'pending_verification', updatedAt: new Date() })
      .where(eq(paymentTransactions.transactionId, transactionId));
    
    return true;
  }
}

// PAYMENT SERVICE FACTORY
export class PaymentService {
  static getProvider(providerName: string): PaymentProvider {
    switch (providerName.toLowerCase()) {
      case 'stripe':
        return new StripeProvider();
      case 'crypto':
        return new CryptoProvider();
      case 'cashapp':
      case 'venmo':
      case 'paypal':
        return new ManualProvider(providerName);
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }
  }

  static async getEnabledMethods() {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.enabled, true)).orderBy(paymentMethods.displayPriority);
  }
}
