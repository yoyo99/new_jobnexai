# Cross-Artifact Consistency Analysis

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent**. Perform a non-destructive, read-only consistency analysis across all feature artifacts.

### Step 1: Load All Artifacts

Read all files from `Jobnexai-spec/specs/<feature-name>/`:
- `spec.md` — Feature specification
- `plan.md` — Technical plan
- `tasks.md` — Task breakdown
- `data-model.md` — Database schema (if exists)
- `contracts/` — API contracts (if exists)
- `research.md` — Research findings (if exists)
- `checklists/` — Quality checklists (if exists)

### Step 2: Spec-to-Plan Alignment

For each user story in `spec.md`, verify:
- [ ] It has corresponding architecture in `plan.md`
- [ ] At least one agent is assigned to it
- [ ] Technical decisions support the requirement

Flag mismatches:
- **GAP**: User story has no plan coverage
- **DRIFT**: Plan deviates from spec intent
- **OVERREACH**: Plan includes work not in spec

### Step 3: Plan-to-Tasks Alignment

For each plan item, verify:
- [ ] It has at least one corresponding task in `tasks.md`
- [ ] The agent assignment matches between plan and tasks
- [ ] Dependencies are properly captured

Flag mismatches:
- **MISSING_TASK**: Plan item has no corresponding task
- **ORPHAN_TASK**: Task exists with no plan backing
- **WRONG_AGENT**: Task assigned to wrong agent vs plan

### Step 4: Requirements Coverage Matrix

Build a coverage matrix:

```
| Requirement | Spec | Plan | Tasks | Checklists | Status |
|-------------|------|------|-------|------------|--------|
| US1         | Yes  | Yes  | T004,T007 | ux.md  | COVERED |
| US2         | Yes  | Yes  | T005  | -          | PARTIAL (no checklist) |
| FR3         | Yes  | No   | -     | -          | MISSING |
```

### Step 5: Detect Issues

Scan for:

1. **Duplications**: Same work described in multiple tasks
2. **Ambiguities**: Vague descriptions that could be interpreted multiple ways
3. **Underspecification**: Tasks lacking enough detail to implement
4. **Conflicts**: Contradictions between artifacts
5. **Coverage Gaps**: Requirements with no implementation path
6. **Dependency Cycles**: Circular dependencies in tasks

### Step 6: Produce Analysis Report

```markdown
# Consistency Analysis: <Feature Name>

## Overall Score: X/10

## Coverage Summary
- Requirements covered: X/Y (Z%)
- Tasks with agent assignments: X/Y (Z%)
- Dependencies validated: X/Y (Z%)

## Issues Found

### CRITICAL (blocks implementation)
1. <description>

### HIGH (should fix before implementing)
1. <description>

### MEDIUM (consider fixing)
1. <description>

### LOW (minor improvements)
1. <description>

## Coverage Matrix
<table from Step 4>

## Recommendations
1. <actionable recommendation>
2. <actionable recommendation>
```

### Step 7: Next Steps

- If score >= 8: Recommend proceeding to `/implement`
- If score 5-7: Recommend fixing HIGH issues, then re-analyze
- If score < 5: Recommend going back to `/plan` to redesign
