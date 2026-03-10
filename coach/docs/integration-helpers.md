# Integration Helper References

This short reference clarifies how Agents 3 & 4 should import and reuse the utilities Agent 2 built.

## `@/lib/strava/strava-service.ts`
Exports:
- `buildStravaAuthUrl({ userId, redirectUri })`: builds the OAuth redirect URL with encoded state.
- `decodeState(state)`: decodes the `state` query param back into `user_id`.
- `exchangeCodeForToken(code)` / `refreshAccessToken(refreshToken)`: wrap Strava's `/oauth/token` endpoint.
- `fetchStravaActivities(accessToken, after?)`: paginated fetch that honors per-request rate limits (up to 3 pages).
- `upsertStravaActivities(client, userId, activities)`: maps Strava payloads into `strava_activities` rows via deterministic UUIDs.
- `persistStravaTokens` / `ensureFreshStravaTokens`: read/write the `users.athlete_profile.strava` blob (fields: `access_token`, `refresh_token`, `expires_at`, `athlete_id`, `athlete_profile`, `stored_at`).
- `verifyWebhookSignature(payload, signature)`: HMAC SHA256 check using `STRAVA_WEBHOOK_SECRET`.

> Import example: `import { buildStravaAuthUrl } from '@/lib/strava/strava-service';`

## `@/lib/supabase-server.ts`
Exports the singleton `supabaseServiceRoleClient` (plus `getSupabaseServerClient()` helper) configured with the service-role key. Route handlers rely on this client for all writes/reads that bypass RLS.

> Import example: `import { supabaseServiceRoleClient } from '@/lib/supabase-server';`

## `@/lib/parsers/schedule-parser.ts`
Exports two helpers:
- `importScheduleForUser(client, userId)`: reads `coach/docs/schedule.json`, upserts a plan into `workout_plans`, and seeds running sessions without duplicates.
- `loadProgramProfile()`: returns the program name, athlete profile, and strength rules (used when crafting Gemini prompts).

Each helper consumes the same service-role Supabase client, so pass `supabaseServiceRoleClient` or `getSupabaseServerClient()`.

> Import example: `import { importScheduleForUser } from '@/lib/parsers/schedule-parser';`

## Usage guidance
- Keep these utilities server-only; they assume access to Supabase secrets that should never reach the browser.
- Schedule parser is idempotent—re-running it overwrites by deterministic `source_key`s.
- The Strava helpers already handle token refresh, so callers simply request `ensureFreshStravaTokens` before hitting Strava.
