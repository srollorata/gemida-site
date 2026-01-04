import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapToEventType(input?: string) {
  if (!input) return 'OTHER';
  const key = input.toString().toLowerCase();
  const milestoneTypes = new Set(['birthday', 'wedding', 'graduation', 'reunion', 'memorial', 'achievement', 'milestone']);
  if (key === 'plan' || key === 'plan') return 'PLAN';
  if (key === 'timeline') return 'TIMELINE';
  if (milestoneTypes.has(key)) return 'MILESTONE';
  return 'OTHER';
}
