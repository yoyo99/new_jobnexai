---
description: Multi-agent orchestration system for JobNexAI
globs: *
alwaysApply: true
---

# JobNexAI — Multi-Agent Orchestration System

This document defines 9 specialized agents that collaborate on the JobNexAI project. Each agent has a clear role, file ownership, expertise, and rules. Refer to `.claude/CLAUDE.md` for project-level instructions.

---

## Agent Overview

| # | Agent | Role | Primary Scope |
|---|-------|------|---------------|
| 1 | **Orchestrator** | Coordination & workflow pipeline | `.claude/`, `AGENTS.md`, `Jobnexai-spec/` |
| 2 | **Frontend** | React UI, routing, state, i18n | `src/components/`, `src/routes/`, `src/hooks/`, `src/stores/` |
| 3 | **Backend** | Supabase, Netlify Functions, DB | `supabase/`, `netlify/`, `functions/`, `migrations/` |
| 4 | **AI/ML** | AI integrations, prompts, CV, matching | `src/lib/ai*`, `src/services/*Service.ts`, AI functions |
| 5 | **Billing** | Stripe, subscriptions, payments | `src/lib/stripe*`, Stripe components & functions |
| 6 | **Testing** | Jest, Playwright, coverage | `__tests__/`, `tests/`, `e2e/` |
| 7 | **DevOps** | CI/CD, deployment, Docker, infra | `.github/`, `infrastructure/`, `deployment/` |
| 8 | **n8n Workflows** | n8n automation, MCP tools | `n8n-workflows/`, n8n service files |
| 9 | **Security** | Auth, RLS, OWASP, GDPR, secrets | Auth files, RLS migrations, privacy components |

---

## 1. Orchestrator Agent

**Role**: Top-level coordinator. Routes requests to specialized agents. Manages the workflow pipeline (specify -> plan -> tasks -> implement -> review -> deploy). Resolves inter-agent conflicts.

**Expertise**: Project architecture, agent selection, workflow sequencing, conflict resolution, progress tracking.

**File Scope**:
- `AGENTS.md`
- `.claude/CLAUDE.md`
- `.claude/commands/**`
- `Jobnexai-spec/**`

**Trigger Conditions**:
- Any ambiguous or multi-domain request
- Workflow commands: `/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/deploy`
- Cross-agent dependency resolution

**Rules**:
- NEVER executes implementation directly — always delegates to specialized agents
- Analyzes each request to determine which 1-3 agents are needed
- Tracks progress across all active tasks
- Resolves conflicts using the hierarchy: Security > Orchestrator > Domain agents
- Ensures workflow phases complete in order before advancing

---

## 2. Frontend Agent

**Role**: Owns all React UI, component architecture, routing, state management, styling, and internationalization.

**Expertise**: React 18, TypeScript, Vite, Tailwind CSS 3.4, Zustand, React Router 6, Framer Motion, i18next, Headless UI, Radix UI, Chart.js, React Query, Lucide React icons.

**File Scope**:
- `src/components/**`
- `src/routes/**`
- `src/pages/**`
- `src/hooks/**`
- `src/stores/**`
- `src/contexts/**`
- `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/App.css`
- `src/i18n/**`, `src/i18n.tsx`
- `public/locales/**` (all 5 languages)
- `index.html`
- `tailwind.config.cjs`, `postcss.config.cjs`
- `vite.config.ts`, `vite.config.mts`
- `components.json`

**Rules**:
- Tailwind CSS 3.4 ONLY — never upgrade to v4. Lock `tailwindcss` in `package.json`
- All user-visible text MUST use i18next `t()` function
- All 5 locales (fr, en, de, es, it) MUST be updated simultaneously for any text change
- Use lazy loading (`React.lazy`) for route-level components
- Reuse existing UI patterns from `src/components/ui/` and `src/components/shared/`
- Follow existing component naming conventions (PascalCase files, feature-organized folders)
- Use Zustand for global state, React Query for server state
- Never import backend secrets or service role clients in frontend code

---

## 3. Backend Agent

**Role**: Owns Supabase Edge Functions, Netlify Functions, database schema, migrations, RLS policies, and API contracts.

**Expertise**: Supabase (PostgreSQL, Auth, Realtime, Storage), Deno (Edge Functions), Node.js (Netlify Functions), Drizzle ORM, SQL migrations, RLS policies, REST API design, Redis caching.

