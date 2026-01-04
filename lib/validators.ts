import { z } from 'zod';

export const EventCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  type: z.string().min(1),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  location: z.string().optional(),
  participants: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
});

export const EventUpdateSchema = EventCreateSchema.partial().refine((data) => {
  // At least one field must be present for update
  return Object.keys(data).length > 0;
}, { message: 'At least one field is required' });


export const TimelineCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' }),
  type: z.string().min(1),
  familyMemberId: z.string().optional().nullable(),
  relatedMembers: z.array(z.string()).optional(),
});

export type EventCreate = z.infer<typeof EventCreateSchema>;
export type TimelineCreate = z.infer<typeof TimelineCreateSchema>;