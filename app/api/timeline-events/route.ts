import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    
    const timelineEvents = await prisma.timelineEvent.findMany({
      include: {
        familyMember: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        relatedMembers: {
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
    const transformed = timelineEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      type: event.type,
      familyMemberId: event.familyMemberId || undefined,
      relatedMembers: event.relatedMembers.map(m => m.id),
    }));

    return NextResponse.json({ timelineEvents: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    
    const body = await request.json();
    const {
      title,
      description,
      date,
      type,
      familyMemberId,
      relatedMembers,
    } = body;

    if (!title || !description || !date || !type) {
      return NextResponse.json(
        { error: 'Title, description, date, and type are required' },
        { status: 400 }
      );
    }

    // Create timeline event
    const timelineEvent = await prisma.timelineEvent.create({
      data: {
        title,
        description,
        date: new Date(date),
        type,
        familyMemberId: familyMemberId || null,
        relatedMembers: relatedMembers && relatedMembers.length > 0
          ? {
              connect: relatedMembers.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        familyMember: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        relatedMembers: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    const transformed = {
      id: timelineEvent.id,
      title: timelineEvent.title,
      description: timelineEvent.description,
      date: timelineEvent.date.toISOString(),
      type: timelineEvent.type,
      familyMemberId: timelineEvent.familyMemberId || undefined,
      relatedMembers: timelineEvent.relatedMembers.map((m: any) => m.id),
    };

    return NextResponse.json({ timelineEvent: transformed }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