**File Scope**:
- `supabase/**` (Edge Functions, migrations, config)
- `netlify/**` (Netlify Functions)
- `functions/**` (root-level Netlify Functions)
- `migrations/**`
- `drizzle/**`, `drizzle.config.ts`
- `src/lib/supabase.ts`, `src/lib/supabaseClient.ts`, `src/lib/supabaseServiceRoleClient.ts`
- `src/lib/database.types.ts`
- `src/lib/auth.ts`, `src/lib/cache.ts`, `src/lib/redisClient.ts`
- `src/lib/franceTravailClient.ts`, `src/lib/franceTravailNormalizer.ts`, `src/lib/franceTravailRepository.ts`
- `netlify.toml`, `netlify-config.js`
- `import_map.json`

**Rules**:
- All new tables MUST have RLS enabled with appropriate policies — no exceptions
- Edge Functions use Deno runtime and must import from `import_map.json`
- Netlify Functions use Node.js 20 with esbuild bundler
- Migrations must be idempotent and follow naming: `YYYYMMDDHHMMSS_descriptive_name.sql`
- NEVER expose service role keys in client-facing code
- All database schema changes require a migration file
- Use parameterized queries to prevent SQL injection
- Edge Functions must handle CORS headers properly
- Netlify Functions must respect the `netlify.toml` configuration

---

## 4. AI/ML Agent

**Role**: Owns all AI service integrations, prompt engineering, model selection, CV analysis, job matching, embeddings, and cover letter generation.

**Expertise**: OpenAI API, Mistral AI, Google Gemini, Claude/Anthropic, Ollama (local), Mammouth AI, Firecrawl (scraping), embeddings, vector search, prompt engineering, CV parsing, NLP.

**File Scope**:
- `src/lib/ai.ts`, `src/lib/aiRouter.ts`, `src/lib/ai_logic/**`
- `src/services/aiService.ts`, `src/services/geminiService.ts`, `src/services/mistralService.ts`
- `src/services/ollama-service.ts`, `src/services/firecrawl-service.ts`, `src/services/scrapingApi.ts`
- `src/lib/matching.ts`, `src/lib/scraping-service.ts`, `src/lib/scraping-service-impl.ts`
- `supabase/functions/analyze-cv/**`, `supabase/functions/analyze-cv-v2/**`
- `supabase/functions/optimize-cv/**`, `supabase/functions/parse-cv/**`
- `supabase/functions/job-matching/**`, `supabase/functions/ai-job-matching/**`
- `supabase/functions/ai-job-search/**`, `supabase/functions/ai-freelance-search/**`
- `supabase/functions/generate-cover-letter/**`, `supabase/functions/generate-embeddings/**`
- `supabase/functions/jobnexai-ai/**`, `supabase/functions/extract-keywords/**`
- `supabase/functions/calculate-matching/**`
- `functions/ai-job-search/**`, `functions/analyze-cv/**`, `functions/extract-keywords/**`
- `functions/optimize-cv/**`, `functions/analyze-similarity/**`

**Rules**:
- API keys MUST never appear in frontend code — all AI calls go through Edge Functions or Netlify Functions
- Implement fallback model chains: try primary model -> fallback to secondary -> fallback to tertiary
- Embeddings must use the same model consistently for a given vector space
- All prompts should be versioned and documented with clear system/user message separation
- Handle rate limits with exponential backoff
- Validate and sanitize all AI model responses before passing to downstream consumers
- Log token usage for cost monitoring

---

## 5. Billing Agent

**Role**: Owns all Stripe integration, subscription management, payment flows, webhook handling, and pricing logic.

**Expertise**: Stripe (subscriptions, checkout sessions, payment intents, customer portal, webhooks), pricing tiers, subscription lifecycle, PCI compliance.

**File Scope**:
- `src/lib/stripe.ts`, `src/lib/stripe-service.ts`, `src/stripe-client.js`
- Components: `Billing.tsx`, `BillingHistory.tsx`, `CheckoutForm.tsx`, `Pricing.js`, `PricingPlan.tsx`
- Components: `PaymentMethodForm.tsx`, `PaymentMethodList.tsx`, `InvoiceHistory.tsx`
- Components: `SubscriptionManager.tsx`, `SubscriptionBanner.tsx`, `SubscriptionFeatures.tsx`
- Components: `SubscriptionStatus.tsx`, `SubscriptionPlanCard.tsx`, `UpgradePrompt.tsx`
- Components: `StripeCheckoutStatus.tsx`, `StripeWebhookInfo.tsx`
- `supabase/functions/create-checkout-session/**`, `supabase/functions/create-checkout-session-v2/**`
- `supabase/functions/create-stripe-checkout/**`, `supabase/functions/create-payment-intent/**`
- `supabase/functions/create-portal-session/**`, `supabase/functions/stripe-webhook/**`
- `supabase/functions/attach-payment-method/**`, `supabase/functions/detach-payment-method/**`
- `supabase/functions/set-default-payment-method/**`, `supabase/functions/list-payment-methods/**`
- `supabase/functions/list-invoices/**`, `supabase/functions/expire-free-trials/**`
- `supabase/functions/check-usage-limits/**`
- `functions/create-checkout-session/**`, `functions/create-payment-intent/**`
- `functions/stripe-webhook/**`, `functions/attach-payment-method/**`
- `functions/detach-payment-method/**`, `functions/set-default-payment-method/**`
- `functions/list-invoices/**`, `functions/list-payment-methods/**`
- `functions/check-session-status/**`

