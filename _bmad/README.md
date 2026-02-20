# BMAD - JobNexAI

**Breakthrough Method for Agile AI-Driven Development**

## Overview

BMAD provides a structured methodology for developing JobNexAI features with AI assistance. It ensures consistency, traceability, and quality across the development lifecycle.

## Structure

```
_bmad/
├── README.md                 # This file
├── bmad-config.yaml          # Configuration
├── agents/                   # Agent definitions
│   ├── analyst.md
│   ├── pm.md
│   ├── architect.md
│   ├── ux-designer.md
│   ├── sm.md
│   ├── dev.md
│   ├── tech-writer.md
│   ├── quinn.md
│   └── bmad-master.md
├── workflows/                # Process workflows
│   ├── development-pipeline.md
│   └── quick-flow.md
├── templates/                # Document templates
│   ├── product-brief.md
│   ├── prd.md
│   ├── architecture.md
│   ├── story.md
│   └── sprint-status.yaml
├── checklists/               # Quality checklists
│   ├── implementation-readiness.md
│   └── code-review.md
└── tasks/                    # Active task tracking

_bmad-output/
├── briefs/                   # Product briefs
├── research/                 # Research reports
├── prds/                     # PRDs
├── architecture/             # Architecture decisions
├── ux/                       # UX specs & wireframes
├── epics/                    # Epic & story files
├── sprints/                  # Sprint status files
└── reviews/                  # Code review reports
```

## Quick Start

### 1. Start a New Feature

```
/bmad-bmm-create-product-brief
```

### 2. Create PRD from Brief

```
/bmad-bmm-create-prd
```

### 3. Design Architecture

```
/bmad-bmm-create-architecture
```

### 4. Plan Sprint

```
/bmad-bmm-create-epics-and-stories
/bmad-bmm-sprint-planning
```

### 5. Implement Stories

```
/bmad-bmm-dev-story
```

### 6. Review & Deploy

```
/bmad-bmm-code-review
/bmad-bmm-retrospective
```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `bmad-bmm-create-product-brief` | Create product briefs |
| `bmad-bmm-research` | Conduct research |
| `bmad-bmm-create-prd` | Create/edit PRDs |
| `bmad-bmm-create-architecture` | Architecture decisions |
| `bmad-bmm-create-ux-design` | UX specifications |
| `bmad-bmm-create-excalidraw-wireframe` | Wireframes |
| `bmad-bmm-create-epics-and-stories` | Break down to stories |
| `bmad-bmm-create-story` | Create single story |
| `bmad-bmm-sprint-planning` | Plan sprints |
| `bmad-bmm-sprint-status` | Check sprint status |
| `bmad-bmm-dev-story` | Implement a story |
| `bmad-bmm-quick-dev` | Quick development |
| `bmad-bmm-quick-spec` | Quick spec engineering |
| `bmad-bmm-code-review` | Adversarial review |
| `bmad-bmm-qa-automate` | Generate tests |
| `bmad-bmm-check-implementation-readiness` | Validate before dev |
| `bmad-bmm-correct-course` | Handle scope changes |
| `bmad-bmm-retrospective` | Sprint retrospective |
| `bmad-help` | Get guidance |

## Integration with JobNexAI

BMAD complements the existing agent system in `AGENTS.md`:

| BMAD Agent | JobNexAI Agent(s) |
|------------|-------------------|
| Analyst | - |
| PM | Orchestrator |
| Architect | Backend, AI/ML |
| UX Designer | Frontend |
| SM | Orchestrator |
| Dev | Frontend, Backend, AI/ML, Billing |
| Tech Writer | - |
| Quinn | Testing |
| BMAD Master | Orchestrator |

## Best Practices

1. **Follow the pipeline** - Don't skip phases
2. **Document decisions** - Use the templates
3. **Review adversarially** - Find problems, don't rubber-stamp
4. **Test thoroughly** - 70% coverage minimum on critical paths
5. **Update all locales** - fr, en, de, es, it
6. **Security first** - RLS, no exposed secrets
7. **Retrospect** - Learn from each cycle

## Getting Help

```
/bmad-help
```

This will guide you to the appropriate workflow or agent.
