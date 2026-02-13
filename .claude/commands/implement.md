# Implementation Execution

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent**. Execute the task plan using specialized agents.

### Step 1: Load Context

1. Read `Jobnexai-spec/specs/<feature-name>/tasks.md` for the task list
2. Read `Jobnexai-spec/specs/<feature-name>/plan.md` for architecture
3. If exists, read `data-model.md` for database schema
4. If exists, read `contracts/` for API specifications

### Step 2: Check Checklists (if they exist)

If `Jobnexai-spec/specs/<feature-name>/checklists/` exists:

1. Scan all checklist files
2. Count total, completed `[X]`, and incomplete `[ ]` items
3. Display status table:

```
| Checklist      | Total | Done | Pending | Status |
|---------------|-------|------|---------|--------|
| ux.md         | 12    | 12   | 0       | PASS   |
| security.md   | 8     | 5    | 3       | FAIL   |
```

4. If any checklist has pending items, ASK the user before proceeding

### Step 3: Execute Tasks Phase by Phase

For each phase in `tasks.md`:

#### 3a. Identify Runnable Tasks
- Find tasks with no unresolved `blockedBy` dependencies
- Group parallelizable tasks (marked `[P]`) for concurrent execution

#### 3b. Delegate to Specialized Agents

For each task, activate the corresponding agent based on `[agent:TAG]`:

| Tag | Agent Activation | Key References |
|-----|-----------------|----------------|
| `agent:frontend` | Apply Frontend Agent rules from AGENTS.md | `src/components/`, Tailwind 3.4, i18n |
| `agent:backend` | Apply Backend Agent rules from AGENTS.md | `supabase/`, `netlify/`, migrations |
| `agent:ai-ml` | Apply AI/ML Agent rules from AGENTS.md | `src/lib/ai*`, AI functions |
| `agent:billing` | Apply Billing Agent rules from AGENTS.md | `src/lib/stripe*`, payment functions |
| `agent:testing` | Apply Testing Agent rules from AGENTS.md | `tests/`, `e2e/`, Jest, Playwright |
| `agent:devops` | Apply DevOps Agent rules from AGENTS.md | `.github/`, `infrastructure/` |
| `agent:n8n` | Apply n8n Agent rules from AGENTS.md | `n8n-workflows/`, MCP tools |
| `agent:security` | Apply Security Agent rules from AGENTS.md | Auth files, RLS, audit |

#### 3c. Execute Each Task

For each task:
1. Read the task description and understand the requirement
2. Check AGENTS.md for the assigned agent's rules and file scope
3. Implement the change following the agent's rules
4. Validate the implementation (lint, typecheck, tests if applicable)
5. Mark task as complete: change `- [ ]` to `- [x]` in tasks.md

#### 3d. Cross-Agent Handoffs

When a task produces artifacts needed by another agent:
- Backend creates an API endpoint -> notify Frontend of the contract
- AI/ML defines a prompt -> Backend wraps it in an Edge Function
- Frontend needs new translations -> update all 5 locale files
- Any new table -> Security must verify RLS before proceeding

### Step 4: Progress Tracking

After each phase, display progress:

```
Phase 2: Backend Implementation
  [x] T004 - Create Edge Function (Backend Agent)
  [x] T005 - Implement AI prompt (AI/ML Agent)
  [x] T006 - Create API endpoint (Backend Agent)

Progress: 6/17 tasks complete (35%)
Next: Phase 3 - Frontend Implementation
```

### Step 5: Validation After All Tasks

Once all tasks are complete:
1. Run `npm run lint` — fix any lint errors
2. Run `npx tsc --noEmit` — fix any type errors
3. Run `npm run test:unit` — verify unit tests pass
4. Verify all i18n keys exist in all 5 locales

### Step 6: Next Steps

Inform the user:
- Implementation complete: X/Y tasks done
- Next step: Run `/review` for cross-agent code review
