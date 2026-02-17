import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request);
    
    const timelineEvent = await prisma.timelineEvent.findUnique({
      where: { id: params.id },
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

    if (!timelineEvent) {
      return NextResponse.json(
        { error: 'Timeline event not found' },
        { status: 404 }
      );
    }

    const transformed = {
      id: timelineEvent.id,
      title: timelineEvent.title,
      description: timelineEvent.description,
      date: timelineEvent.date.toISOString(),
      type: timelineEvent.type,
      familyMemberId: timelineEvent.familyMemberId || undefined,
      relatedMembers: timelineEvent.relatedMembers.map(m => m.id),
    };

    return NextResponse.json({ timelineEvent: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (type !== undefined) updateData.type = type;
    if (familyMemberId !== undefined) updateData.familyMemberId = familyMemberId || null;

    // Update timeline event
    const timelineEvent = await prisma.timelineEvent.update({
      where: { id: params.id },
      data: {
        ...updateData,
        relatedMembers: relatedMembers !== undefined
          ? {
              set: relatedMembers.map((id: string) => ({ id })),
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
      relatedMembers: timelineEvent.relatedMembers.map(m => m.id),
    };

    return NextResponse.json({ timelineEvent: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request);
    
    const result = await prisma.timelineEvent.deleteMany({ where: { id: params.id } });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Timeline event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

