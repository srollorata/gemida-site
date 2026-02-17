import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

// Admin-only routes
const adminRoutes = ['/admin'];

// Check if a route requires authentication
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

// Check if a route requires admin access
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

// Extract token from request
function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Decode JWT token (client-side decoding, server will verify)
function decodeToken(token: string): { userId?: string; role?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for token in cookie or header
  const cookieToken = request.cookies.get('token')?.value;
  const headerToken = getToken(request);
  const token = cookieToken || headerToken;

  if (!token) {
    // No token, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, verify token server-side by calling /api/auth/me
  if (isAdminRoute(pathname)) {
    try {
      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // ensure cookies are included if needed
        credentials: 'include',
      });

      if (res.status === 200) {
        // Support both shapes: { user: { ... } } and { ... }
        const data = await res.json();
        const user = data?.user ?? data;
        if (user?.role === 'admin') {
          return NextResponse.next();
        }
        // Authenticated but not admin -> redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (res.status === 401) {
        // Unauthorized (expired/invalid token) -> redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        if (res.headers.get('www-authenticate')?.includes('expired')) {
          loginUrl.searchParams.set('expired', 'true');
        }
        return NextResponse.redirect(loginUrl);
      }

      // Any other non-200 -> deny access to admin pages
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
      // In case of errors verifying token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Non-admin protected route: token present — allow and let APIs enforce auth if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

