import { db } from '@/lib/db/connection';
import { users, blacklists, adminActionsLog } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { CacheService } from '@/lib/redis';
import { ilike, or, count, desc } from 'drizzle-orm';

export interface GetUsersParams {
  search?: string;
  status?: string;
  isBlacklisted?: boolean;
  limit?: number;
  offset?: number;
}

export class AdminService {
  /**
   * Disable a user account temporarily (Atomic Transaction)
   */
  static async disableUser(userId: string, adminId: string, reason: string) {
    return await db.transaction(async (tx) => {
      // 1. Update user status
      await tx
        .update(users)
        .set({ 
          accountStatus: 'disabled',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // 2. Log admin action
      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'disable_user',
        targetId: userId,
        metadata: { reason },
      });

      // 3. Sync with Redis (Non-critical but handled within transaction scope for logical order)
      // Note: Redis isn't part of the SQL transaction but we keep it here for atomicity of intent.
      await CacheService.set(`user:status:${userId}`, 'disabled', 86400 * 7); // 7 days
    });
  }

  /**
   * Deactivate a user account permanently (Atomic Transaction)
   */
  static async deactivateUser(userId: string, adminId: string, reason: string) {
    return await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          accountStatus: 'deactivated',
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'deactivate_user',
        targetId: userId,
        metadata: { reason },
      });

      await CacheService.set(`user:status:${userId}`, 'deactivated', 86400 * 30);
    });
  }

  /**
   * Re-enable a user account (Atomic Transaction)
   */
  static async enableUser(userId: string, adminId: string) {
    return await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          accountStatus: 'active',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'enable_user',
        targetId: userId,
      });

      await CacheService.set(`user:status:${userId}`, 'active', 86400); 
    });
  }

  /**
   * Soft delete a user account (Atomic Transaction)
   */
  static async softDeleteUser(userId: string, adminId: string, reason: string) {
    return await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ 
          deletedAt: new Date(),
          deletedByAdminId: adminId,
          deleteReason: reason,
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: 'soft_delete_user',
        targetId: userId,
        metadata: { reason },
      });
    });
  }

  /**
   * Blacklist a user, IP, or Email domain (Atomic Transaction)
   */
  static async blacklist(type: 'ip' | 'email' | 'domain' | 'user', value: string, adminId: string, reason: string) {
    return await db.transaction(async (tx) => {
      const [entry] = await tx.insert(blacklists).values({
        type,
        value,
        reason,
        createdBy: adminId,
      }).returning();

      if (type === 'user') {
        await tx.update(users)
          .set({ isBlacklisted: true })
          .where(eq(users.id, value));
      }

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: `blacklist_${type}`,
        targetId: value,
        metadata: { reason },
      });

      const cacheKey = `blacklist:${type}:${value}`;
      await CacheService.set(cacheKey, { blacklisted: true, reason }, 86400 * 30);

      return entry;
    });
  }

  /**
   * Remove from blacklist (Atomic Transaction)
   */
  static async removeBlacklist(id: string, adminId: string) {
    return await db.transaction(async (tx) => {
      const [entry] = await tx.select().from(blacklists).where(eq(blacklists.id, id)).limit(1);
      
      if (!entry) return;

      if (entry.type === 'user') {
        await tx.update(users)
          .set({ isBlacklisted: false })
          .where(eq(users.id, entry.value));
      }

      await tx.delete(blacklists).where(eq(blacklists.id, id));

      await tx.insert(adminActionsLog).values({
        adminId,
        actionType: `remove_blacklist_${entry.type}`,
        targetId: entry.value,
      });

      await CacheService.del(`blacklist:${entry.type}:${entry.value}`);
    });
  }

  /**
   * Get users with advanced filtering and pagination
   */
  static async getUsers(params: GetUsersParams) {
    const { search, status, isBlacklisted, limit = 10, offset = 0 } = params;

    let filters = [];

    if (search) {
      filters.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      filters.push(eq(users.accountStatus, status));
    }

    if (isBlacklisted !== undefined) {
      filters.push(eq(users.isBlacklisted, isBlacklisted));
    }

    filters.push(sql`${users.deletedAt} IS NULL`);

    const [totalCountResult] = await db
      .select({ value: count() })
      .from(users)
      .where(and(...filters));

    const userList = await db
      .select()
      .from(users)
      .where(and(...filters))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: userList.map(({ password, ...u }) => u),
      total: Number(totalCountResult.value),
    };
  }

  /**
   * Check if a value is blacklisted
   */
  static async isBlacklisted(type: 'ip' | 'email' | 'domain' | 'user', value: string): Promise<boolean> {
    const cacheKey = `blacklist:${type}:${value}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) return cached.blacklisted;

    const [entry] = await db.select().from(blacklists).where(and(eq(blacklists.type, type), eq(blacklists.value, value))).limit(1);
    
    if (entry) {
      await CacheService.set(cacheKey, { blacklisted: true, reason: entry.reason }, 86400); 
      return true;
    }

    return false;
  }
}
