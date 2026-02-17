import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api-helpers';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';
import jwt from 'jsonwebtoken';

// Force dynamic rendering since we use request.json()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation (basic check)
    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Use email for rate limiting (more secure than IP)
    const rateLimitKey = email.toLowerCase().trim();

    // Check rate limit (supports async Redis-backed limiter)
    const rateLimit = await checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.resetTime 
        ? Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        : 900; // Default to 15 minutes
      
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    // Validate that JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify user credentials
    const user = await verifyUser(email.toLowerCase().trim(), password);

    if (!user) {
      // Record failed attempt
      await recordFailedAttempt(rateLimitKey);
      
      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Successful login - reset rate limit
    await resetRateLimit(rateLimitKey);

    // Generate JWT token with expiration (7 days)
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log successful login (for security monitoring)
    console.log(`Successful login: ${user.email} at ${new Date().toISOString()}`);

    // Set token as HttpOnly, Secure cookie
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const isProd = process.env.NODE_ENV === 'production';
    const cookie = `token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        familyMemberId: user.familyMemberId,
      },
    });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return handleApiError(error);
  }
}