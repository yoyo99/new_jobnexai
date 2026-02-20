# BMAD Development Pipeline

## Overview

This document describes the complete BMAD workflow pipeline for JobNexAI development.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DISCOVERY  │───▶│  DEFINITION │───▶│   DESIGN    │
│             │    │             │    │             │
│ • Brief     │    │ • PRD       │    │ • Arch      │
│ • Research  │    │             │    │ • UX        │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
       ┌─────────────────────────────────────┘
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PLANNING   │───▶│IMPLEMENTATION───▶│ VALIDATION  │
│             │    │             │    │             │
│ • Epics     │    │ • Dev       │    │ • Review    │
│ • Sprint    │    │ • Tests     │    │ • QA        │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ DEPLOYMENT  │
                                      │             │
                                      │ • Release   │
                                      │ • Retro     │
                                      └─────────────┘
```

---

## Phase 1: Discovery

### Purpose
Understand the problem and define what needs to be built.

### Agents
- **Analyst** (primary)
- **PM** (support)

### Activities
1. Stakeholder interviews
2. Market research
3. User research
4. Problem definition
5. Solution ideation

### Skills to Use
```
/bmad-bmm-create-product-brief
/bmad-bmm-research
```

### Outputs
- `_bmad-output/briefs/[feature]-brief.md`
- `_bmad-output/research/[topic]-research.md`

### Exit Criteria
- [ ] Product brief complete and approved
- [ ] Research documented
- [ ] Stakeholder sign-off

---

## Phase 2: Definition

### Purpose
Transform the brief into detailed, actionable requirements.

### Agents
- **PM** (primary)
- **Analyst** (support)

### Activities
1. Write user stories
2. Define acceptance criteria
3. Prioritize features
4. Identify NFRs

### Skills to Use
```
/bmad-bmm-create-prd
```

### Outputs
- `_bmad-output/prds/[feature]-prd.md`

### Exit Criteria
- [ ] PRD complete with all stories
- [ ] Acceptance criteria testable
- [ ] Prioritization complete
- [ ] PM approval

---

## Phase 3: Design

### Purpose
Create technical architecture and UX design.

### Agents
- **Architect** (technical)
- **UX Designer** (user experience)
- **Security Agent** (review)

### Activities
1. Architecture decisions
2. API design
3. Data modeling
4. UX patterns
5. Wireframes
6. Security review

### Skills to Use
```
/bmad-bmm-create-architecture
/bmad-bmm-create-ux-design
/bmad-bmm-create-excalidraw-wireframe
/bmad-bmm-create-excalidraw-diagram
```

### Outputs
- `_bmad-output/architecture/[feature]-architecture.md`
- `_bmad-output/ux/[feature]-ux.md`
- `_bmad-output/ux/wireframes/`

### Exit Criteria
- [ ] Architecture decisions documented
- [ ] Security review passed
- [ ] UX specs complete
- [ ] Architect + UX approval

---

## Phase 4: Planning

### Purpose
Break down into implementable stories and plan the sprint.

### Agents
- **SM** (primary)
- **PM** (support)
- **Dev** (estimation)

### Activities
1. Create epics from PRD
2. Break down into stories
3. Estimate story points
4. Plan sprint
5. Assign work

### Skills to Use
```
/bmad-bmm-create-epics-and-stories
/bmad-bmm-create-story
/bmad-bmm-sprint-planning
/bmad-bmm-check-implementation-readiness
```

### Outputs
- `_bmad-output/epics/[epic]-stories.md`
- `_bmad-output/sprints/sprint-[N]-status.yaml`

### Exit Criteria
- [ ] All stories meet Definition of Ready
- [ ] Sprint planned
- [ ] Implementation readiness checklist passed
- [ ] Team capacity confirmed

---

## Phase 5: Implementation

### Purpose
Build the features according to the stories.

### Agents
- **Dev** (primary)
- **Frontend/Backend/AI agents** from AGENTS.md

### Activities
1. Implement story tasks
2. Write unit tests
3. Write integration tests
4. Update documentation
5. Self-review

### Skills to Use
```
/bmad-bmm-dev-story
/bmad-bmm-quick-dev
/bmad-bmm-sprint-status
```

### Outputs
- Code changes
- Tests
- Updated story status

### Exit Criteria
- [ ] All tasks complete
- [ ] Tests passing
- [ ] Self-review done
- [ ] Ready for code review

---

## Phase 6: Validation

### Purpose
Ensure quality through review and testing.

### Agents
- **Quinn** (QA)
- **Dev** (code review)
- **Security Agent** (security review)

### Activities
1. Code review
2. QA testing
3. Security review (if applicable)
4. Bug fixes
5. Final validation

### Skills to Use
```
/bmad-bmm-code-review
/bmad-bmm-qa-automate
```

### Outputs
- `_bmad-output/reviews/[story]-review.md`
- Bug fixes
- QA sign-off

### Exit Criteria
- [ ] Code review passed
- [ ] All tests passing
- [ ] QA sign-off
- [ ] Security review passed (if needed)

---

## Phase 7: Deployment

### Purpose
Release to production and learn from the process.

### Agents
- **DevOps Agent** (from AGENTS.md)
- **SM** (retrospective)

### Activities
1. Merge to main
2. Deploy to production
3. Monitor release
4. Run retrospective

### Skills to Use
```
/bmad-bmm-retrospective
```

### Outputs
- Production deployment
- Retrospective notes

### Exit Criteria
- [ ] Deployed to production
- [ ] Monitoring confirmed
- [ ] Retrospective completed
- [ ] Lessons documented

---

## Quick Reference

| Phase | Primary Agent | Key Skill | Output |
|-------|--------------|-----------|--------|
| Discovery | Analyst | create-product-brief | Brief |
| Definition | PM | create-prd | PRD |
| Design | Architect | create-architecture | ADR |
| Planning | SM | sprint-planning | Sprint |
| Implementation | Dev | dev-story | Code |
| Validation | Quinn | code-review | Review |
| Deployment | DevOps | retrospective | Release |
