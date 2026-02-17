import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { EventCreateSchema } from '@/lib/validators';
import { autoPromotePastEvents } from '@/lib/event-helpers';
import { mapToEventType } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    
    // Ensure any past events are promoted/completed before returning a list
    await autoPromotePastEvents();

    // Support optional filters via query params: status, type, from, to
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');
    const typeFilter = url.searchParams.get('type');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const where: any = {};
    if (statusFilter) where.status = statusFilter;
    if (typeFilter) where.type = mapToEventType(typeFilter);
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const events = await prisma.event.findMany({
      where,
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
      status: event.status,
      completedAt: event.completedAt ? event.completedAt.toISOString() : undefined,
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

    // Only admins can create events
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();

    // Validate request
    try {
      const parsed = EventCreateSchema.parse(body as any);
      // replace variables with parsed values
      var { title, description, date, type, status, location, participants, photos } = parsed;
    } catch (err: any) {
      return NextResponse.json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : 'Invalid payload' }, { status: 400 });
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        type: mapToEventType(type as string),
        status: status || undefined,
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

    // If the event was created already completed, create a timeline entry
    if (event.status === 'COMPLETED') {
      // Use first participant as familyMember if applicable, else set relatedMembers
      const familyMemberId = event.participants && event.participants.length === 1
        ? event.participants[0].id
        : null;

      await prisma.timelineEvent.create({
        data: {
          title: event.title,
          description: event.description,
          date: event.date,
          type: event.type,
          familyMemberId: familyMemberId,
          relatedMembers: event.participants && event.participants.length > 0
            ? { connect: event.participants.map(p => ({ id: p.id })) }
            : undefined,
          sourceEventId: event.id,
          isAutoAdded: true,
        },
      });
    }

    const transformed = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      type: event.type,
      status: event.status,
      completedAt: event.completedAt ? event.completedAt.toISOString() : undefined,
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

