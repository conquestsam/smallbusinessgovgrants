import { db } from '@/lib/db/connection';
import { adminActionsLog, users } from '@/lib/db/schema';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';

export interface GetAuditLogsParams {
  actionType?: string;
  adminId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogService {
  /**
   * Get audit logs with rich filtering and pagination
   */
  static async getLogs(params: GetAuditLogsParams) {
    const { actionType, adminId, search, limit = 20, offset = 0 } = params;

    let filters = [];

    if (actionType && actionType !== 'all') {
      filters.push(eq(adminActionsLog.actionType, actionType));
    }

    if (adminId && adminId !== 'all') {
      filters.push(eq(adminActionsLog.adminId, adminId));
    }

    if (search) {
      // Search in targetId or metadata (if possible)
      filters.push(
        or(
          ilike(adminActionsLog.targetId, `%${search}%`),
          ilike(adminActionsLog.actionType, `%${search}%`)
        )
      );
    }

    // Join with users to get admin names
    const query = db
      .select({
        id: adminActionsLog.id,
        actionType: adminActionsLog.actionType,
        targetId: adminActionsLog.targetId,
        metadata: adminActionsLog.metadata,
        timestamp: adminActionsLog.timestamp,
        adminName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        adminEmail: users.email,
      })
      .from(adminActionsLog)
      .leftJoin(users, eq(adminActionsLog.adminId, users.id))
      .where(and(...filters))
      .orderBy(desc(adminActionsLog.timestamp))
      .limit(limit)
      .offset(offset);

    const [totalCountResult] = await db
      .select({ value: count() })
      .from(adminActionsLog)
      .where(and(...filters));

    const logs = await query;

    return {
      logs,
      total: Number(totalCountResult.value),
    };
  }

  /**
   * Get all unique action types for filtering UI
   */
  static async getActionTypes() {
    const results = await db
      .select({ type: adminActionsLog.actionType })
      .from(adminActionsLog)
      .groupBy(adminActionsLog.actionType);
    
    return results.map(r => r.type);
  }
}

import { sql } from 'drizzle-orm';
