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
  // NEW: Enterprise platform fields
  accountStatus: varchar('account_status', { length: 20 }).default('active').notNull(), // 'active', 'disabled', 'deactivated'
  isBlacklisted: boolean('is_blacklisted').default(false),
  version: integer('version').default(1).notNull(), // For optimistic locking
  idempotencyKey: varchar('idempotency_key', { length: 100 }), // Prevent duplicate registrations
  deletedAt: timestamp('deleted_at'),
  deletedByAdminId: uuid('deleted_by_admin_id').references(() => users.id),
  deleteReason: text('delete_reason'),
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
  version: integer('version').default(1).notNull(), // For optimistic locking
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});
// Email Logs table
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(), // 'newsletter', 'notification', 'withdrawal_status', etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'sent', 'failed', 'pending'
  error: text('error'),
  sentAt: timestamp('sent_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// NEW: Blacklist table
export const blacklists = pgTable('blacklists', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 20 }).notNull(), // 'ip', 'email', 'domain', 'user'
  value: varchar('value', { length: 255 }).notNull(),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Payment Methods table
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  methodName: varchar('method_name', { length: 100 }).unique().notNull(), // 'stripe', 'paypal', 'crypto', etc.
  displayName: varchar('display_name', { length: 150 }), // 'Visa / Mastercard', 'Wire Transfer', etc.
  enabled: boolean('enabled').default(true),
  displayPriority: integer('display_priority').default(0),
  instructions: text('instructions'),
  iconUrl: text('icon_url'),
  // Bank / manual transfer fields
  accountName: varchar('account_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 100 }),
  routingNumber: varchar('routing_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 255 }),
  swiftCode: varchar('swift_code', { length: 20 }),
  // Display metadata
  processingTime: varchar('processing_time', { length: 100 }),
  minimumAmount: varchar('minimum_amount', { length: 50 }),
  fee: varchar('fee', { length: 100 }),
  config: jsonb('config'), // Flexible JSON config for method-specific data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Payment Transactions table
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: varchar('transaction_id', { length: 255 }).unique().notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'completed', 'failed', 'refused'
  paymentReference: text('payment_reference'), // For manual verification (e.g., screenshot URL or ID)
  metadata: jsonb('metadata'),
  idempotencyKey: varchar('idempotency_key', { length: 100 }), // Prevent duplicate payment attempts
  version: integer('version').default(1).notNull(), // For optimistic locking
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Payment Wallets table (for Crypto)
export const paymentWallets = pgTable('payment_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull(), // 'BTC', 'ETH', 'USDT'
  network: varchar('network', { length: 50 }).notNull(), // 'Bitcoin', 'ERC20', 'TRC20'
  address: varchar('address', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Contact Methods table
export const contactMethods = pgTable('contact_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'whatsapp', 'telegram', 'email', etc.
  link: text('link').notNull(),
  defaultMessage: text('default_message'),
  enabled: boolean('enabled').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Email Templates table
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateName: varchar('template_name', { length: 100 }).unique().notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(), // 'registration', 'purchase', etc.
  delayInterval: integer('delay_interval').default(0), // Delay in seconds
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Email Jobs table (Database queue)
export const emailJobs = pgTable('email_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  scheduledFor: timestamp('scheduled_for').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'failed'
  attempts: integer('attempts').default(0),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// NEW: Send History table (Rate limit protection)
export const sendHistory = pgTable('send_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  sentAt: timestamp('sent_at').defaultNow(),
});

// NEW: Admin Actions Log table
export const adminActionsLog = pgTable('admin_actions_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => users.id),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'disable_user', 'blacklist_ip', etc.
  targetId: varchar('target_id', { length: 255 }),
  metadata: jsonb('metadata'),
  idempotencyKey: varchar('idempotency_key', { length: 100 }), // For auditing duplicate triggers
  timestamp: timestamp('timestamp').defaultNow(),
});

// NEW: Support TICKETING System
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'payment', 'technical', 'general'
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // 'low', 'medium', 'high', 'emergency'
  status: varchar('status', { length: 20 }).default('open').notNull(), // 'open', 'in_progress', 'resolved', 'closed'
  slaDeadline: timestamp('sla_deadline'),
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const supportMessages = pgTable('support_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  body: text('body').notNull(),
  attachments: jsonb('attachments'), // Array of attachment URLs/Metadata
  type: varchar('type', { length: 20 }).default('public').notNull(), // 'public', 'internal_note'
  createdAt: timestamp('created_at').defaultNow(),
});

export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: varchar('category', { length: 50 }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  tags: jsonb('tags'),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Add to your existing relations section
export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

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

// NEW: Extended Relations
export const blacklistsRelations = relations(blacklists, ({ one }) => ({
  creator: one(users, {
    fields: [blacklists.createdBy],
    references: [users.id],
  }),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id],
  }),
}));

export const emailJobsRelations = relations(emailJobs, ({ one }) => ({
  user: one(users, {
    fields: [emailJobs.userId],
    references: [users.id],
  }),
  template: one(emailTemplates, {
    fields: [emailJobs.templateId],
    references: [emailTemplates.id],
  }),
}));

export const sendHistoryRelations = relations(sendHistory, ({ one }) => ({
  user: one(users, {
    fields: [sendHistory.userId],
    references: [users.id],
  }),
  template: one(emailTemplates, {
    fields: [sendHistory.templateId],
    references: [emailTemplates.id],
  }),
}));

export const adminActionsLogRelations = relations(adminActionsLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminActionsLog.adminId],
    references: [users.id],
  }),
}));

// NEW: Support Relations
export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignee: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportMessages.ticketId],
    references: [supportTickets.id],
  }),
  sender: one(users, {
    fields: [supportMessages.senderId],
    references: [users.id],
  }),
}));