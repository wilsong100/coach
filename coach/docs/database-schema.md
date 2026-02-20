# Database Schema (Agent 1)

Canonical migration: `coach/supabase/migrations/0001_data_architect.sql`.

## Conventions

- All domain tables include: `id` (uuid PK), `created_at`, `updated_at` (+ `public.set_timestamp()` trigger).
- RLS is enabled on all public tables.
  - `public.users`: `id = auth.uid()`
  - Most other tables: `user_id = public.current_profile_id()`

## Auth-aligned profile

### `public.users`

Profile table aligned 1:1 with `auth.users` (same `id`).

Auto-provisioning:

- Trigger: `ensure_user_profile` (AFTER INSERT on `auth.users`)
- Function: `public.ensure_user_profile()` inserts a companion `public.users` row on signup (no-op if it already exists).

Helper used by RLS:

- `public.current_profile_id()` → returns `public.users.id` for the active `auth.uid()`.

## Training plan + logging

### `public.workout_plans`

- `user_id` → `public.users.id`
- `program_name`, `phase`, `start_date`, `end_date`
- `schedule` (jsonb): raw schedule/plan payload (from `coach/docs/schedule.json` parsing)
- `progress` (jsonb), `metadata` (jsonb), `is_active`

### `public.workout_sessions`

- `user_id`, optional `workout_plan_id`
- `week`, `day`, `scheduled_date`, `activity`, `focus`
- `session_type` (default `strength`)
- `status`: `planned | completed | skipped`
- `performance` (jsonb) for computed/summary stats

### `public.exercises`

- `user_id`, `name`, `primary_focus`, `movement_pattern`, `muscle_group`, `equipment`
- `defaults` (jsonb), `is_active`

### `public.exercise_sets`

- `exercise_id`, `workout_session_id`, `user_id`
- `set_number`
- targets/actuals: reps + weight, plus `rest_seconds`, `tempo`, `notes`

### `public.running_sessions` (planned)

- `user_id`, optional `workout_plan_id`
- `week`, `day`, `run_type`, `scheduled_date`
- targets: `target_distance_km`, `target_pace`, `details`
- `status`: `upcoming | completed | missed`
- actuals: `actual_distance_km`, `actual_duration_minutes`
- `route` (jsonb)

## Strava integration

### `public.strava_activities`

Primary keys/uniqueness:

- `id` (uuid PK)
- `strava_id` (bigint) with unique index on `(user_id, strava_id)`

Useful columns for Agent 2:

- `user_id` (profile owner)
- optional `running_session_id` linkage
- `activity_type`, `distance_meters`, `duration_seconds`, `start_time`
- heart rate fields + `pace` (jsonb)
- `raw` (jsonb): full Strava payload
- `synced_at`

## AI reports

### `public.weekly_reports`

- `user_id`, optional `workout_plan_id`
- `week_start`, `week_end` with unique index on `(user_id, week_start)`
- `report_type` (default `weekly`)
- `summary` (text)
- `content` (jsonb), `metrics` (jsonb)
- `generated_by` (text)
- `status`: `draft | generated | sent`

## Notes / Coordination

- Please treat `coach/supabase/` as the canonical Supabase directory; if an older duplicate migration exists at repo root `supabase/`, remove or clearly deprecate it to avoid agents running the wrong migration set.

