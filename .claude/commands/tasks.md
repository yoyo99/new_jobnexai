# Task Breakdown

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent**. Generate an ordered, dependency-managed task list from the technical plan.

### Step 1: Load Context

1. Read the plan from `Jobnexai-spec/specs/<feature-name>/plan.md`
2. Read the spec from `Jobnexai-spec/specs/<feature-name>/spec.md`
3. If exists, read `data-model.md` and `contracts/`

### Step 2: Generate Tasks

Create `Jobnexai-spec/specs/<feature-name>/tasks.md` with this format:

```markdown
# Tasks: <Feature Title>

## Phase 1: Setup & Foundation
- [ ] T001 [agent:devops] Setup environment variables and configuration
- [ ] T002 [agent:backend] Create database migration for <tables>
- [ ] T003 [agent:backend] Implement RLS policies for new tables

## Phase 2: Backend Implementation
- [ ] T004 [agent:backend] [blocks:T007] Create Edge Function <name>
- [ ] T005 [agent:ai-ml] [blocks:T008] Implement AI prompt for <feature>
- [ ] T006 [agent:backend] [blocks:T007] Create API endpoint <path>

## Phase 3: Frontend Implementation
- [ ] T007 [agent:frontend] [blockedBy:T004,T006] Create <Component> component
- [ ] T008 [agent:frontend] [blockedBy:T005] Integrate AI feature in UI
- [ ] T009 [agent:frontend] Add i18n translations (all 5 locales)

## Phase 4: Billing (if applicable)
- [ ] T010 [agent:billing] Update subscription feature gates

## Phase 5: Testing
- [ ] T011 [agent:testing] [blockedBy:T004,T005,T006] Write unit tests for backend
- [ ] T012 [agent:testing] [blockedBy:T007,T008] Write unit tests for frontend
- [ ] T013 [agent:testing] [blockedBy:T007,T008] Write E2E tests for user flows

## Phase 6: Security Review
- [ ] T014 [agent:security] [blockedBy:T002,T003] Verify RLS policies
- [ ] T015 [agent:security] [blockedBy:T004,T005,T006] Review backend security

## Phase 7: Polish
- [ ] T016 [agent:frontend] [blockedBy:T012,T013] Fix issues from testing
- [ ] T017 [agent:devops] Update CI/CD if needed
```

### Task Format Rules

Each task line MUST include:
- `T###` — Sequential task ID
- `[agent:NAME]` — Assigned agent (orchestrator, frontend, backend, ai-ml, billing, testing, devops, n8n, security)
- `[P]` — (Optional) Can be parallelized with adjacent tasks
- `[blocks:T###]` — (Optional) Tasks that cannot start until this completes
- `[blockedBy:T###,T###]` — (Optional) Tasks that must complete before this starts
- `[US#]` — (Optional) Maps to user story from spec

### Step 3: Dependency Validation

Verify:
- [ ] No circular dependencies exist
- [ ] All `blockedBy` references point to valid task IDs
- [ ] Setup tasks (Phase 1) have no blockers
- [ ] Security review tasks depend on implementation tasks
- [ ] Testing tasks depend on the code they test
- [ ] Tasks within the same phase can be parallelized where possible

### Step 4: Effort Estimation

Add a summary table:

```markdown
## Summary

| Agent | Tasks | Phase Coverage |
|-------|-------|---------------|
| Backend | T002, T003, T004, T006 | 1-2 |
| AI/ML | T005 | 2 |
| Frontend | T007, T008, T009, T016 | 3, 7 |
| Testing | T011, T012, T013 | 5 |
| Security | T014, T015 | 6 |
| DevOps | T001, T017 | 1, 7 |

Total: 17 tasks across 7 phases
```

### Step 5: Next Steps

Inform the user:
- Tasks created at `Jobnexai-spec/specs/<feature-name>/tasks.md`
- Next step: Run `/implement` to start executing tasks with specialized agents
