# How to Get Agents to Report Status

## The Problem
Codex agents in separate chat windows don't automatically know when to report status. You need to **explicitly ask them** to do so.

## Solution: Two Approaches

### Approach 1: Build Status Reporting Into Initial Prompt (Recommended)

**Use the updated prompts** from `coach/docs/agent-prompts-with-status.md` instead of the original prompts. These include explicit instructions that tell agents to report status at specific milestones.

**How it works:**
- The prompts include a "STATUS REPORTING (REQUIRED)" section
- Agents are instructed to report when they complete tasks, hit blockers, or finish deliverables
- They're told exactly how to use the template

**When you start an agent:**
1. Copy the entire prompt from `agent-prompts-with-status.md`
2. Paste it into the agent's Codex chat window
3. The agent will now know to report status automatically

---

### Approach 2: Manually Request Status Updates

If you're using the original prompts, you can manually request status updates:

**In each agent's chat window, type:**

```
Please report your current status using the template from coach/docs/agent-status-template.md

Read the template file, copy it, fill it out with your current progress, and paste it back here.
```

**Or use the quick format:**

```
Give me a quick status update:
- What have you completed?
- What are you working on now?
- Are you blocked on anything?
- What can other agents start using from your work?
```

---

## Practical Workflow

### Step 1: Start Agents with Updated Prompts
1. Open Agent 1's Codex chat window
2. Copy the Agent 1 prompt from `agent-prompts-with-status.md`
3. Paste it into the chat
4. Repeat for Agent 2

### Step 2: Monitor Progress
- Agents should automatically report when they hit milestones
- If they don't, use Approach 2 to request updates

### Step 3: Update Master Checklist
- When an agent posts a status update, copy it
- Update `master-coordination-checklist.md` with their progress
- Note any blockers or dependencies

### Step 4: Unblock Agents
- If Agent 2 is blocked waiting for Agent 1's schema:
  - Check Agent 1's status
  - If Agent 1 is done, merge their branch
  - Tell Agent 2: "Agent 1's work is merged. Pull latest main and continue."

---

## Example: What to Say to Agents

### When Starting an Agent:
```
[Paste the full prompt from agent-prompts-with-status.md]
```

### When Checking Status:
```
Please provide a status update. Use the template from coach/docs/agent-status-template.md or give me a quick summary:
- What's done?
- What's in progress?
- Any blockers?
```

### When Agent Completes a Task:
```
Great! Now please report your status using the template so I can update the master checklist.
```

### When Agent Hits a Blocker:
```
I see you're blocked. Please fill out the status template and mark what you're blocked on. I'll check with the other agent.
```

---

## Pro Tips

1. **Set Expectations Early**: When you first start an agent, say:
   ```
   Remember: you must report status when you complete major tasks or hit blockers. 
   Use the template from coach/docs/agent-status-template.md
   ```

2. **Use Quick Status for Daily Check-ins**: For frequent updates, ask for the quick format instead of the full template:
   ```
   Give me a quick status update (not the full template).
   ```

3. **Create a Status Channel**: Consider creating a shared document or using a simple format where agents can "post" status updates that you can easily copy to the master checklist.

4. **Be Explicit**: Don't assume agents will remember to report. Explicitly ask:
   ```
   Before you finish, please report your status using the template.
   ```

---

## Troubleshooting

**Q: Agent isn't reporting status automatically**
- A: They may not have the updated prompt. Give them explicit instructions:
  ```
  Please read coach/docs/agent-status-template.md and report your current status.
  ```

**Q: Agent reports status but it's not detailed enough**
- A: Ask them to use the full template:
  ```
  Please use the full template from agent-status-template.md, not just a quick summary.
  ```

**Q: I want status updates more frequently**
- A: Set a schedule:
  ```
  Please report status every time you complete a task, and also at the end of each day.
  ```

---

## Quick Command Reference

**To request status:**
```
Report your status using coach/docs/agent-status-template.md
```

**To request quick status:**
```
Give me a quick status update: what's done, what's in progress, any blockers?
```

**To remind agent about status reporting:**
```
Remember: you must report status when you complete major tasks or hit blockers.
```
