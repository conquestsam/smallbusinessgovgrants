import { db } from '@/lib/db/connection';
import { emailTemplates, emailJobs, sendHistory } from '@/lib/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailAutomationService {
  /**
   * Trigger an automated email follow-up based on an event
   */
  static async triggerEvent(eventType: string, userId: string, userData?: any) {
    // 1. Find all enabled templates for this event
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.triggerEvent, eventType), eq(emailTemplates.enabled, true)));

    for (const template of templates) {
      // 2. Rate Limit (Prevent duplicates)
      const [history] = await db
        .select()
        .from(sendHistory)
        .where(and(eq(sendHistory.userId, userId), eq(sendHistory.templateId, template.id)))
        .limit(1);

      if (history) continue; // Already sent

      // 3. Schedule for delivery
      const scheduledFor = new Date();
      scheduledFor.setSeconds(scheduledFor.getSeconds() + (template.delayInterval || 0));

      await db.insert(emailJobs).values({
        userId,
        templateId: template.id,
        scheduledFor,
        status: 'pending',
      });
    }
  }

  /**
   * Worker Logic: Process pending email jobs
   * (To be called from a long-running process like server.js)
   */
  static async processQueue() {
    const jobs = await db
      .select({
        id: emailJobs.id,
        userId: emailJobs.userId,
        templateId: emailJobs.templateId,
        scheduledFor: emailJobs.scheduledFor,
        status: emailJobs.status,
        attempts: emailJobs.attempts,
        userEmail: sql<string>`(SELECT email FROM users WHERE id = ${emailJobs.userId})`,
        templateSubject: sql<string>`(SELECT subject FROM email_templates WHERE id = ${emailJobs.templateId})`,
        templateBody: sql<string>`(SELECT body_html FROM email_templates WHERE id = ${emailJobs.templateId})`,
      })
      .from(emailJobs)
      .where(and(eq(emailJobs.status, 'pending'), sql`scheduled_for <= NOW()`))
      .limit(10); // Batch size 10

    for (const job of jobs) {
      try {
        if (!job.userEmail) {
            throw new Error(`User email not found for ID: ${job.userId}`);
        }

        // 1. Send via Resend
        const { data, error } = await resend.emails.send({
          from: 'SmallBusiness Support <support@smallbusiness.com>',
          to: [job.userEmail],
          subject: job.templateSubject,
          html: job.templateBody,
        });

        if (error) throw error;

        // 2. Mark as completed
        await db.transaction(async (tx) => {
          await tx.update(emailJobs).set({ status: 'sent', updatedAt: new Date() }).where(eq(emailJobs.id, job.id));
          await tx.insert(sendHistory).values({ userId: job.userId!, templateId: job.templateId!, sentAt: new Date() });
        });

      } catch (err: any) {
        console.error(`Email job failed: ${job.id}`, err);
        
        // 3. Increment attempts and handle fallback
        await db.update(emailJobs).set({ 
            attempts: (job.attempts || 0) + 1,
            lastError: err.message,
            status: (job.attempts || 0) >= 3 ? 'failed' : 'pending', // Retry up to 3 times
            updatedAt: new Date()
        }).where(eq(emailJobs.id, job.id));
      }
    }
  }
}
