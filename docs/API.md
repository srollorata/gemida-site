# API Contract — Events & Timeline

This document describes the Events and Timeline API endpoints, request/response shapes, and behavior.

## Events

Base path: `/api/events`

- GET `/api/events`
  - Response: { events: Event[] }
  - Event fields include:
    - id, title, description, date (ISO), type (string), status (`PENDING|COMPLETED|CANCELLED`), completedAt (ISO|null), participants (string[]), photos (string[]), location, createdBy, createdAt
  - Note: This endpoint auto-promotes past events (date in the past) to `COMPLETED` when called to ensure timeline and events are consistent.
  - Filtering: Supports optional query params `status`, `type` (normalized server-side), `from`, `to` (ISO dates) to limit results.

- POST `/api/events`
  - Body: { title, description, date (ISO), type, status? (optional), location?, participants?: string[], photos?: string[] }
  - Creates an Event. The `type` field accepts arbitrary strings and will be normalized server-side to one of `PLAN`, `TIMELINE`, `MILESTONE`, or `OTHER`.
  - If created with status `COMPLETED`, the API will also create a `TimelineEvent` linked to it.
  - Response: { event: Event }

- GET `/api/events/:id`
  - Response: { event: Event }

- PUT `/api/events/:id`
  - Body updates: any event fields including `status` and `type`.
  - The `type` field is normalized server-side to one of `PLAN`, `TIMELINE`, `MILESTONE`, or `OTHER`.
  - Special behavior: when `status` is changed to `COMPLETED`, a `TimelineEvent` is created (if not present). When changed from `COMPLETED` to another status, any linked `TimelineEvent` is removed.

- DELETE `/api/events/:id`
  - Deletes the event. Only creator or admin can delete.

## Timeline Events

Base path: `/api/timeline-events`

- GET `/api/timeline-events`
  - Response: { timelineEvents: TimelineEvent[] }
  - Behavior:
    - Automatically promotes past `Event`s (where `date <= now()` and `status = PENDING`) to `COMPLETED` and creates `TimelineEvent` entries for them (idempotent).
    - Ensures already COMPLETED Events have corresponding timeline entries.
    - Also returns computed timeline items from `FamilyMember` date fields (`birthDate`, `weddingDate`, `deathDate`). These computed items are not stored in the DB (they are flagged `isComputed: true`).
  - Filtering:
    - Supports optional query parameters `from` and `to` (ISO dates) to limit the timeline window, `type` (comma-separated list), and `familyMemberId` to scope results to a person.
  - TimelineEvent fields: id, title, date (ISO), description, type, familyMemberId?, relatedMembers[], isAutoAdded?, sourceEventId?, isComputed?

- POST `/api/timeline-events`
  - Body: { title, description, date, type, familyMemberId?, relatedMembers?: string[] }
  - Creates a persistent TimelineEvent (manual entry).

## Data model changes

- FamilyMember: added `weddingDate?: DateTime`.
- Enums: `EventStatus` (`PENDING`, `COMPLETED`, `CANCELLED`) and `EventType`.
- Event: added `status: EventStatus`, `completedAt?: DateTime` and optional back-relation to `TimelineEvent`.
- TimelineEvent: added `sourceEventId?: string` (unique) and `isAutoAdded: boolean` flag.

## Notes

- Timezones: API uses ISO strings; storing `DateTime` in the DB. Frontend should send/receive ISO strings and display in user's timezone.
- Authorization: endpoints require authentication; some actions restricted to creator or admin.
- Validation: API endpoints validate request payloads using `zod`. Requests missing required fields or containing invalid dates return HTTP 400 with descriptive messages.
- Tests: Basic unit tests for validation schemas exist under `tests/validators.spec.ts` and can be run via `npm test` (uses Vitest). Add more integration tests as needed.
- Auto-promotion: promotion of past events is performed during GET `/api/timeline-events` to ensure the timeline shows completed/past events without requiring a background job. This can later be moved to a cron or background worker for better scalability.
