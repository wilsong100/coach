# API Contracts (Integration / AI)

This document describes every route under `coach/src/app/api` that Agent 2 built so Agents 3/4 can integrate UI and chat tooling with Strava + Gemini.

## Shared authentication and token storage
- All routes use the server-only Supabase client from `lib/supabase-server.ts`, which reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY`). No browser code should reuse those keys.
- **Strava tokens** live inside `public.users.athlete_profile.strava` (a JSONB object). The fields are:
  - `access_token`, `refresh_token`, `expires_at`, `athlete_id`, `athlete_profile`, `stored_at`
  - The helper `lib/strava/strava-service.ts` keeps this blob fresh via `persistStravaTokens`/`ensureFreshStravaTokens`.
- Strava webhook signatures are verified with `STRAVA_WEBHOOK_SECRET` (HMAC SHA256). If the signature is missing/invalid, the route returns **401**.
- `POST /api/strava/sync` and `/api/reports/generate` expect an authenticated `user_id`; either send it in the JSON body or via the `x-user-id` header so that the service-role client knows which profile to read.

## Strava OAuth endpoints

### `GET /api/strava/auth?user_id=<uuid>`
- **Purpose**: Redirect the user to Strava's OAuth consent screen so the app can obtain tokens.
- **Headers**: none; this is safe to call from the browser.
- **Query**: `user_id` (required) → base64-encoded into the `state` parameter so the callback knows which Supabase user to update.
- **Response**: 302 redirect to `https://www.strava.com/oauth/authorize` with `client_id`, `scope`, `state`, etc.
- **Failure**: 400 when `user_id` is missing, 500 when environment variables are not set.

### `GET /api/strava/callback?code=...&state=...`
- **Purpose**: Exchange the authorization `code` for Strava tokens and persist them in `users.athlete_profile.strava`.
- **Headers**: none.
- **Behavior**: decodes `state` back to `user_id`, calls Strava `/oauth/token`, stores tokens with `persistStravaTokens`, then redirects to `/` with `?source=strava`.
- **User-visible result**: redirects the browser back to the app. Programmatic callers should watch for the redirect.
- **Failure modes**: 400 when `code`/`state` missing or state corrupt, 500 when Strava rejects the code or Supabase update fails.

## Strava data syncing

### `POST /api/strava/sync`
- **Purpose**: Manual sync endpoint that pulls activities from Strava and upserts them into `public.strava_activities`.
- **Authentication**: requires a Supabase user ID and the service-role client; tokens must exist at `users.athlete_profile.strava`. Missing tokens result in a 500 error with `Connect Strava before syncing activities`.
- **Headers**:
  - `x-user-id` (optional if `user_id` is included in body)
- **Body** (`application/json`):
  ```json
  {
    "user_id": "a1b2c3d4-...",
    "after": 1700000000
  }
  ```
  - `user_id` or `x-user-id` is required; `after` filters Strava activities (UNIX seconds). If omitted, the route bases `after` on the latest `start_time` stored in `strava_activities` to avoid duplicates.
- **Response** (200):
  ```json
  {
    "synced": 6,
    "rateLimit": {
      "userUsage": 5,
      "userLimit": 600,
      "appUsage": 25,
      "appLimit": 600
    },
    "lastSynced": "2026-02-19T18:11:00Z"
  }
  ```
- **Rate-limit behavior**: When the app-wide rate limit is hit, the route returns **429** with the same body so callers know to back off. The service fetches at most 3 pages per request; hitting 600 requests per 15 minutes (Strava's documented ceiling per app) will stop further pages and send 429.
- **Other failure modes**: 400 missing user ID, 500 when Strava returns an error or Supabase upsert fails.

### `POST /api/strava/webhook`
- **Purpose**: Handles Strava webhook events (`activity`, `create`, `update`). If `.env` has `STRAVA_WEBHOOK_SECRET`, the route validates `x-strava-signature` before processing.
- **Headers**:
  - `x-strava-signature`: mandatory when hook secret is set; otherwise the request is rejected with 401.
- **Body** (JSON sample):
  ```json
  {
    "object_type": "activity",
    "object_id": 1234567890,
    "owner_id": 987654,
    "aspect_type": "create",
    "updates": {
      "title": "Morning Run"
    }
  }
  ```
- **Behavior**: Locates the user via `users.athlete_profile->strava->>athlete_id`, ensures the stored tokens are fresh, refetches recent activities, and upserts them.
- **Response**: `200` JSON `{ "received": true }` on success or `{ "error": "<message>" }` if verification fails.
- **Failure modes**: 401 invalid signature, 400 missing `owner_id`, 500 when user lookup or Strava fetch fails.

### `POST /api/strava/manual`
- **Purpose**: Records a manual run entry (distance + optional pace) and returns the refreshed list of runs so the UI can update without a reload.
- **Authentication**: Requires the Supabase service-role key because it inserts rows into `public.strava_activities`.
- **Headers**:
  - `x-user-id` (optional if `user_id` is included in the JSON body)
- **Body**:
  ```json
  {
    "user_id": "a1b2c3d4-...",
    "date": "2026-02-20",
    "distance_km": 5.2,
    "pace": "5:00",
    "notes": "Morning tempo"
  }
  ```
- **Response** (200):
  ```json
  {
    "activities": [
      {
        "strava_id": 1700000000000,
        "activity_type": "Manual Run",
        "distance_meters": 5200,
        ...
      }
    ]
  }
  ```
  The array mirrors what `useStravaActivities` expects (all columns from `strava_activities`), so the client can replace or refetch immediately.
- **Failure modes**: 400 missing/invalid payload, 500 if the Supabase insert fails, 500 when the service-role client is unavailable (clear error message logged).

## Gemini report generation

### `POST /api/reports/generate`
- **Purpose**: Aggregates the last 7 days of gym sessions, planned runs, and Strava activities; sends a prompt to Gemini and stores a weekly report row in `public.weekly_reports`.
- **Headers**: `x-user-id` optional if `user_id` in body.
- **Body**:
  ```json
  {
    "user_id": "a1b2c3d4-..."
  }
  ```
- **Response** (200)
  ```json
  {
    "report": {
      "id": "...",
      "user_id": "a1b2c3d4-...",
      "week_start": "2026-02-14",
      "metrics": { ... }
    },
    "text": "Gemini's summary text..."
  }
  ```
  The `metrics` object includes `gym`, `runs`, and `range`. `content` mirrors the prompt data.
- **Failure modes**: 400 missing `user_id`, 500 when Gemini API returns an error (the response bubbles up the provider message), or Supabase upsert fails.

## Notes for downstream agents
- Always call these routes from server-side environments (Edge Functions, API routes, or server actions) to keep the Supabase service-role key private.
- Handle 429 from `/api/strava/sync` gracefully (retry after a pause); the route includes `rateLimit` metadata so you can surface pacing to the user.
- When consuming `/api/reports/generate`, treat the returned `text` as markdown/paragraphs; it already includes sections for strength, running, plan comparison, and adjustments.
