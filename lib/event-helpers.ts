import { prisma } from './prisma';

/**
 * Auto-promote past PENDING events to COMPLETED and ensure COMPLETED events have timeline entries.
 * Idempotent and safe to call from multiple routes.
 */
export async function autoPromotePastEvents(now: Date = new Date()) {
  // Find past events still marked as PENDING
  const pendingPastEvents = await prisma.event.findMany({
    where: {
      date: { lte: now },
      status: 'PENDING',
    },
    include: { participants: { select: { id: true } } },
  });

  // Find completed events that don't yet have a timeline entry
  const completedWithoutTimeline = await prisma.event.findMany({
    where: {
      status: 'COMPLETED',
      timelineEntry: { is: null },
    },
    include: { participants: { select: { id: true } } },
  });

  const allToProcess = [...pendingPastEvents, ...completedWithoutTimeline];

  for (const ev of allToProcess) {
    const familyMemberId = ev.participants && ev.participants.length === 1
      ? ev.participants[0].id
      : null;

    // For pending events, set status to COMPLETED
    if (ev.status === 'PENDING') {
      await prisma.event.update({ where: { id: ev.id }, data: { status: 'COMPLETED', completedAt: ev.date } });
    }

    // Upsert a timeline entry for the event (idempotent because sourceEventId is unique)
    await prisma.timelineEvent.upsert({
      where: { sourceEventId: ev.id },
      create: {
        title: ev.status === 'PENDING' ? `Completed: ${ev.title}` : ev.title,
        description: ev.description || `Automatically added from Event ${ev.title}`,
        date: ev.date,
        type: 'EVENT',
        familyMemberId: familyMemberId,
        relatedMembers: ev.participants && ev.participants.length > 0
          ? { connect: ev.participants.map((p: any) => ({ id: p.id })) }
          : undefined,
        sourceEventId: ev.id,
        isAutoAdded: true,
      },
      update: {
        // keep existing timeline entry mostly as-is; ensure isAutoAdded remains true
        isAutoAdded: true,
      },
    });
  }
}
