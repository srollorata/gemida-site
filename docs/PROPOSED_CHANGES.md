# Proposed Security & UX Improvements — GemidaWebsite

Date: 2026-02-17

Summary
-------
This document summarizes prioritized security and user-experience improvements focused on the `user` and `admin` roles. The highest-priority work removes an authorization bypass in `middleware.ts`, enforces server-side admin checks, and removes unsafe client-accessible tokens. Secondary work consolidates and secures file uploads, replaces the in-memory rate limiter for production, constrains role values in the DB, and removes XSS vectors. The goal is to eliminate privilege escalation, reduce XSS token theft risk, and make the admin/user UI consistent and reliable.

Priority Action Items (short)
-----------------------------
1. Critical: Fix middleware JWT verification (middleware.ts)
2. Critical: Enforce server-side admin authorization on mutating endpoints (app/api/family-members, app/api/timeline-events, etc.)
3. High: Move to server-set HttpOnly, Secure cookies for session tokens and stop storing tokens in localStorage (app/api/auth/login/route.ts, context/AuthContext.tsx, lib/api-helpers.ts, lib/api-client.ts)
4. High: Replace in-memory rate limiter with Redis-backed limiter (lib/rate-limit.ts)
5. Medium: Consolidate upload handlers and remove fake-auth stub (lib/uploadthing.ts, app/api/uploadthing/core.ts, lib/uploadthing-client.ts)
6. Medium: Remove/replace dangerouslySetInnerHTML usage and sanitize config-driven values (components/ui/chart.tsx)
7. Medium: Constrain `User.role` to an enum or validate centrally (prisma/schema.prisma, migration script)
8. Medium: Harden validation and sanitization for profileImage and uploaded URLs (components/ImageUpload.tsx, lib/uploadthing.ts)
9. Low: Improve structured logging/audit for sensitive events (app/api/auth/login/route.ts, upload handlers)
10. Low: Improve client UX for session expiry, consistent 401 handling, and admin UI fallbacks (context/AuthContext.tsx, lib/api-client.ts, admin pages)

Why these priorities
--------------------
- The current `middleware.ts` decodes JWTs without verifying signatures and uses decoded role claims for routing. This is a direct privilege-escalation vector and must be fixed first.
- Several API routes only rely on `requireAuth` (not `requireAdmin`) while the admin UI assumes admin-only access; server-side enforcement prevents non-admin users from calling admin actions directly.
- Storing JWTs in `localStorage` and exposing them via JS-set cookies is an XSS risk; server-set HttpOnly cookies reduce token theft risk and simplify auth for server-rendered pages.
- In-memory rate limiting fails in multi-instance deployments and can be trivially bypassed; a Redis-backed rate limiter will be robust in production.

Detailed Implementation Notes
-----------------------------
1) Fix middleware JWT verification — (completed)
- Replaced unsigned base64 decode in `middleware.ts` with a server-side verification flow that calls `/api/auth/me` to validate the token and confirm role claims before routing. This prevents trusting client-decoded tokens for admin routing.
- If verification fails, middleware redirects to `/login` and preserves the original redirect query param. See: [middleware.ts](middleware.ts)
 - NOTE (2026-02-18): Updated middleware to also accept the nested response shape returned by `/api/auth/me` (`{ user: { ... } }`) and to treat server errors more explicitly.
   - `middleware.ts` now supports both `{ user: { role } }` and direct `{ role }` payload shapes when parsing the `/api/auth/me` response.
   - Also added `export const dynamic = 'force-dynamic'; export const runtime = 'nodejs';` to `app/api/auth/me/route.ts` so server-side JWT verification (using `jsonwebtoken`) runs in Node runtime. This fixes an issue where the `/api/auth/me` route ran in an Edge runtime and returned non-200, causing valid admin sessions to be redirected to `/dashboard`.
   - Recommended follow-up: ensure other API routes that call `requireAuth` or import `jsonwebtoken` also set `runtime = 'nodejs'` to avoid similar runtime mismatches.

2) Enforce server-side admin authorization — (partial: implemented for family-members & timeline-events)
- Added `requireAdmin(request)` to mutating endpoints for family members and timeline events:
  - `app/api/family-members/route.ts` (POST now requires admin)
  - `app/api/family-members/[id]/route.ts` (PUT/DELETE now require admin)
  - `app/api/timeline-events/route.ts` (POST now requires admin)
- Recommendation: continue auditing other mutating endpoints (events, uploads, users management) and add server-side checks where appropriate.

3) Switch to HttpOnly, Secure cookies — (completed)
- Implemented server-set HttpOnly `token` cookie set on successful login in `app/api/auth/login/route.ts` (cookie is `HttpOnly; SameSite=Strict; Max-Age=7d; Secure` in production).
- Client updated to stop storing the JWT in `localStorage` and to rely on cookie-based sessions (`context/AuthContext.tsx` now uses `fetch('/api/auth/me', { credentials: 'include' })`).
- `lib/api-helpers.getAuthUser` now falls back to the `token` cookie if Authorization header is missing, and `lib/api-client.ts` includes credentials on requests.
- Added `app/api/auth/logout/route.ts` to clear the HttpOnly cookie on logout.

