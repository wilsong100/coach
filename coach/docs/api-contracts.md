# API Contracts (Integration / AI)

This document records API contracts exposed by Agent 2 for Agents 3–4 to consume.

## Status

- As of Feb 20, 2026, Agent 2 reported completion, but the `feature/integration-specialist` branch does not yet contain the referenced route files in this repo. Treat contracts below as **unverified** until Agent 2 pushes commits and we review them.

## Reported endpoints (unverified)

### Strava

- `GET /api/strava/auth?user_id=<uuid>`
  - Expected: redirects to Strava OAuth with `state` encoding the `user_id`.
- `GET /api/strava/callback?code=...&state=...`
  - Expected: exchanges code, stores tokens under `public.users.athlete_profile.strava`.
- `POST /api/strava/sync`
  - Body: `{ "user_id": "<uuid>", "after"?: "<timestamp|id>" }` (per report)
  - Expected: fetch + upsert activities into `public.strava_activities`.
- `POST /api/strava/webhook`
  - Expected: handles Strava webhook payloads (signature validation TBD).

### Reports (Gemini)

- `POST /api/reports/generate`
  - Body: `{ "user_id": "<uuid>" }`
  - Expected: aggregates last 7 days, generates markdown-like summary, persists into `public.weekly_reports`.

## Shared data dependencies

- Schema: `coach/docs/database-schema.md` (tables: `public.strava_activities`, `public.weekly_reports`, `public.users.athlete_profile`)

