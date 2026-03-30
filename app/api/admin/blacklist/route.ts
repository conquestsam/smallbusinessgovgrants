import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blacklists } from '@/lib/db/schema';
import { AdminService } from '@/lib/services/admin.service';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const list = await db.select().from(blacklists);
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { type, value, reason } = await request.json();
    const entry = await AdminService.blacklist(type, value, adminId, reason);
    return NextResponse.json(entry);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const adminId = session.userId;

  try {
    const { id } = await request.json();
    await AdminService.removeBlacklist(id, adminId);
    return NextResponse.json({ message: 'Successfully removed from blacklist' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
