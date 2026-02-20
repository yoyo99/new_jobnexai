# Architecture Decision Record (ADR)

## Document Info
- **Title**: [Decision Title]
- **Author**: Architect Agent
- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Source PRD**: [Link to PRD]

---

## 1. Context

### 1.1 Background
[What is the issue that we're seeing that is motivating this decision?]

### 1.2 Requirements
[Key requirements from the PRD that drive this decision]

### 1.3 Constraints
- Technical: [Existing tech stack constraints]
- Business: [Timeline, budget, team]
- Compliance: [Security, GDPR, etc.]

## 2. Decision

### 2.1 Chosen Approach
[Clear statement of the architectural decision]

### 2.2 Rationale
[Why this approach over alternatives]

## 3. Alternatives Considered

### 3.1 Option A: [Name]
**Description**: [Brief description]
**Pros**:
- [Pro 1]
- [Pro 2]

**Cons**:
- [Con 1]
- [Con 2]

**Why Not Chosen**: [Reason]

---

### 3.2 Option B: [Name]
[Repeat format]

---

## 4. Technical Design

### 4.1 System Overview
```
[ASCII diagram or description]
```

### 4.2 Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| [Name] | [What it does] | [Tech] |

### 4.3 Data Model
```sql
-- Schema changes
CREATE TABLE [table_name] (
  ...
);
```

### 4.4 API Design
```
[Endpoint definitions]
POST /api/v1/[resource]
Request: { ... }
Response: { ... }
```

### 4.5 Security Considerations
- Authentication: [Approach]
- Authorization: [RLS policies]
- Data protection: [Encryption, etc.]

## 5. Implementation Plan

### 5.1 Phases
1. **Phase 1**: [Description] - [Timeline]
2. **Phase 2**: [Description] - [Timeline]

### 5.2 Migration Strategy
[How to migrate from current state to target state]

### 5.3 Rollback Plan
[How to revert if issues arise]

## 6. Consequences

### 6.1 Positive
- [Benefit 1]
- [Benefit 2]

### 6.2 Negative
- [Trade-off 1]
- [Trade-off 2]

### 6.3 Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk] | H/M/L | H/M/L | [Strategy] |

## 7. Dependencies

### 7.1 Upstream
[Systems/services this depends on]

### 7.2 Downstream
[Systems/services that will depend on this]

## 8. JobNexAI Integration

### 8.1 Affected Agents
[Which agents from AGENTS.md are involved]

### 8.2 Existing Patterns
[References to existing patterns to follow]

### 8.3 Files Modified
- `path/to/file1.ts`
- `path/to/file2.ts`

---

## Approvals

| Role | Name | Date | Status |
|------|------|------|--------|
| Architect | | | |
| Security | | | |
| Tech Lead | | | |
