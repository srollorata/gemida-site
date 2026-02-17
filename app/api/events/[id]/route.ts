import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { EventUpdateSchema } from '@/lib/validators';
import { mapToEventType } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request);
    
    const event = await prisma.event.findUnique({
      where: { id: params.id },
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

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
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
      participants: event.participants.map(p => p.id),
      photos: event.photos,
      createdBy: event.createdById,
      createdAt: event.createdAt.toISOString(),
    };

    return NextResponse.json({ event: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request);
    
    // Check if user created this event or is admin
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true, status: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can update
    if (existingEvent.createdById !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();

    // Validate update payload
    try {
      const parsed = EventUpdateSchema.parse(body as any);
      var { title, description, date, type, status, location, participants, photos } = parsed;
    } catch (err: any) {
      return NextResponse.json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : 'Invalid payload' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) {
      // convert to Date and validate
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      }
      updateData.date = d;
    }
    if (type !== undefined) updateData.type = mapToEventType(type as string);
    if (location !== undefined) updateData.location = location;
    if (photos !== undefined) updateData.photos = photos;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    // If participants are provided, ensure they exist
    if (participants !== undefined && participants.length > 0) {
      const existingMembers = await prisma.familyMember.findMany({ where: { id: { in: participants } }, select: { id: true } });
      const existingIds = existingMembers.map(m => m.id);
      const missing = participants.filter((id: string) => !existingIds.includes(id));
      if (missing.length > 0) {
        return NextResponse.json({ error: `Participants not found: ${missing.join(', ')}` }, { status: 400 });
      }
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...updateData,
        participants: participants !== undefined
          ? {
              set: participants.map((id: string) => ({ id })),
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

    // If status changed to COMPLETED, ensure a timeline event exists
    if ((status as string) === 'COMPLETED') {
      // create timeline event if it doesn't exist
      const existingTimeline = await prisma.timelineEvent.findUnique({
        where: { sourceEventId: event.id },
      });

      if (!existingTimeline) {
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
    } else if ((status as string) !== 'COMPLETED') {
      // If reverting from COMPLETED to something else (or changing status away from completed), remove associated timeline events
      await prisma.timelineEvent.deleteMany({ where: { sourceEventId: event.id } });
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
      participants: event.participants.map(p => p.id),
      photos: event.photos,
      createdBy: event.createdById,
      createdAt: event.createdAt.toISOString(),
    };

    return NextResponse.json({ event: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request);
    
    // Check if user created this event or is admin
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can delete
    if (existingEvent.createdById !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    await prisma.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

