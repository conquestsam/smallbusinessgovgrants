import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: text('avatar'),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Grant Applications table
export const grantApplications = pgTable('grant_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: varchar('application_id', { length: 50 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.id),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  businessType: varchar('business_type', { length: 100 }).notNull(),
  requestedAmount: decimal('requested_amount', { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal('approved_amount', { precision: 12, scale: 2 }),
  purpose: text('purpose').notNull(),
  businessPlan: text('business_plan'),
  documents: jsonb('documents'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Withdrawals table
export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  withdrawalId: varchar('withdrawal_id', { length: 50 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.id),
  applicationId: uuid('application_id').references(() => grantApplications.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  routingNumber: varchar('routing_number', { length: 50 }).notNull(),
  accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  adminNotes: text('admin_notes'),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('info').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// System Settings table
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value'),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  grantApplications: many(grantApplications),
  withdrawals: many(withdrawals),
  notifications: many(notifications),
}));

export const grantApplicationsRelations = relations(grantApplications, ({ one, many }) => ({
  user: one(users, {
    fields: [grantApplications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [grantApplications.reviewedBy],
    references: [users.id],
  }),
  withdrawals: many(withdrawals),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
  application: one(grantApplications, {
    fields: [withdrawals.applicationId],
    references: [grantApplications.id],
  }),
  processor: one(users, {
    fields: [withdrawals.processedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));