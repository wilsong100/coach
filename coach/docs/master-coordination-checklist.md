# Master Coordination Checklist

**Use this in your Master Coordinator Codex chat window to track all agents' progress.**

---

## Agent Status Overview

### Agent 1: Data Architect (`feature/data-architect`)
- [x] **Started**: Feb 20, 2026 12:56 GMT
- [x] **Branch created**: `git switch feature/data-architect`
- [x] **Database migrations**: Complete (pending commit/push verification)
- [x] **TypeScript types**: Complete (pending commit/push verification)
- [x] **TanStack Query hooks**: Complete
- [x] **Query client setup**: Complete
- [x] **Status**: ✅ Ready for merge
- [x] **Last update**: Feb 21, 2026 17:11 GMT

**Key deliverables for other agents:**
- [x] `types/supabase.ts` - Generated Supabase types
- [x] `types/workout.ts` - Workout domain types
- [x] `types/run.ts` - Running domain types
- [x] `types/report.ts` - Report domain types
- [x] `hooks/use-workout-plans.ts` - Hook available
- [x] `hooks/use-workout-sessions.ts` - Hook available
- [x] `hooks/use-running-sessions.ts` - Hook available
- [x] `hooks/use-strava-activities.ts` - Hook available
- [x] `hooks/use-weekly-reports.ts` - Hook available

**Dependencies exposed:**
- Database schema (migrations)
- Type definitions
- Query hooks

---

### Agent 2: Integration Specialist (`feature/integration-specialist`)
- [x] **Started**: Feb 20, 2026 13:12 UTC (per agent report)
- [x] **Branch created**: `git switch feature/integration-specialist`
- [x] **Strava OAuth**: Complete (pending commit/push verification)
- [x] **Strava sync**: Complete (pending commit/push verification)
- [x] **Schedule parser**: Complete (pending commit/push verification)
- [x] **Gemini report engine**: Complete (pending commit/push verification)
- [x] **Status**: ⚠️ Blocked (reported complete; no commits visible on branch yet)
- [x] **Last update**: Feb 20, 2026 13:12 UTC

**Key deliverables for other agents:**
- [ ] `app/api/strava/auth/route.ts` - OAuth initiation
- [ ] `app/api/strava/callback/route.ts` - OAuth callback
- [ ] `app/api/strava/sync/route.ts` - Manual sync endpoint
- [ ] `app/api/reports/generate/route.ts` - Report generation
- [ ] `lib/parsers/schedule-parser.ts` - Schedule parser

**Dependencies needed:**
- [ ] From Agent 1: Database schema + types
- [ ] From Agent 1: `strava_activities` table
- [ ] From Agent 1: `weekly_reports` table

**Dependencies exposed:**
- API routes for Strava integration
- API route for report generation
- Schedule parser utility

---

### Agent 3: UI/UX Engineer (`feature/ui-engineer`)
- [ ] **Started**: [Date/Time]
- [ ] **Branch created**: `git switch feature/ui-engineer`
- [ ] **Dashboard**: Complete
- [ ] **Charts**: Complete
- [ ] **Workout logger**: Complete
- [ ] **Running view**: Complete
- [ ] **Onboarding**: Complete
- [ ] **Status**: [✅ Ready for merge | 🚧 In progress | ⚠️ Blocked]
- [ ] **Last update**: [Date/Time]

**Key deliverables for other agents:**
- [ ] `app/(dashboard)/dashboard/page.tsx` - Main dashboard
- [ ] `components/dashboard/pace-chart.tsx` - Pace chart
- [ ] `components/dashboard/volume-chart.tsx` - Volume chart
- [ ] `components/workout/exercise-card.tsx` - Exercise card
- [ ] `app/(dashboard)/runs/page.tsx` - Running view

**Dependencies needed:**
- [ ] From Agent 1: All TanStack Query hooks
- [ ] From Agent 1: Type definitions
- [ ] From Agent 2: Strava sync API endpoint
- [ ] From Agent 2: Report generation API endpoint

**Dependencies exposed:**
- UI components
- Dashboard pages
- Chart components

---

### Agent 4: AI Experience Lead (`feature/ai-experience`)
- [ ] **Started**: [Date/Time]
- [ ] **Branch created**: `git switch feature/ai-experience`
- [ ] **Chat API**: Complete
- [ ] **Chat UI**: Complete
- [ ] **AI Tools**: Complete
- [ ] **System prompts**: Complete
- [ ] **Chat persistence**: Complete
- [ ] **Status**: [✅ Ready for merge | 🚧 In progress | ⚠️ Blocked]
- [ ] **Last update**: [Date/Time]

