# Feature Specification

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent**. Generate a feature specification from the description above.

### Step 1: Generate Branch Name

Analyze the feature description and create a concise branch name (2-4 words):
- Use action-noun format: `add-user-auth`, `fix-payment-timeout`, `analytics-dashboard`
- Preserve technical terms (OAuth2, API, JWT, etc.)

### Step 2: Create Feature Branch

```bash
git fetch --all --prune
```

Check for existing branches matching the pattern:
- Remote: `git ls-remote --heads origin | grep -E 'refs/heads/feature/.*<short-name>'`
- Local: `git branch | grep -E 'feature/.*<short-name>'`

Create the branch:
```bash
git checkout -b feature/<short-name>
```

### Step 3: Generate Specification

Create `Jobnexai-spec/specs/<short-name>/spec.md` with this structure:

```markdown
# Feature: <Feature Title>

## Summary
<1-2 sentence description>

## User Stories
- US1: As a <role>, I want <goal> so that <benefit>
- US2: ...

## Functional Requirements
- FR1: <requirement>
- FR2: ...

## Non-Functional Requirements
- NFR1: <performance/security/accessibility requirement>
- NFR2: ...

## Acceptance Criteria
- AC1: Given <context>, when <action>, then <result>
- AC2: ...

## Agent Assignments (preliminary)
- Frontend: <what frontend work is needed>
- Backend: <what backend work is needed>
- AI/ML: <what AI work is needed, if any>
- Billing: <what billing work is needed, if any>
- Testing: <what tests are needed>
- Security: <security considerations>

## Out of Scope
- <what this feature does NOT include>

## Dependencies
- <external dependencies or prerequisites>
```

### Step 4: Quality Checklist

Before finishing, verify the spec passes these checks:
- [ ] All user stories follow "As a... I want... so that..." format
- [ ] Acceptance criteria are testable and measurable
- [ ] Agent assignments cover all impacted areas
- [ ] Security considerations are documented
- [ ] Out of scope is clearly defined
- [ ] No ambiguous terms (define any domain-specific terms)

### Step 5: Next Steps

Inform the user:
- Spec created at `Jobnexai-spec/specs/<short-name>/spec.md`
- Branch `feature/<short-name>` is active
- Next step: Run `/plan` to create the technical architecture
