import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleApiError } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const users = await prisma.user.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      profileImage,
      familyMemberId,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        profileImage,
        familyMemberId: familyMemberId || null,
      },
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

    // If familyMemberId is provided, update the family member
    if (familyMemberId) {
      await prisma.familyMember.update({
        where: { id: familyMemberId },
        data: {
          isUser: true,
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

