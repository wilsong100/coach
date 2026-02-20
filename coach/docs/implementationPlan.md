# AI Personal Training Coach - Multi-Agent Implementation Plan

## Overview

This plan outlines how to build an AI Personal Training Coach application using 4 Codex agents running in parallel within Cursor. The app will track gym workouts and running progress (via Strava API), use AI for weekly progress reports, and provide a conversational coaching interface.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI, TanStack Charts
- **State Management**: TanStack Query (server state), TanStack AI (chatbot)
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **APIs**: Strava API, Gemini Pro API
- **Package Manager**: pnpm

## Prerequisites & Setup

### 1. Codex Rules Setup (.cursor/rules/)

Create the following rule files to guide all agents:

#### `.cursor/rules/project-structure.mdc`

```
# Project Structure Rules

- Use Next.js 16 App Router convention (app/ directory)
- All components in `components/` directory
- Shared utilities in `lib/` directory
- Type definitions in `types/` directory
- Database migrations in `supabase/migrations/`
- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Use pnpm for all package management
```

#### `.cursor/rules/api-secrets.mdc`

```
# API Secrets Management

- NEVER hardcode API keys or secrets in source code
- ALWAYS reference environment variables from .env.local
- Use NEXT_PUBLIC_ prefix only for client-side safe variables
- Server-side secrets (SUPABASE_SERVICE_ROLE_KEY, STRAVA_CLIENT_SECRET, GEMINI_API_KEY) must NEVER use NEXT_PUBLIC_ prefix
- If an API call fails due to missing key, notify user but do not attempt to create placeholder values
- Document required env vars in README.md
```

#### `.cursor/rules/tanstack-patterns.mdc`

```
# TanStack Query & AI Patterns

- Use TanStack Query for ALL server state management (no useState for server data)
- Create custom hooks in `hooks/` directory following pattern: `use[Resource]Query`, `use[Resource]Mutation`
- Use TanStack AI for chatbot functionality, not for data fetching
- Implement proper error handling and loading states in all Query hooks
- Use React Query DevTools in development
- Cache invalidation should be explicit and intentional
```

#### `.cursor/rules/database-schema.mdc`

```
# Database Schema Guidelines

- All tables must have: id (uuid, primary key), created_at (timestamp), updated_at (timestamp)
- Use Row Level Security (RLS) for all tables - users can only access their own data
- Foreign keys should be properly indexed
- Use Supabase TypeScript types generator: `supabase gen types typescript`
- Reference schedule.json structure for workout/run data models
```

### 2. Environment Variables (.env.local)

Your `.env.local` file should contain (already partially configured):

```bash
# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Strava API
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REFRESH_TOKEN=

# Gemini API
GEMINI_API_KEY=
```

### 3. Required Documentation References

Create a `docs/references.md file`with reference documentation:

#### `nextjs-reference.md`