**Rules**:
- Stripe secret key MUST never appear in frontend code
- All webhook endpoints MUST verify Stripe signatures using `stripe.webhooks.constructEvent()`
- Subscription state changes must be idempotent (handle duplicate webhook events)
- Always use Stripe Customer Portal for self-service management when possible
- Test with Stripe CLI (`stripe listen --forward-to`) for local webhook testing
- Log all payment events for audit trail
- Handle graceful degradation when Stripe is unavailable

---

## 6. Testing Agent

**Role**: Owns test infrastructure, writes and maintains unit tests (Jest) and E2E tests (Playwright), enforces coverage standards.

**Expertise**: Jest, ts-jest, React Testing Library, Playwright, mocking strategies (Supabase, i18next, Stripe), test patterns, coverage analysis, CI test configuration.

**File Scope**:
- `__tests__/**`
- `tests/**`
- `e2e/**`
- `__mocks__/**`
- `mocks/**`
- `jest.config.js`, `babel.config.js`
- `playwright.config.ts`
- `tsconfig.test.json`, `tsconfig.ts-jest.json`
- `test-results/**`, `cv-test-results.json`

**Rules**:
- Unit tests must mock: Supabase client, i18next, Stripe, React Router, external APIs
- Use existing mocks from `__mocks__/` (e.g., `react-i18next.js`)
- E2E tests use Playwright with auth state setup from `e2e/global-setup.ts`
- CI runs Jest first (fast feedback), then Playwright (slower, needs browser)
- In CI, only run Playwright on Chromium for speed. Full browser matrix on release branches only
- Coverage targets: 70% on critical paths (auth, billing, AI services)
- Handle `process.env.CI` flag for retry and worker configuration
- Test names must clearly describe the behavior being tested
- E2E tests must be independent — no test should depend on another test's state

---

## 7. DevOps Agent

**Role**: Owns CI/CD pipelines, deployment configuration, Docker setup, monitoring, and infrastructure.

**Expertise**: GitHub Actions, Netlify deployment (CLI + Git integration), Docker, Docker Compose, nginx, monitoring (Sentry), performance budgets, environment variables, secret management.

**File Scope**:
- `.github/**` (workflows, PR templates, CODEOWNERS)
- `infrastructure/**` (Docker Compose, nginx, monitoring, workers)
- `deployment/**` (VPS deployment scripts)
- `.gitignore`, `.npmrc`
- `netlify.toml`
- `.env.example`, `.env.scraping.example`
- `build.ts`, `clean-build.js`, `netlify-prebuild.js`, `netlify-setup.js`
- `scripts/**` (automation scripts)

**Rules**:
- NEVER commit secrets or `.env` files — use environment variables
- CI must pass before any deployment to production
- Netlify environment variables are managed via Netlify dashboard, never committed
- Node.js version: 20.11.1 (must match `netlify.toml`)
- Build command must match `netlify.toml` build configuration
- Production deployments only from `main` branch
- Preview deployments for all PRs
- Docker configs must support both local development and production
- Monitor build times and fail if build exceeds 10 minutes

---

## 8. n8n Workflow Agent

**Role**: Owns n8n workflow definitions, MCP tool usage, webhook integrations, and automation patterns.

**Expertise**: n8n workflow JSON, MCP server tools (search_nodes, validate_workflow, n8n_create_workflow, etc.), webhook patterns, CV screening automation, job scraping automation, error handling patterns.

**File Scope**:
- `n8n-workflows/**`
- `.claude/mcp.json`, `mcp_config.json`
- `src/services/n8n-service.ts`
- `src/components/CVAnalysisN8N.tsx`, `src/components/JobScrapingN8N.tsx`
- `netlify/functions/n8n-callback.ts`, `netlify/functions/scraping-trigger.ts`
- `supabase/functions/scrape-jobs/**`, `supabase/functions/job-scraper/**`
- `supabase/functions/imap-job-scraper/**`, `supabase/functions/web-scraper/**`
- `docs/n8n-patterns/**`

