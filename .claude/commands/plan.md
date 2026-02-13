# Technical Planning

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent** coordinating with domain agents. Create a technical plan from the feature specification.

### Step 1: Load Context

1. Identify the current feature branch and find the spec:
   ```bash
   git branch --show-current
   ```
2. Read the spec from `Jobnexai-spec/specs/<feature-name>/spec.md`
3. If `$ARGUMENTS` contains a path or feature name, use that instead

### Step 2: Research Phase (Phase 0)

Explore the existing codebase to understand:
- **Existing patterns**: How similar features are implemented
- **Reusable code**: Functions, components, utilities that can be reused
- **Data model**: Current database schema and how it relates to this feature
- **API contracts**: Existing endpoints and their patterns
- **Test patterns**: How similar features are tested

Document findings in `Jobnexai-spec/specs/<feature-name>/research.md`.

### Step 3: Design Phase (Phase 1)

Create the technical plan with agent assignments:

#### 3a. Data Model (`data-model.md`)
If the feature needs database changes:
- New tables with columns, types, constraints
- RLS policies (mandatory for every table)
- Indexes for performance
- Relationships to existing tables

#### 3b. API Contracts (`contracts/`)
For each new endpoint:
- Method, path, request/response schema
- Authentication requirements
- Error codes and handling
- Which agent implements it (Backend or AI/ML)

#### 3c. Implementation Plan (`plan.md`)

```markdown
# Technical Plan: <Feature Title>

## Architecture Overview
<High-level description of how components interact>

## Agent Assignments

### Frontend Agent
- Components to create/modify: [list with file paths]
- State changes: [Zustand stores, React Query queries]
- i18n keys: [new translation keys needed]

### Backend Agent
- Edge Functions: [new/modified functions]
- Netlify Functions: [new/modified functions]
- Migrations: [new SQL migrations]
- RLS Policies: [policies to add]

### AI/ML Agent
- Prompts: [new/modified prompts]
- Model selection: [which AI models]
- Edge Functions: [AI-specific functions]

### Billing Agent
- Payment flows: [if billing changes needed]
- Subscription changes: [if plan changes needed]

### Testing Agent
- Unit tests: [what to test, which mocks]
- E2E tests: [user flows to test]

### Security Agent
- Review points: [what needs security review]
- RLS verification: [tables to verify]
- Auth flow changes: [if auth is affected]

### n8n Workflow Agent
- Workflows: [new/modified workflows]
- Webhooks: [new webhook endpoints]

### DevOps Agent
- Env variables: [new environment variables needed]
- Build changes: [if build config changes]

## Technical Decisions
- Decision 1: <why this approach over alternatives>
- Decision 2: ...

## Risks & Mitigations
- Risk 1: <risk> -> Mitigation: <how to handle>
```

### Step 4: Verify Plan Completeness

- [ ] Every user story from the spec has at least one agent assigned
- [ ] All database changes have RLS policies defined
- [ ] All new API endpoints have contracts
- [ ] Security review points are identified
- [ ] Testing strategy covers critical paths
- [ ] No orphan dependencies between agents

### Step 5: Next Steps

Inform the user:
- Plan created at `Jobnexai-spec/specs/<feature-name>/plan.md`
- Next step: Run `/tasks` to generate the task breakdown
