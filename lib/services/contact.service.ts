import { db } from '@/lib/db/connection';
import { contactMethods, adminActionsLog } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export class ContactService {
  /**
   * Fetch all enabled contact methods for the dynamic frontend
   */
  static async getEnabledMethods() {
    return await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.enabled, true))
      .orderBy(asc(contactMethods.displayOrder));
  }

  /**
   * Configure/Toggle a contact method (Admin only)
   */
  static async toggleMethod(id: string, enabled: boolean, adminId: string) {
    return await db.transaction(async (tx) => {
      const [entry] = await tx
        .update(contactMethods)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(contactMethods.id, id))
        .returning();

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'contact_method_toggle',
        targetId: id,
        metadata: { platform: entry?.platform, enabled },
      });

      return entry;
    });
  }

  /**
   * Update contact method details
   */
  static async updateMethod(id: string, platform: string, link: string, defaultMessage: string, adminId: string) {
    return await db.transaction(async (tx) => {
      const [entry] = await tx
         .update(contactMethods)
         .set({ platform, link, defaultMessage, updatedAt: new Date() })
         .where(eq(contactMethods.id, id))
         .returning();

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'contact_method_update',
        targetId: id,
        metadata: { platform, link },
      });

      return entry;
    });
  }

  /**
   * Helper to generate WhatsApp/Telegram click-to-contact links
   */
  static generateLink(platform: string, numberOrUsername: string, message?: string): string {
    const encodedMessage = message ? encodeURIComponent(message) : '';
    
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return `https://wa.me/${numberOrUsername}?text=${encodedMessage}`;
      case 'telegram':
        return `https://t.me/${numberOrUsername}`;
      case 'signal':
        return `https://signal.me/#p/${numberOrUsername}`;
      case 'email':
        return `mailto:${numberOrUsername}?subject=Support&body=${encodedMessage}`;
      default:
        return numberOrUsername;
    }
  }
}
