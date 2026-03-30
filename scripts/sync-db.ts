import { db } from '../lib/db/connection';
import { sql } from 'drizzle-orm';

async function sync() {
  console.log('Starting manual database sync...');
  try {
    // 1. Update Users table
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_status" varchar(20) DEFAULT 'active' NOT NULL`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_blacklisted" boolean DEFAULT false`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100)`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_by_admin_id" uuid`);
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "delete_reason" text`);
    console.log('Users table updated.');

    // 2. Update System Settings
    await db.execute(sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL`);
    console.log('System settings table updated.');

    // 3. Update Payment Transactions
    await db.execute(sql`ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100)`);
    await db.execute(sql`ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1 NOT NULL`);
    console.log('Payment transactions table updated.');

    // 4. Update Admin Actions Log
    await db.execute(sql`ALTER TABLE "admin_actions_log" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(100)`);
    console.log('Admin actions log table updated.');

    // 5. Create Support Tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "category" varchar(50) NOT NULL,
        "subject" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "priority" varchar(20) DEFAULT 'medium' NOT NULL,
        "status" varchar(20) DEFAULT 'open' NOT NULL,
        "sla_deadline" timestamp,
        "assigned_to" uuid,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "body" text NOT NULL,
        "attachments" jsonb,
        "type" varchar(20) DEFAULT 'public' NOT NULL,
        "created_at" timestamp DEFAULT now()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "knowledge_base" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "category" varchar(50) NOT NULL,
        "question" text NOT NULL,
        "answer" text NOT NULL,
        "tags" jsonb,
        "is_published" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `);
    console.log('Support tables created.');

    console.log('Database sync completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
}

sync();
