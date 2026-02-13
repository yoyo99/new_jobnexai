# JobNexAI — Claude Code Project Configuration

## Project Overview

JobNexAI is a SaaS job search automation platform powered by AI. It helps users find jobs, analyze CVs, generate cover letters, and automate applications across multiple platforms.

## Tech Stack (Locked Versions)

| Technology | Version | Notes |
|-----------|---------|-------|
| React | 18.x | Do NOT upgrade to React 19 |
| Tailwind CSS | 3.4.x | Do NOT upgrade to v4 |
| Vite | latest | Build via `vite.config.mts` |
| TypeScript | 5.x | Strict mode enabled |
| Node.js | 20.11.1 | As specified in `netlify.toml` |
| Supabase SDK | 2.39.x | Auth + DB + Realtime + Storage |
| Stripe | latest | Payments & subscriptions |
| i18next | 23.x | 5 languages: fr, en, de, es, it |

## Architecture

```
Frontend (React + Vite)
  ├── Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
  ├── Netlify (Hosting + Serverless Functions)
  ├── Stripe (Payments)
  ├── AI Services (OpenAI, Mistral, Gemini, Claude, Ollama)
  ├── n8n (Workflow Automation)
  └── External APIs (France Travail, Firecrawl, Resend)
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run build:netlify` | Netlify-specific build |
| `npm run lint` | ESLint (ts,tsx) |
| `npm run test:unit` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:all` | Unit + E2E tests |
| `npm run db:generate` | Drizzle schema generation |
| `npm run db:migrate` | Drizzle migration push |

## Agent System

This project uses a multi-agent orchestration system defined in `AGENTS.md`. Each agent owns specific areas of the codebase:

| Agent | Scope |
|-------|-------|
| **Orchestrator** | Coordination, workflow pipeline |
| **Frontend** | `src/components/`, `src/routes/`, `src/hooks/`, `src/stores/`, `public/locales/` |
| **Backend** | `supabase/`, `netlify/`, `functions/`, `migrations/`, `drizzle/` |
| **AI/ML** | `src/lib/ai*`, `src/services/*Service.ts`, AI edge functions |
| **Billing** | `src/lib/stripe*`, Stripe components, payment functions |
| **Testing** | `__tests__/`, `tests/`, `e2e/`, test configs |
| **DevOps** | `.github/`, `infrastructure/`, `deployment/`, `netlify.toml` |
| **n8n Workflows** | `n8n-workflows/`, `src/services/n8n-service.ts` |
| **Security** | Auth files, RLS policies, privacy components |

See `AGENTS.md` for full agent definitions, rules, and inter-agent protocols.

## Workflow Commands

Use these custom commands for structured feature development:

| Command | Phase | Purpose |
|---------|-------|---------|
| `/specify` | 1 | Define feature requirements from natural language |
| `/plan` | 2 | Create technical architecture and agent assignments |
| `/tasks` | 3 | Generate dependency-ordered task breakdown |
| `/implement` | 4 | Execute tasks with specialized agents |
| `/review` | 5 | Cross-agent code review |
| `/deploy` | 6 | Trigger CI/CD deployment pipeline |
| `/analyze` | Utility | Cross-artifact consistency analysis |
| `/checklist` | Utility | Requirements quality validation |

## Safety Rules

1. **Secrets**: NEVER commit `.env` files, API keys, or service role keys. All secrets go through environment variables.
2. **RLS**: Every new Supabase table MUST have Row Level Security enabled with appropriate policies.
3. **i18n**: All user-facing text MUST use `t()` from i18next. All 5 locales (fr, en, de, es, it) must be updated simultaneously.
4. **AI Keys**: API keys for AI services (OpenAI, Mistral, etc.) MUST only exist server-side (Edge Functions or Netlify Functions). Never in frontend code.
5. **Stripe**: Secret key is server-side only. All webhook endpoints must verify Stripe signatures.
6. **Migrations**: All database schema changes require a migration file. Migrations must be idempotent.
7. **Production**: NEVER edit production workflows or data directly. Always create copies first.
8. **Validation**: NEVER deploy n8n workflows without running `validate_workflow` first.
9. **CI/CD**: All PRs must pass CI pipeline (lint + typecheck + tests + build) before merge.

## MCP Server

n8n MCP server is configured in `.claude/mcp.json` for workflow management:
- `search_nodes` — Find n8n nodes (1,084+ available)
- `validate_workflow` — Validate workflow before deployment
- `n8n_create_workflow` / `n8n_update_workflow` — Manage workflows
- `n8n_test_workflow` — Test workflow execution
- `search_templates` — Search 2,709+ workflow templates

## Key Directories

```
/root/JobNexAI/
├── src/                          # React frontend
│   ├── components/               # UI components (feature-organized)
│   ├── lib/                      # Core utilities & services
│   ├── services/                 # External service integrations
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand state management
│   └── i18n/                     # Internationalization config
├── supabase/
│   ├── functions/                # 54+ Edge Functions (Deno)
│   └── migrations/               # Database migrations
├── netlify/functions/            # 20+ Netlify Functions (Node.js)
├── n8n-workflows/                # n8n automation workflows
├── public/locales/               # i18n translation files (5 languages)
├── tests/ + __tests__/           # Jest unit tests
├── e2e/                          # Playwright E2E tests
├── infrastructure/               # Docker configs
├── deployment/                   # VPS deployment scripts
└── .github/workflows/            # CI/CD pipelines
```
