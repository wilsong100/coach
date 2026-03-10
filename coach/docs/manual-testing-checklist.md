## Manual Testing Checklist – Atlas AI (Agents 1–3)

Use this file while testing the deployed app (local and Vercel). Check items off as you verify behaviour.

---

### Environment & Data Setup

- [ ] **Env vars configured (local)**: `.env.local` has valid Supabase, Strava, and Gemini keys.
- [ ] **Env vars configured (Vercel)**: `NEXT_PUBLIC_SITE_URL`, `STRAVA_CLIENT_ID`, and `STRAVA_CLIENT_SECRET` set for the deployed environment.
- [ ] **Database migrations run**: Supabase migration `0001_data_architect.sql` has been applied and all tables exist.
- [ ] **Schedule imported**: `schedule.json` has been imported via the schedule import API or onboarding flow.
- [ ] **Strava connected (current domain)**: Strava OAuth flow completes successfully for the current domain and tokens are stored.
- [ ] **Test data present**: At least one gym workout session and one Strava run exist for the current user.

> Note: Nightly Strava sync and weekly report cron/edge jobs are **not** required for these tests; use manual sync and manual report generation instead.

---

### Root App Shell – `/` (`src/app/page.tsx`)

- [ ] **Unauthenticated redirect**: Visiting `/` while logged out routes to login or onboarding as designed. (NO it just goes to the Next.js default vercel page with deploy now and documentation buttons)
- [ ] **Authenticated redirect**: Visiting `/` while logged in routes to `/dashboard`. (NO it just goes to the Next.js default vercel page with deploy now and documentation buttons)
- [x] **Navigation**: Global navigation links (if present) correctly reach login, onboarding, and dashboard.

---

### Auth Pages – `/login` and `/register`

- [x] **Login success**: Valid credentials log the user in and redirect to `/dashboard`.
- [x] **Login failure**: Invalid credentials show a clear error and do not log the user in.
- [x] **Register success**: New user registration succeeds and redirects into onboarding or dashboard.
- [x] **Auth state persistence**: Refreshing the page while logged in keeps the session active.
- [ ] **Logout flow**: Logging out returns the user to a logged-out state and protects dashboard routes. (Cant find a logout button)

---

### Onboarding – `/onboarding`

- [x] **Page loads for new user**: A new/empty account is routed to `/onboarding` or can reach it via a link.
- [x] **Schedule import UI**: There is a clear action to import or load the 12‑week `schedule.json` plan.
 - [ ] **Schedule import success**: Import completes without error and creates workout and running sessions in the DB. (if `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY` is missing the route now surfaces a clear error telling you exactly which key to set; the onboarding screen should also capture a `start_date` so you know when the 12-week block begins)
- [x] **Strava connect button**: A “Connect Strava” or similar button kicks off OAuth to Strava.
 - [ ] **Strava OAuth round trip**: Approving in Strava redirects back to `/api/strava/callback` and then to the app without error. (The route now re-reads `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET` on each request, so if the app returns the same "Invalid API key" message make sure your `.env.local` values match the Strava dashboard exactly and restart `pnpm dev`.)
- [ ] **Post-onboarding redirect**: After completing onboarding steps, user can reach `/dashboard` normally. (No, cant complete the onboarding yet)

---

### Dashboard – `/dashboard` (`src/app/(dashboard)/dashboard/page.tsx`)

#### Next Up card
- [ ] **Planned session shown**: When at least one planned workout exists, the “Next Up” card shows the closest upcoming session (date, focus, duration). (Cant test this yet as there are no upcoming workouts)
- [x] **Empty state**: With no planned workouts, an appropriate empty message is shown.

#### Weekly summary
- [ ] **Planned minutes**: Planned minutes reflect workouts scheduled over the last 7 days. (Not able to test, no workouts loaded from schedule)
- [ ] **Actual minutes**: Actual minutes update after logging completed sessions. (Not able to test, no workouts loaded from schedule)
- [ ] **Sessions count**: Completed vs total sessions count is correct for the last 7 days. (Not able to test, no workouts loaded from schedule)