- Link to: [https://nextjs.org/docs](https://nextjs.org/docs)
- Focus on: App Router, Server Actions, API Routes, Server Components

#### `tanstack-query-reference.md`

- Link to: [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- Focus on: Query hooks, mutations, cache management, infinite queries

#### `tanstack-ai-reference.md`

- Link to: [https://tanstack.com/ai/latest](https://tanstack.com/ai/latest)
- Focus on: Chat setup, streaming, tool calling, adapters

#### `strava-api-reference.md`

- Link to: [https://developers.strava.com/docs](https://developers.strava.com/docs)
- Focus on: OAuth flow, Activities API, Webhooks, Rate limits

#### `supabase-reference.md`

- Link to: [https://supabase.com/docs](https://supabase.com/docs)
- Focus on: Auth setup, RLS policies, Edge Functions, Database types

#### `shadcn-reference.md`

- Link to: [https://ui.shadcn.com/docs](https://ui.shadcn.com/docs)
- Focus on: Component installation, theming, customization

### 4. Schedule.json Structure Reference

The `coach/docs/schedule.json` file contains:

- 12-week program structure
- Weekly workout plans (Strength A/B/C)
- Running progression (speed intervals, tempo, long runs)
- Periodization phases
- Strength progression rules

**All agents must reference this file when creating workout templates and tracking logic.**

## 4-Agent Implementation Plan

### Agent 1: Data Architect

**Jurisdiction**: `supabase/`, `types/`, `lib/queries/`, `hooks/`

**Tasks**:

1. **Database Schema Setup**
  - Create Supabase migration files for:
    - `users` table (extends Supabase auth.users)
    - `workout_plans` table (stores parsed schedule.json data)
    - `workout_sessions` table (individual gym sessions)
    - `exercises` table (exercise library)
    - `exercise_sets` table (sets within a session)
    - `running_sessions` table (planned runs from schedule.json)
    - `strava_activities` table (synced Strava data)
    - `weekly_reports` table (Gemini-generated reports)
  - Set up Row Level Security (RLS) policies
  - Create indexes for performance
2. **TypeScript Types**
  - Generate Supabase types: `types/supabase.ts`
  - Create domain types: `types/workout.ts`, `types/run.ts`, `types/report.ts`
  - Ensure types align with schedule.json structure
3. **TanStack Query Hooks**
  - `hooks/use-workout-plans.ts` - Fetch workout plans
  - `hooks/use-workout-sessions.ts` - CRUD for sessions
  - `hooks/use-exercise-sets.ts` - Manage sets within sessions
  - `hooks/use-running-sessions.ts` - Fetch planned runs
  - `hooks/use-strava-activities.ts` - Fetch Strava data
  - `hooks/use-weekly-reports.ts` - Fetch AI reports
  - All hooks should include proper TypeScript types, error handling, and loading states
4. **Query Client Setup**
  - Create `lib/queries/query-client.ts` with QueryClient configuration
  - Set up React Query DevTools
  - Configure default options (staleTime, cacheTime)

**Deliverables**:

- Complete Supabase schema with migrations
- TypeScript type definitions
- Functional TanStack Query hooks
- Query client configuration

---

### Agent 2: Integration Specialist

**Jurisdiction**: `app/api/strava/`, `app/api/reports/`, `lib/strava/`, `lib/ai/`

**Tasks**:

1. **Strava OAuth Integration**
  - Create `/app/api/strava/auth/route.ts` - Initiate OAuth
  - Create `/app/api/strava/callback/route.ts` - Handle OAuth callback
  - Store refresh tokens securely in Supabase
  - Implement token refresh logic
2. **Strava Data Sync**
  - Create `/app/api/strava/sync/route.ts` - Manual sync endpoint
  - Create `/app/api/strava/webhook/route.ts` - Webhook handler (optional)
  - Implement activity fetching from Strava API
  - Map Strava activity data to `strava_activities` table
  - Handle rate limiting (Strava: 600 requests per 15 minutes)
3. **Schedule.json Parser**
  - Create `lib/parsers/schedule-parser.ts`
  - Parse `coach/docs/schedule.json` into database records
  - Create workout plan templates from weekly structure
  - Create running session templates from periodization phases
4. **Gemini Weekly Report Engine**
  - Create `lib/ai/gemini-client.ts` - Gemini API client
  - Create `app/api/reports/generate/route.ts` - Report generation endpoint
  - Implement data aggregation (last 7 days):
    - Gym sessions with volume, sets, reps
    - Running sessions with pace, distance, heart rate
    - Compare planned vs actual performance
  - Create prompt template that includes:
    - User goal from schedule.json
    - Injury context (shoulder-safe exercises)
    - Weekly data summary
    - Request for running progress report
    - Request for strength progress report
    - Request for general progress update
  - Store generated reports in `weekly_reports` table
5. **Scheduled Jobs**
  - Set up Supabase Edge Function or Vercel Cron for nightly Strava sync
  - Set up weekly report generation (e.g., Sunday evening)

**Deliverables**:

- Complete Strava OAuth flow
- Strava data sync functionality
- Schedule.json parser
- Gemini-powered weekly report generation
- Scheduled sync jobs

---

### Agent 3: UI/UX Engineer

**Jurisdiction**: `components/ui/`, `components/dashboard/`, `components/workout/`, `app/(dashboard)/`

**Tasks**:

1. **Project Setup**
  - Initialize Next.js 16 project with TypeScript
  - Configure Tailwind CSS
  - Install and configure ShadCN UI components
  - Install TanStack Charts
  - Set up project structure
2. **Dashboard Components**
  - Create `app/(dashboard)/dashboard/page.tsx` - Main dashboard
  - Build dashboard cards:
    - "Next Up" card showing today's planned workout/run
    - Weekly progress summary card
    - Latest weekly report preview
    - Readiness score/stats
  - Implement responsive grid layout
3. **Progress Charts**
  - Create `components/dashboard/pace-chart.tsx`:
    - Line chart comparing planned pace vs actual pace
    - Use TanStack Charts
    - Show data from last 30 days
    - Highlight target pace zones
  - Create `components/dashboard/volume-chart.tsx`:
    - Bar chart showing planned volume vs actual volume
    - Stacked bars for different exercise types
  - Create `components/dashboard/compliance-heatmap.tsx`:
    - GitHub-style contribution graph
    - Shows workout completion rate per day
4. **Workout Logger UI**
  - Create `app/(dashboard)/workout/[sessionId]/page.tsx` - Active workout page
  - Build `components/workout/exercise-card.tsx`:
    - Shows exercise name, planned sets/reps/weight
    - Input fields for actual weight and reps
    - Auto-save on blur
    - "Shoulder Safe" badge for flagged exercises
    - Last weight used suggestion
  - Create `components/workout/session-timer.tsx` - Workout timer
  - Implement mobile-first design (large tap targets, 44px minimum)
5. **Running Dashboard**
  - Create `app/(dashboard)/runs/page.tsx` - Running sessions view
  - Display Strava activities with:
    - Pace, distance, elevation, heart rate
    - Comparison to planned pace
    - Visual indicators (on target, faster, slower)
  - Manual run entry form
  - "Sync Strava" button
6. **Onboarding Flow**
  - Create `app/(onboarding)/page.tsx` - First-time user flow
  - Import schedule.json parser
  - Strava connection prompt
  - Initial setup wizard

**Deliverables**:

- Complete dashboard with charts
- Mobile-optimized workout logger
- Running sessions view
- Onboarding flow
- Responsive design throughout

---

### Agent 4: AI Experience Lead

**Jurisdiction**: `components/chat/`, `app/api/chat/`, `lib/ai/tools/`

**Tasks**:

1. **TanStack AI Chat Setup**
  - Create `app/api/chat/route.ts` - Chat API endpoint
  - Set up streaming responses
  - Configure Gemini adapter (or OpenAI if preferred)
  - Implement message history management
2. **Chat UI Components**
  - Create `components/chat/chat-interface.tsx` - Main chat component
  - Create `components/chat/message-bubble.tsx` - Message display
  - Create `components/chat/input-area.tsx` - Message input
  - Implement markdown rendering for AI responses
  - Add loading states and error handling
3. **AI Tools/Function Calling**
  - Create `lib/ai/tools/get-latest-runs.ts`:
    - Fetches user's latest running sessions
    - Returns formatted data for AI context
  - Create `lib/ai/tools/get-workout-stats.ts`:
    - Fetches gym workout statistics
    - Returns volume, PRs, progression data
  - Create `lib/ai/tools/get-weekly-report.ts`:
    - Fetches latest weekly report
    - Provides context to AI about user progress
  - Create `lib/ai/tools/update-injury-status.ts`:
    - Allows AI to update user injury preferences
  - Register all tools with TanStack AI
4. **AI Context & System Prompts**
  - Create `lib/ai/prompts/system-prompt.ts`:
    - Define AI coach personality
    - Include user goals from schedule.json
    - Also enable the user to enter new goals/ train for a race/ distance. The Chatbot will then create a workout plan/ running plan in the same format as schedule.json
    - Include injury context (shoulder-safe)
    - Set expectations for helpful, motivating responses
  - Implement context injection:
    - Current week in program
    - Recent workout performance
    - Upcoming planned sessions
5. **Chat Features**
  - Implement chat history persistence (Supabase)
  - Add ability to ask about:
    - "What's my workout tomorrow?"
    - "I want to do a marathon in 4 months, create me a running plan"
    - 
    - "How am I progressing toward my sub-20 5k goal?"
    - "Can I modify this exercise for my shoulder?"
    - "Show me my latest runs"
  - Add voice input support (optional)

**Deliverables**:

- Fully functional AI chatbot
- Tool calling for fitness data access
- Context-aware responses
- Chat history persistence
- Integration with dashboard

---

## Master Prompt for Codex

Use this prompt when launching all 4 agents. Each agent should receive their specific section:

```
You are building an AI Personal Training Coach application using Next.js 16, TypeScript, TanStack Query, TanStack AI, Supabase, and Strava API.

PROJECT CONTEXT:
- The app tracks gym workouts and running progress
- Uses schedule.json (located at coach/docs/schedule.json) as the 12-week training plan
- Integrates with Strava API for running data
- Uses Gemini Pro API for weekly progress reports
- Provides an AI chatbot for coaching conversations

TECH STACK:
- Next.js 16 (App Router), TypeScript, Tailwind CSS
- ShadCN UI components, TanStack Charts
- TanStack Query for server state
- TanStack AI for chatbot
- Supabase for database and auth
- pnpm for package management

ENVIRONMENT:
- All API keys are in .env.local - NEVER hardcode secrets
- Reference .cursor/rules/ for project conventions
- Use schedule.json structure for workout/run data models

YOUR ROLE: [AGENT-SPECIFIC ROLE FROM ABOVE]

YOUR JURISDICTION: [AGENT-SPECIFIC JURISDICTION]

YOUR TASKS: [AGENT-SPECIFIC TASKS]

CONSTRAINTS:
- Work only within your jurisdiction to avoid conflicts
- Use TypeScript strict mode
- Follow Next.js App Router conventions
- Implement proper error handling
- Write clean, maintainable code
- Add comments for complex logic
- Test your code before marking tasks complete

Begin by reviewing the existing codebase structure, then proceed with your assigned tasks.
```

---

## Additional Upfront Requirements

### 1. Project Initialization Checklist

Before agents begin:

- Initialize Next.js project: `pnpm create next-app@latest coach --typescript --tailwind --app`
- Install dependencies: ShadCN, TanStack Query, TanStack AI, TanStack Charts
- Set up Supabase project and get credentials
- Create Strava app and get OAuth credentials
- Get Gemini API key from Google AI Studio
- Initialize Git repository
- Create `.cursor/rules/` directory with rule files
- Create `docs/` directory with reference links

### 2. Git Branch Strategy

Each agent should work on a separate branch initially:

- `feature/data-architect` - Agent 1
- `feature/integration-specialist` - Agent 2
- `feature/ui-engineer` - Agent 3
- `feature/ai-experience` - Agent 4

Merge strategy: Merge in order (1 → 2 → 3 → 4) to handle dependencies.

### 3. Testing Strategy

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows (using Playwright or Cypress)
- Manual testing checklist for each agent's deliverables

### 4. Documentation Requirements

- README.md with setup instructions
- API documentation for all routes
- Component documentation (Storybook optional)
- Database schema documentation

### 5. Performance Considerations

- Implement pagination for large data sets
- Use React Server Components where possible
- Optimize images and assets
- Implement proper caching strategies
- Monitor API rate limits (especially Strava)

### 6. Security Checklist

- RLS policies on all Supabase tables
- Input validation on all forms
- API route authentication
- Secure token storage
- Environment variable validation
- XSS protection
- CSRF protection

---

## Execution Timeline

**Phase 1**: Agents 1 & 2 work in parallel (Data + Integrations)
**Phase 2**: Agent 3 builds UI on top of Agent 1's work
**Phase 3**: Agent 4 integrates AI chatbot, all agents refine
**Phase 4**: Integration testing, bug fixes, polish

---

## Success Criteria

- Users can log gym workouts with planned exercises
- Strava data syncs automatically and manually
- Weekly AI reports generate successfully
- Dashboard shows accurate progress charts
- AI chatbot can answer questions about workouts and progress
- All features work on mobile devices
- Application is performant and secure

---

## Notes

- Agents should communicate blockers early
- Use Cursor's chat threads for agent coordination
- Regular check-ins to ensure alignment
- Prioritize working features over perfect code
- Iterate based on testing feedback

