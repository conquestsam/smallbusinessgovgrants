import { NextRequest } from 'next/server';
import redis, { CacheService } from './redis';

export interface AuthSession {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled' | 'deactivated';
}

/**
 * Retrieves the session from the 'auth-token' cookie and validates via Redis.
 * This is the unified replacement for JWT verification in the Edge/Serverless context.
 */
export async function getAuthSession(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    // Lookup session in Redis using the opaque token
    const session = await CacheService.get(`session:${token}`);
    
    if (!session) {
      return null;
    }

    // Basic structure validation
    if (!session.userId || !session.role) {
      console.error('Malformed session found in Redis:', session);
      return null;
    }

    return session as AuthSession;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

/**
 * Specialized check for admin-only routes.
 */
export async function getAdminSession(request: NextRequest): Promise<AuthSession | null> {
  const session = await getAuthSession(request);
  
  if (!session || session.role !== 'admin') {
    return null;
  }

  return session;
}