**Key deliverables for other agents:**
- [ ] `app/api/chat/route.ts` - Chat API endpoint
- [ ] `components/chat/chat-interface.tsx` - Chat UI
- [ ] `lib/ai/tools/*.ts` - AI tools

**Dependencies needed:**
- [ ] From Agent 1: Query hooks for data access
- [ ] From Agent 1: Type definitions
- [ ] From Agent 2: Report generation (for context)
- [ ] From Agent 3: Dashboard integration points

**Dependencies exposed:**
- Chat API endpoint
- Chat UI components
- AI tools/functions

---

## Merge Sequence & Coordination

### Phase 1: Foundation (Agents 1 & 2)
- [ ] **Agent 1 completes** → Merge `feature/data-architect` to `main`
- [ ] **Agent 2 pulls latest main** → Rebase/merge conflicts resolved
- [ ] **Agent 2 completes** → Merge `feature/integration-specialist` to `main`

### Phase 2: UI Layer (Agent 3)
- [ ] **Agent 3 pulls latest main** → Has all foundation code
- [ ] **Agent 3 completes** → Merge `feature/ui-engineer` to `main`

### Phase 3: AI Layer (Agent 4)
- [ ] **Agent 4 pulls latest main** → Has all foundation + UI code
- [ ] **Agent 4 completes** → Merge `feature/ai-experience` to `main`

---

## Shared Contracts & Interfaces

### Database Schema (Agent 1)
- [x] Schema documented in `docs/database-schema.md`
- [ ] Migration files reviewed
- [ ] RLS policies verified

### API Contracts (Agent 2)
- [x] Strava API routes documented (unverified; see `docs/api-contracts.md`)
- [x] Report generation API documented (unverified; see `docs/api-contracts.md`)
- [ ] Request/response types defined

### Component Contracts (Agent 3)
- [ ] Component props interfaces defined
- [ ] Hook usage patterns documented

### AI Tool Contracts (Agent 4)
- [ ] Tool function signatures documented
- [ ] Tool return types defined

---

## Blockers & Resolution

### Current Blockers
1. **Agent 2**: Work appears staged locally but not committed/pushed to `feature/integration-specialist` - **Waiting for**: `git commit` + `git push` + paste `git show --name-only --oneline HEAD`

### Resolved Blockers
- [x] Feb 20, 2026 - Agent 1 fixed `public.users` RLS policy to use `id = auth.uid()`
- [x] Feb 20, 2026 - Agent 1 added `public.ensure_user_profile` trigger on `auth.users` to keep `public.users` in sync for RLS/current_profile_id()
- [x] Feb 20, 2026 - Agent 1 placed migration in `coach/supabase/migrations/0001_data_architect.sql` (confirm canonical Supabase directory; avoid duplicate root `supabase/` copy)
- [x] Feb 21, 2026 - Agent 1 reran `pnpm install` after transient `registry.npmjs.org` ENOTFOUND errors; dependencies (including `@tanstack/react-query-devtools`) now install successfully

---

## Testing Checklist

### Agent 1 Deliverables
- [ ] Migrations run successfully
- [ ] Types compile without errors
- [ ] Hooks return correct data shape
- [ ] Query client configured correctly

### Agent 2 Deliverables
- [ ] Strava OAuth flow works end-to-end
- [ ] Strava sync endpoint works
- [ ] Schedule parser creates correct DB records
- [ ] Report generation creates valid reports

### Agent 3 Deliverables
- [ ] Dashboard renders correctly
- [ ] Charts display data (or empty states)
- [ ] Workout logger saves data
- [ ] Running view displays Strava data
- [ ] Mobile responsive

### Agent 4 Deliverables
- [ ] Chat UI renders
- [ ] Streaming works
- [ ] Tools execute correctly
- [ ] Chat history persists
- [ ] System prompt provides good responses

---

## Daily Standup Template

**Date**: [Date]

**Agent 1**: [Status] - [What done] - [Blockers]
**Agent 2**: [Status] - [What done] - [Blockers]
**Agent 3**: [Status] - [What done] - [Blockers]
**Agent 4**: [Status] - [What done] - [Blockers]

**Coordination needed**: [Any cross-agent issues]
