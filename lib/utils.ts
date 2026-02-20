import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EventType } from '@/lib/generated/prisma';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapToEventType(input?: string): EventType {
  if (!input) return 'OTHER';
  const key = input.toString();

  // Normalize common broad types
  if (key.toLowerCase() === 'plan') return 'PLAN';
  if (key.toLowerCase() === 'timeline') return 'TIMELINE';

  // Known event subtypes that we want to preserve exactly (match case-insensitively)
  const known = new Set<EventType>([
    'PLAN',
    'TIMELINE',
    'MEMORIAL',
    'WEDDING',
    'GRADUATION',
    'ACHIEVEMENT',
    'MILESTONE',
    'OTHER',
    'REUNION',
    'BIRTHDAY',
  ]);

  const upper = key.toUpperCase() as EventType;
  if (known.has(upper)) return upper;

  // Map some common lowercase labels (e.g. 'birthday') to their enum form
  const mapping: Record<string, EventType> = {
    birthday: 'BIRTHDAY',
    wedding: 'WEDDING',
    graduation: 'GRADUATION',
    reunion: 'REUNION',
    memorial: 'MEMORIAL',
    achievement: 'ACHIEVEMENT',
    milestone: 'MILESTONE',
    other: 'OTHER',
  };

  const lowered = key.toLowerCase();
  if (mapping[lowered]) return mapping[lowered];

  // Fallback to OTHER for unknown values
  return 'OTHER';
}
