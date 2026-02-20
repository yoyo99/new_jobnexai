# BMAD Quick Flow

## Purpose

For smaller features or bug fixes that don't need the full BMAD pipeline.

---

## When to Use Quick Flow

- Bug fixes
- Small enhancements (< 3 story points)
- Documentation updates
- Refactoring without behavior change
- Configuration changes

## When NOT to Use Quick Flow

- New features
- Architecture changes
- Security-related changes
- Database schema changes
- Breaking API changes

---

## Quick Flow Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  SPEC    │───▶│   DEV    │───▶│  REVIEW  │───▶│  MERGE   │
│          │    │          │    │          │    │          │
│ 5-10 min │    │ Variable │    │ 15 min   │    │ 5 min    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Step 1: Quick Spec

Use conversational spec engineering to clarify requirements.

### Skill
```
/bmad-bmm-quick-spec
```

### Output
- Clear understanding of what to change
- Acceptance criteria (informal)
- Files to modify identified

---

## Step 2: Development

Implement the change with tests.

### Skill
```
/bmad-bmm-quick-dev
```

### Checklist
- [ ] Change implemented
- [ ] Tests added/updated
- [ ] Linting passes
- [ ] Self-tested locally

---

## Step 3: Review

Quick adversarial review.

### Skill
```
/bmad-bmm-code-review
```

### Focus Areas
- [ ] Correctness
- [ ] Security (always check)
- [ ] Test coverage
- [ ] No regressions

---

## Step 4: Merge

Complete the change.

### Checklist
- [ ] CI passing
- [ ] Review approved
- [ ] Merged to appropriate branch
- [ ] Verified in deployment

---

## Quick Flow vs Full Pipeline

| Aspect | Quick Flow | Full Pipeline |
|--------|------------|---------------|
| Time | Hours | Days/Weeks |
| Artifacts | None formal | Brief, PRD, ADR |
| Agents | Dev + Review | All agents |
| Scope | Small | Large |
| Risk | Low | Any |

---

## Escalation

If during Quick Flow you discover:
- The change is larger than expected
- Security implications
- Architecture impact
- Multiple dependencies

**Stop and escalate to Full Pipeline.**
