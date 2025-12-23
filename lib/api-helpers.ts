import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function getAuthUser(request: NextRequest): { userId: string; role: string } | null {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

export function requireAuth(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  return auth;
}

export function requireAdmin(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return auth;
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

