import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleApiError } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request);
    
    // Users can view their own profile, admins can view any
    if (auth.userId !== params.id && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        familyMember: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        familyMemberId: true,
        familyMember: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
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
    
    // Users can update their own profile, admins can update any
    if (auth.userId !== params.id && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      profileImage,
      familyMemberId,
    } = body;

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (familyMemberId !== undefined) updateData.familyMemberId = familyMemberId;
    
    // Only admins can change roles
    if (role !== undefined && auth.role === 'admin') {
      updateData.role = role;
    }
    
    // Hash password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        familyMember: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        familyMemberId: true,
        familyMember: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update family member link if changed
    if (familyMemberId !== undefined) {
      // Remove old link
      const oldUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: { familyMemberId: true },
      });
      
      if (oldUser?.familyMemberId) {
        await prisma.familyMember.update({
          where: { id: oldUser.familyMemberId },
          data: {
            isUser: false,
            userId: null,
          },
        });
      }
      
      // Add new link
      if (familyMemberId) {
        await prisma.familyMember.update({
          where: { id: familyMemberId },
          data: {
            isUser: true,
            userId: params.id,
          },
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    
    // Don't allow deleting yourself
    const auth = requireAuth(request);
    if (auth.userId === params.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Remove family member link
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { familyMemberId: true },
    });
    
    if (user?.familyMemberId) {
      await prisma.familyMember.update({
        where: { id: user.familyMemberId },
        data: {
          isUser: false,
          userId: null,
        },
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

