import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin, handleApiError } from '@/lib/api-helpers';
import { TimelineCreateSchema } from '@/lib/validators';
import { autoPromotePastEvents } from '@/lib/event-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const now = new Date();

    // Auto-promote past events and ensure completed events have timeline entries
    await autoPromotePastEvents(now);

    // Query params for filtering timeline results (optional)
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const typeFilter = url.searchParams.get('type'); // comma-separated values
    const familyMemberId = url.searchParams.get('familyMemberId');

    // Build where clause for DB timeline events
    const whereAny: any = {};
    if (from || to) {
      whereAny.date = {};
      if (from) whereAny.date.gte = new Date(from);
      if (to) whereAny.date.lte = new Date(to);
    }
    if (typeFilter) {
      const types = typeFilter.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      if (types.length === 1) whereAny.type = types[0];
      else if (types.length > 1) whereAny.type = { in: types };
    }
    if (familyMemberId) whereAny.familyMemberId = familyMemberId;

    // Fetch timeline events stored in DB (apply any filters)
    const timelineEvents = await prisma.timelineEvent.findMany({
      where: whereAny,
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

    // Build computed events from family member date fields (birth, wedding, death)
    const membersWithDates = await prisma.familyMember.findMany({
      where: {
        OR: [
          { birthDate: { not: null } },
          { weddingDate: { not: null } },
          { deathDate: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
        weddingDate: true,
        deathDate: true,
        profileImage: true,
      },
    });

    const computed: any[] = [];

    for (const m of membersWithDates) {
      if (m.birthDate) {
        computed.push({
          id: `birth-${m.id}`,
          title: `${m.name} — Birth`,
          description: `Birth of ${m.name}`,
          date: m.birthDate.toISOString(),
          type: 'BIRTH',
          familyMemberId: m.id,
          relatedMembers: [],
          isComputed: true,
        });
      }
      if (m.weddingDate) {
        computed.push({
          id: `wedding-${m.id}`,
          title: `${m.name} — Wedding`,
          description: `Wedding of ${m.name}`,
          date: m.weddingDate.toISOString(),
          type: 'WEDDING',
          familyMemberId: m.id,
          relatedMembers: [],
          isComputed: true,
        });
      }
      if (m.deathDate) {
        computed.push({
          id: `death-${m.id}`,
          title: `${m.name} — Death`,
          description: `Death of ${m.name}`,
          date: m.deathDate.toISOString(),
          type: 'DEATH',
          familyMemberId: m.id,
          relatedMembers: [],
          isComputed: true,
        });
      }
    }

    // If filters are provided, apply them to computed items as well
    const applyComputedFilter = (item: any) => {
      if (from && new Date(item.date) < new Date(from)) return false;
      if (to && new Date(item.date) > new Date(to)) return false;
      if (typeFilter) {
        const types = typeFilter.split(',').map(s => s.trim()).filter(Boolean);
        if (types.length > 0 && !types.includes(item.type)) return false;
      }
      if (familyMemberId && item.familyMemberId !== familyMemberId) return false;
      return true;
    };

    const filteredComputed = computed.filter(applyComputedFilter);

    // Transform DB timeline events
    const transformed = timelineEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      type: event.type,
      familyMemberId: event.familyMemberId || undefined,
      relatedMembers: event.relatedMembers.map(m => m.id),
      isComputed: false,
      isAutoAdded: event.isAutoAdded,
      sourceEventId: event.sourceEventId || undefined,
    }));

    // Combine computed (filtered) and stored, then sort by date desc
    const combined = [...transformed, ...filteredComputed].sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));

    return NextResponse.json({ timelineEvents: combined });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins may create timeline events
    requireAdmin(request);
    
    const body = await request.json();

    try {
      const parsed = TimelineCreateSchema.parse(body as any);
      var { title, description, date, type, familyMemberId, relatedMembers } = parsed;
    } catch (err: any) {
      return NextResponse.json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : 'Invalid payload' }, { status: 400 });
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

