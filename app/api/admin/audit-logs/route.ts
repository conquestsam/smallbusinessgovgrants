import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/lib/services/audit-log.service';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access via Redis session lookup
    const session = await getAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse Query Parameters
    const url = new URL(request.url);
    const actionType = url.searchParams.get('actionType') || undefined;
    const adminId = url.searchParams.get('adminId') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const result = await AuditLogService.getLogs({
      actionType,
      adminId,
      search,
      limit,
      offset
    });

    const actionTypes = await AuditLogService.getActionTypes();

    return NextResponse.json({
        ...result,
        actionTypes
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
