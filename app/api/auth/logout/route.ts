import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

/**
 * Edge-compatible session termination. 
 * Revokes the identity token in Redis and clears HTTP-only cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      // Immediate session eviction from Upstash (Global revocation)
      await redis.del(`session:${token}`);
    }

    const response = NextResponse.json({ message: 'Logout successful' });

    // Clear authentication cookie across all platform paths
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
