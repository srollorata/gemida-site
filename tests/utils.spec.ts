import { describe, it, expect } from 'vitest';
import { mapToEventType } from '@/lib/utils';

describe('mapToEventType', () => {
  it('maps known types correctly', () => {
    expect(mapToEventType('birthday')).toBe('BIRTHDAY');
    expect(mapToEventType('wedding')).toBe('WEDDING');
    expect(mapToEventType('reunion')).toBe('REUNION');
    expect(mapToEventType('plan')).toBe('PLAN');
    expect(mapToEventType('timeline')).toBe('TIMELINE');
  });

  it('defaults to OTHER for unknown values', () => {
    expect(mapToEventType('random-type')).toBe('OTHER');
    expect(mapToEventType(undefined)).toBe('OTHER');
    expect(mapToEventType('')).toBe('OTHER');
  });
});