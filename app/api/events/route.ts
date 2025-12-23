import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    
    const events = await prisma.event.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform to match frontend types
    const transformed = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      type: event.type,
      location: event.location,
      participants: event.participants.map(p => p.id),
      photos: event.photos,
      createdBy: event.createdById,
      createdAt: event.createdAt.toISOString(),
    }));

    return NextResponse.json({ events: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    
    const body = await request.json();
    const {
      title,
      description,
      date,
      type,
      location,
      participants,
      photos,
    } = body;

    if (!title || !description || !date || !type) {
      return NextResponse.json(
        { error: 'Title, description, date, and type are required' },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        type,
        location: location || null,
        createdById: auth.userId,
        createdAt: new Date(),
        photos: photos || [],
        participants: participants && participants.length > 0
          ? {
              connect: participants.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    const transformed = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      type: event.type,
      location: event.location,
      participants: event.participants.map((p: any) => p.id),
      photos: event.photos,
      createdBy: event.createdById,
      createdAt: event.createdAt.toISOString(),
    };

    return NextResponse.json({ event: transformed }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