#### Latest report preview
- [x] **No report state**: With no weekly reports, the card shows a clear “no reports yet” message.
- [ ] **Report present**: After generating a report, the card shows the latest week, status, and a truncated summary. (Not able to test, as the AI element has not been created yet)

#### Readiness stats
- [x] **With Strava data**: When Strava activities exist, readiness shows a numeric percentage. (Not able to test, no workouts loaded from schedule)
- [x] **Without Strava data**: With no activities, readiness shows a sensible placeholder (e.g. “—”) without crashing. (Not able to test, no workouts loaded from schedule)

#### Quick actions & layout
- [x] **Quick action – runs**: “Review Strava runs” navigates to `/dashboard/runs`.
- [x] **Quick action – workout**: “Track today’s workout” navigates to `/dashboard/workout/next` or the appropriate session page.
- [x] **Quick action – import**: “Import schedule” navigates to `/onboarding`.
- [x] **Responsive layout**: Dashboard layout looks correct on mobile, tablet, and desktop breakpoints. (responsive but issues with text being black within buttons)

---

### Runs Page – `/dashboard/runs` (`src/app/(dashboard)/dashboard/runs/page.tsx`)

- [x] **Activities list**: Strava activities are listed with date, name, distance, pace, and (if available) heart rate.
- [x] **Ordering**: Activities are ordered from most recent to oldest.
 - [ ] **Manual entry**: Manual run entry form works and newly entered runs appear in the list. (Entries now hit `/api/strava/manual`, which persists the run and returns the latest list before `useStravaActivities` refetches.)
- [ ] **Manual entry persistence**: Manually entered runs are still present after a page reload. (unable to test)
- [x] **Sync Strava**: “Sync Strava” (or equivalent) triggers `/api/strava/sync` and new Strava runs appear afterward. (we get a 500 error for sync with {"error":"Invalid API key"} )
- [ ] **Error handling**: If Strava sync fails (rate limit or auth), the user sees a clear error message and the page does not break.

---

### Workout Session Page – `/dashboard/workout/[sessionId]`

- [ ] **Session loads**: Navigating to a specific session ID loads the correct workout for that day. (we get a Workout not found title with a back to dashboard button)
- [ ] **Planned sets displayed**: Each exercise shows planned sets, reps, and target weights from the imported plan. (No workouts appearing)
- [ ] **Editing reps/weights**: Editing actual reps and weights is possible for each set. (No workouts appearing)
- [ ] **Saving behaviour**: Changes are saved (auto‑save or explicit save button) and persist after reload. (No workouts appearing)
- [ ] **Volume calculations**: Any displayed volume totals reflect the actual (or target) reps × weight per set. (No workouts appearing)
- [ ] **Shoulder-safe indicators**: If shoulder‑safe flags are implemented, risky exercises are highlighted or labelled correctly. (No workouts appearing)

---

### Reports – (e.g. `/reports` and `/api/reports/generate`)

- [ ] **Trigger report**: There is a way to trigger weekly report generation, either via a button or via a specific route. (Not implemented yet)
- [ ] **Report generation succeeds**: Calling the report generation endpoint creates a new `weekly_reports` record without server error. (Not implemented yet)
- [ ] **Report content**: The generated report includes sections for running progress, strength training, and an overall summary. (Not implemented yet)
- [ ] **Dashboard preview**: The latest report appears in the Dashboard “Latest report preview” card. (Not implemented yet)
- [ ] **Historical reports**: If a list view exists, multiple reports are listed in date order. (Not implemented yet)

---

### General Behaviour

- [ ] **Protected routes**: `/dashboard` and other dashboard routes are not accessible when logged out. (not protected)
- [ ] **Error states**: API or network errors on dashboard, runs, or workout pages are surfaced as user‑friendly messages (not blank screens).
- [ ] **Loading states**: Long‑running queries show loading indicators instead of empty or misleading content.
