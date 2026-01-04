import { describe, it, expect } from 'vitest';
import { EventCreateSchema, TimelineCreateSchema } from '@/lib/validators';

describe('EventCreateSchema', () => {
  it('accepts valid payload', () => {
    const valid = {
      title: 'Test',
      description: 'desc',
      date: new Date().toISOString(),
      type: 'PLAN',
    };

    const parsed = EventCreateSchema.parse(valid);
    expect(parsed.title).toBe('Test');
  });

  it('rejects missing fields', () => {
    expect(() => EventCreateSchema.parse({ title: 'x' })).toThrow();
  });

  it('rejects invalid date', () => {
    expect(() => EventCreateSchema.parse({ title: 'x', description: 'y', date: 'not-a-date', type: 'PLAN' })).toThrow();
  });
});

describe('TimelineCreateSchema', () => {
  it('accepts valid payload', () => {
    const valid = {
      title: 'T',
      description: 'd',
      date: new Date().toISOString(),
      type: 'BIRTH',
    };

    const parsed = TimelineCreateSchema.parse(valid);
    expect(parsed.title).toBe('T');
  });

  it('rejects invalid date', () => {
    expect(() => TimelineCreateSchema.parse({ title: 'T', description: 'd', date: 'bad', type: 'BIRTH' })).toThrow();
  });
});