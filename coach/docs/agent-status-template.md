# Agent Status Update Template

**Copy this template and fill it out when you complete a milestone or need to report blockers.**

---

## Agent Status Report

**Agent**: [Agent 1: Data Architect | Agent 2: Integration Specialist | Agent 3: UI/UX Engineer | Agent 4: AI Experience Lead]

**Branch**: `feature/[your-branch-name]`

**Date/Time**: [timestamp]

**Status**: [✅ Complete | 🚧 In Progress | ⚠️ Blocked | 🔄 Waiting on Dependency]

---

### Completed Tasks

- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

### Files Created/Modified

```
- path/to/file1.ts (created/modified)
- path/to/file2.tsx (created/modified)
- path/to/file3.ts (created/modified)
```

### Key Deliverables Status

- [ ] Database migrations created and tested
- [ ] TypeScript types generated/defined
- [ ] API routes implemented
- [ ] Components built and tested
- [ ] Hooks implemented
- [ ] Tests written (if applicable)

### Dependencies Needed from Other Agents

- [ ] **From Agent X**: [specific type/interface/endpoint needed]
- [ ] **From Agent Y**: [specific component/hook needed]

### Blockers/Issues

- [ ] **Blocker 1**: [description] - **Unblocks**: [what this prevents]
- [ ] **Blocker 2**: [description] - **Unblocks**: [what this prevents]

### Testing Instructions

**How to test my changes:**

1. Switch to branch: `git switch feature/[your-branch-name]`
2. Install dependencies: `pnpm install`
3. Run migrations: `[command if applicable]`
4. Start dev server: `pnpm dev`
5. Test steps:
   - [ ] Step 1: [what to do]
   - [ ] Step 2: [what to check]
   - [ ] Step 3: [expected result]

### API Contracts / Interfaces Exposed

**For other agents to use:**

```typescript
// Example: Type definition
export interface WorkoutSession {
  id: string;
  // ... fields
}

// Example: Hook signature
export function useWorkoutSessions() {
  // Returns: { data, isLoading, error, refetch }
}

// Example: API route
POST /api/workouts/sessions
Body: { workoutPlanId: string, ... }
Response: { session: WorkoutSession }
```

### Next Steps

- [ ] Next task 1
- [ ] Next task 2
- [ ] Next task 3

### Notes

[Any additional context, decisions made, or things other agents should know]

---

## Quick Status Format (for daily check-ins)

**Agent**: [Name] | **Branch**: `feature/[branch]` | **Status**: [Complete/In Progress/Blocked]

**Done**: [brief list]
**Blocked on**: [if any]
**Ready for**: [which agent can start using your work]
