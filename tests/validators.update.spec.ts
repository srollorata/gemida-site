import { describe, it, expect } from 'vitest';
import { EventUpdateSchema } from '@/lib/validators';

describe('EventUpdateSchema', () => {
  it('rejects empty payload', () => {
    expect(() => EventUpdateSchema.parse({})).toThrow();
  });

  it('rejects invalid date', () => {
    expect(() => EventUpdateSchema.parse({ date: 'not-a-date' })).toThrow();
  });

  it('accepts partial valid payload', () => {
    const parsed = EventUpdateSchema.parse({ title: 'Updated title' });
    expect(parsed.title).toBe('Updated title');
  });
});