4) Replace in-memory rate-limiter — (implemented)
- Added a Redis-backed rate limiter using `ioredis` when `REDIS_URL` is configured. The implementation uses an atomic `INCR` + `EXPIRE` approach on a per-identifier key (`rl:<identifier>`) with a 15-minute window and 5-attempt limit.
- Files changed: `package.json` (added `ioredis`), `lib/redis.ts` (Redis client helper), `lib/rate-limit.ts` (async Redis-backed limiter with in-memory fallback), and updated `app/api/auth/login/route.ts` to await the async checks (`checkRateLimit`, `recordFailedAttempt`, `resetRateLimit`).
- Behavior: If Redis is unavailable, the code falls back to the in-memory Map (dev-only, single-instance). Rate-limit responses still return `Retry-After` header and 429 status.

5) Consolidate upload pipeline — (in-progress)
- Replaced the fake auth stub in `app/api/uploadthing/core.ts` with a server-side JWT verification that reads the `Authorization` header or `token` cookie, verifies the token using `JWT_SECRET`, and confirms the user exists in the database. The upload middleware now returns server-verified `userId` in metadata.
- Hardened `onUploadComplete` in both `app/api/uploadthing/core.ts` and `lib/uploadthing.ts` to sanitize the returned file URL (`https://` prefix, length cap) and only update `profileImage` when `metadata.updateProfile` is present and the user exists. This prevents client-supplied `userId` or malformed URLs from being written to the DB.
- Updated `lib/uploadthing-client.ts` to include `credentials: 'include'` so cookie-based sessions are sent with UploadThing requests.
- Remaining work: remove duplicate router definitions if desired (keep client-side router types separate) and audit any other upload routes for similar checks.

6) Remove dangerous HTML/CSS injection
- Replace `dangerouslySetInnerHTML` in `components/ui/chart.tsx` with safe assignment of CSS variables via `style` prop or predefined classes.
- Sanitize any config-derived CSS values; reject untrusted inputs.

7) Constrain roles in Prisma
- Update `prisma/schema.prisma` to use an enum for roles (e.g., `enum Role { USER ADMIN }`), migrate current values with a script, then run migrations.
- Alternatively, add server-side validation that maps unknown roles to `USER` and logs anomalies.

8) Harden validation for profileImage
- Require profile photos to be uploaded via UploadThing (no manual URL entry), or validate text URLs against an allowlist and fetch check.
- Sanitize and store only signed storage URLs or internal references.

9) Improve logging and auditing
- Replace `console.log` with structured logs for login attempts, admin actions, and uploads. Optionally add an `AuditLog` DB table for critical events.

10) Client UX improvements — (implemented)
- Added a global re-login modal that appears when the session is detected as invalid (`auth:session-invalid`). The modal prompts the user to go to the login page or dismiss.
- Added a global forbidden handler that shows a clear permission dialog when the server returns `403` (`auth:forbidden` event). API client now dispatches this event on 403 responses.
- Implemented `components/AuthSessionHandler.tsx` and mounted it in `app/layout.tsx` so these dialogs are available globally.
- Recommendation: add confirmation dialogs for destructive admin actions in relevant admin components (not implemented here).

Verification & Testing
----------------------
- Unit tests: add tests to ensure `requireAdmin` blocks non-admins (Vitest).
- Integration: simulate tampered JWT cookie and confirm middleware rejects access.
- Manual: validate login sets `HttpOnly` cookie and admin pages are blocked for non-admins.

Next steps I will take
---------------------
- Implement the first change: update `middleware.ts` to verify tokens before using role claims.
- After that, enforce `requireAdmin` on the critical mutating endpoints listed above.

If you want me to proceed immediately, I will start by editing `middleware.ts` (verify tokens using `lib/api-helpers`) and create a small test to confirm routing rejects tampered tokens.

Status Update (2026-02-18)
---------------------------
- Completed: Forced Node runtime on `app/api/auth/me/route.ts` and added `runtime = 'nodejs'` + `dynamic = 'force-dynamic'` to other API routes that use `requireAuth` (users, events, family-members, timeline-events, upload). This ensures `jsonwebtoken` runs server-side and JWT verification succeeds.
- Completed: Updated `middleware.ts` to accept both `{ user: { ... } }` and flat `{ ... }` response shapes from `/api/auth/me` and to avoid mis-classifying valid admin sessions as failures.
- Verified: Logged in with seeded admin and confirmed admin pages load (no redirect to `/dashboard`).

Next recommendation:
- Create a small PR with these changes and run CI tests; audit any remaining `app/api` routes that import `jsonwebtoken` to ensure runtime consistency.
---

