import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        familyMemberId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = requireAuth(request);

    const body = await request.json();
    const { name, email, password, profileImage, familyMemberId, role } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (familyMemberId !== undefined) updateData.familyMemberId = familyMemberId;

    // Only admins can change role
    if (role !== undefined && auth.role === 'admin') {
      updateData.role = role;
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        familyMemberId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Handle familyMember linking/unlinking if requested
    if (familyMemberId !== undefined) {
      // Remove old link
      const oldUser = await prisma.user.findUnique({ where: { id: auth.userId }, select: { familyMemberId: true } });
      if (oldUser?.familyMemberId) {
        await prisma.familyMember.update({
          where: { id: oldUser.familyMemberId },
          data: { isUser: false, userId: null },
        });
      }

      // Add new link
      if (familyMemberId) {
        await prisma.familyMember.update({
          where: { id: familyMemberId },
          data: { isUser: true, userId: auth.userId },
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
