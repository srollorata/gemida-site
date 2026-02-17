import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(request);
    
    const familyMember = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        spouse: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        childLinks: {
          include: {
            child: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: 'Family member not found' },
        { status: 404 }
      );
    }

    const transformed = {
      id: familyMember.id,
      name: familyMember.name,
      birthDate: familyMember.birthDate?.toISOString() || undefined,
      deathDate: familyMember.deathDate?.toISOString() || undefined,
      profileImage: familyMember.profileImage,
      relationship: familyMember.relationship,
      spouse: familyMember.spouseId || undefined,
      parents: familyMember.parentLinks.map(link => link.parentId),
      children: familyMember.childLinks.map(link => link.childId),
      biography: familyMember.biography,
      occupation: familyMember.occupation,
      location: familyMember.location,
      isUser: familyMember.isUser,
      userId: familyMember.userId || undefined,
    };

    return NextResponse.json({ familyMember: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins may update family members
    requireAdmin(request);
    
    const body = await request.json();
    const {
      name,
      birthDate,
      deathDate,
      profileImage,
      relationship,
      spouseId,
      parents,
      children,
      biography,
      occupation,
      location,
      isUser,
      userId,
    } = body;

    // Update the family member
    const familyMember = await prisma.familyMember.update({
      where: { id: params.id },
      data: {
        name,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        profileImage,
        relationship,
        spouseId: spouseId || null,
        biography,
        occupation,
        location,
        isUser: isUser !== undefined ? isUser : undefined,
        userId: userId || null,
      },
    });

    // Update parent-child relationships
    // First, delete existing relationships
    await prisma.parentChild.deleteMany({
      where: {
        OR: [
          { childId: params.id },
          { parentId: params.id },
        ],
      },
    });

    // Then create new ones
    if (parents && Array.isArray(parents) && parents.length > 0) {
      await prisma.parentChild.createMany({
        data: parents.map((parentId: string) => ({
          parentId,
          childId: params.id,
        })),
        skipDuplicates: true,
      });
    }

    if (children && Array.isArray(children) && children.length > 0) {
      await prisma.parentChild.createMany({
        data: children.map((childId: string) => ({
          parentId: params.id,
          childId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch updated member with relationships
    const updated = await prisma.familyMember.findUnique({
      where: { id: params.id },
      include: {
        spouse: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        parentLinks: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        childLinks: {
          include: {
            child: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const transformed = {
      id: updated!.id,
      name: updated!.name,
      birthDate: updated!.birthDate?.toISOString() || undefined,
      deathDate: updated!.deathDate?.toISOString() || undefined,
      profileImage: updated!.profileImage,
      relationship: updated!.relationship,
      spouse: updated!.spouseId || undefined,
      parents: updated!.parentLinks.map(link => link.parentId),
      children: updated!.childLinks.map(link => link.childId),
      biography: updated!.biography,
      occupation: updated!.occupation,
      location: updated!.location,
      isUser: updated!.isUser,
      userId: updated!.userId || undefined,
    };

    return NextResponse.json({ familyMember: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admins may delete family members
    requireAdmin(request);
    
    // Delete parent-child relationships first
    await prisma.parentChild.deleteMany({
      where: {
        OR: [
          { childId: params.id },
          { parentId: params.id },
        ],
      },
    });

    // Remove spouse references
    await prisma.familyMember.updateMany({
      where: { spouseId: params.id },
      data: { spouseId: null },
    });

    // Delete the family member
    await prisma.familyMember.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

