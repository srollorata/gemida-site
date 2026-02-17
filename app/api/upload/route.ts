import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Upload API endpoint
 * This is a helper endpoint that can be used for additional validation
 * or processing. The actual uploads are handled by /api/uploadthing
 */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    
    // This endpoint can be used for additional processing if needed
    // The actual file upload is handled by /api/uploadthing
    return NextResponse.json(
      { message: 'Use /api/uploadthing for file uploads' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    
    return NextResponse.json(
      { message: 'Upload endpoint. Use /api/uploadthing for file uploads.' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