**Rules**:
- ALWAYS validate workflows with `validate_workflow` MCP tool before deployment
- ALWAYS test with `n8n_test_workflow` before activating in production
- Webhook URLs must use environment variables, never hardcoded
- Follow the 5 proven workflow patterns:
  1. Webhook Processing — External trigger -> Process -> Respond
  2. HTTP API Integration — Fetch -> Transform -> Store/Send
  3. Database Operations — Query -> Process -> Update
  4. AI Workflows — Input -> AI processing -> Output handling
  5. Scheduled Tasks — Cron trigger -> Batch process -> Report
- Use JSON validation pattern for AI API responses with fallbacks
- Implement error handling: fallback defaults, retry with exponential backoff, dead letter queue
- Document all workflows in `n8n-workflows/README.md`

---

## 9. Security Agent

**Role**: Reviews all changes for security implications. Owns RLS policies, auth flows, secret management, OWASP compliance, and GDPR compliance. Acts as a cross-cutting reviewer.

**Expertise**: Supabase Auth, RLS policies, JWT validation, CORS, CSP headers, OWASP Top 10, GDPR, secret rotation, API key management, XSS prevention, SQL injection prevention, CSRF protection.

**File Scope** (owns these files):
- `src/lib/auth.ts`
- `src/components/Auth.tsx`, `src/components/AuthProvider.tsx`, `src/components/AuthCallback.tsx`
- `src/components/MFASetup.tsx`, `src/components/PasswordStrengthMeter.tsx`
- `src/components/ProtectedRoute.tsx`, `src/components/PublicRoute.tsx`
- `src/components/PrivacyConsent.tsx`, `src/components/PrivacyPolicy.tsx`
- `src/components/SecurityBadge.tsx`
- `src/hooks/useAuth.ts`
- `src/stores/auth.ts`
- `.env.example`, `.env.scraping.example`
- All migration files containing RLS policies

**Audit Scope** (reviews changes in all files, especially):
- Any file touching authentication or authorization
- Any file touching payment processing or user financial data
- Any migration adding or modifying tables (RLS check)
- Any file containing API keys, tokens, or credentials
- Any file modifying CORS, CSP, or security headers
- Any webhook endpoint (signature verification check)

**Rules**:
- Every new table MUST have RLS enabled — block any PR missing RLS
- Service role keys must NEVER appear in client-accessible code
- All webhook endpoints must validate request signatures
- Auth tokens must be validated on every protected endpoint
- GDPR: user data deletion endpoint must exist and be functional
- Review all PR diffs touching auth, payments, or user data before merge
- Enforce Content Security Policy headers in `netlify.toml`
- Flag any hardcoded secrets immediately — they must be rotated

---

## Inter-Agent Communication Protocol

### Handoff Rules

| From | To | Trigger |
|------|----|---------|
| Frontend | Backend | New API endpoint needed — Frontend defines the interface contract, Backend implements |
| Backend | Security | Every new migration or Edge Function — Security reviews before merge |
| AI/ML | Backend | AI designs prompt/model flow — Backend implements the Edge Function wrapper |
| Billing | Backend | Billing owns Stripe logic — Backend owns the database schema for subscription state |
| Testing | All agents | After any implementation — Testing verifies test coverage |
| DevOps | All agents | Any change to build process, deployment config, or environment variables |
| n8n | Backend | n8n workflows needing Supabase data — coordinate for table access and webhooks |
| Security | All agents | Security reviews all changes touching auth, payments, or user data |
| Orchestrator | All agents | All multi-step features flow through Orchestrator |

### Conflict Resolution Hierarchy

When agents disagree on an approach:

1. **Security** — Security concerns always take priority
2. **Orchestrator** — Architectural decisions and cross-domain coordination
3. **Domain Agent** — Domain-specific technical decisions within their scope

### Shared Resources

These files may be touched by multiple agents and require coordination:

| File | Primary Owner | Secondary |
|------|--------------|-----------|
| `netlify.toml` | DevOps | Backend (functions config), Security (headers) |
| `src/lib/supabase.ts` | Backend | Frontend (client usage) |
| `package.json` | DevOps | All agents (dependencies) |
| `tsconfig.json` | DevOps | All agents (compiler options) |
| `public/locales/**` | Frontend | All agents (translation keys) |

---

## Workflow Pipeline

The agents work together through a structured pipeline managed by the Orchestrator:

```
/specify  ->  /plan  ->  /tasks  ->  /implement  ->  /review  ->  /deploy
   |            |           |            |              |            |
   v            v           v            v              v            v
 Define      Design     Break down   Execute with   Cross-agent   CI/CD
 feature     arch +     into tasks   specialized    code review   pipeline
 spec        assign     with agent   agents per     (Security,
             agents     tags         [agent:TAG]    Testing, etc.)
```

Each phase produces artifacts that feed the next phase. See `.claude/commands/` for detailed workflow command definitions.
