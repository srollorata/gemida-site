import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    
    const familyMembers = await prisma.familyMember.findMany({
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
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data to match frontend expectations
    const transformed = familyMembers.map(member => ({
      id: member.id,
      name: member.name,
      birthDate: member.birthDate?.toISOString() || undefined,
      deathDate: member.deathDate?.toISOString() || undefined,
      profileImage: member.profileImage,
      relationship: member.relationship,
      spouse: member.spouseId || undefined,
      parents: member.parentLinks.map(link => link.parentId),
      children: member.childLinks.map(link => link.childId),
      biography: member.biography,
      occupation: member.occupation,
      location: member.location,
      isUser: member.isUser,
      userId: member.userId || undefined,
    }));

    return NextResponse.json({ familyMembers: transformed });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    
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

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create the family member
    const familyMember = await prisma.familyMember.create({
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
        isUser: isUser || false,
        userId: userId || null,
      },
    });

    // Create parent-child relationships
    if (parents && Array.isArray(parents) && parents.length > 0) {
      await prisma.parentChild.createMany({
        data: parents.map((parentId: string) => ({
          parentId,
          childId: familyMember.id,
        })),
        skipDuplicates: true,
      });
    }

    if (children && Array.isArray(children) && children.length > 0) {
      await prisma.parentChild.createMany({
        data: children.map((childId: string) => ({
          parentId: familyMember.id,
          childId,
        })),
        skipDuplicates: true,
      });
    }

    // Fetch the created member with relationships
    const created = await prisma.familyMember.findUnique({
      where: { id: familyMember.id },
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
      id: created!.id,
      name: created!.name,
      birthDate: created!.birthDate?.toISOString() || undefined,
      deathDate: created!.deathDate?.toISOString() || undefined,
      profileImage: created!.profileImage,
      relationship: created!.relationship,
      spouse: created!.spouseId || undefined,
      parents: created!.parentLinks.map(link => link.parentId),
      children: created!.childLinks.map(link => link.childId),
      biography: created!.biography,
      occupation: created!.occupation,
      location: created!.location,
      isUser: created!.isUser,
      userId: created!.userId || undefined,
    };

    return NextResponse.json({ familyMember: transformed }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

