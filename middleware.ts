import { NextRequest, NextResponse } from 'next/server';
import redis, { CacheService } from '@/lib/redis';

// Pure Edge/Serverless compatible security middleware
const BLACKLIST_RESPONSE = new NextResponse(null, { status: 404 });

export async function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const token = request.cookies.get('auth-token')?.value;

  // 1. Check IP Blacklist (REST Lookup via Upstash)
  const ipBlacklisted = await CacheService.get(`blacklist:ip:${ip}`);
  if (ipBlacklisted) {
    return BLACKLIST_RESPONSE;
  }

  // 2. Session & Identity Validation (Redis-backed, NO JWT required in Middleware)
  let session: any = null;
  if (token) {
    try {
      // Lookup Session Opaque Token in Redis
      session = await CacheService.get(`session:${token}`);
      
      if (session) {
        // Handle Account Suspensions (Disabled/Deactivated)
        if (session.status === 'disabled' && !request.nextUrl.pathname.startsWith('/account-disabled')) {
          return NextResponse.redirect(new URL('/account-disabled', request.url));
        }

        if (session.status === 'deactivated') {
          const response = NextResponse.redirect(new URL('/login?message=deactivated', request.url));
          response.cookies.delete('auth-token');
          return response;
        }

        // Domain Check (if email present in session)
        if (session.email) {
          const domain = session.email.split('@')[1];
          const domainBlacklisted = await CacheService.get(`blacklist:domain:${domain}`);
          if (domainBlacklisted) {
            return BLACKLIST_RESPONSE;
          }
        }
      } else {
        // Expired or invalid session
        session = null;
      }
    } catch (err) {
      console.error('Middleware session lookup error:', err);
    }
  }

  // 3. Protected Route Enforcement (Role-Based)
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard');

  if (isAdminPath || isDashboardPath) {
    if (!session) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    if (isAdminPath && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
     '/((?!api/auth|api/payments/stripe|_next/static|_next/image|favicon.ico|forgot-password|reset-password).*)',
  ],
};
