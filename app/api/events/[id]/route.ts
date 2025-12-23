import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

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
      select: { createdById: true },
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
    const {
      title,
      description,
      date,
      type,
      location,
      participants,
      photos,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (photos !== undefined) updateData.photos = photos;

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

    const transformed = {
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

