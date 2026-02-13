# Cross-Agent Code Review

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent**. Perform a cross-agent code review on the current feature branch.

### Step 1: Identify Changes

```bash
git diff main...HEAD --name-only
```

Categorize each changed file by agent ownership (per AGENTS.md):

```
| File | Agent | Change Type |
|------|-------|-------------|
| src/components/NewFeature.tsx | Frontend | Added |
| supabase/functions/new-endpoint/index.ts | Backend | Added |
| supabase/migrations/20250213_new_table.sql | Backend + Security | Added |
```

### Step 2: Security Agent Review

The Security Agent reviews ALL changes, focusing on:

1. **Secrets Scan**
   - Search for hardcoded API keys, tokens, passwords in all changed files
   - Verify no `.env` values are committed
   - Check `netlify.toml` for exposed credentials

2. **RLS Verification**
   - For every new migration creating a table, verify RLS is enabled:
     ```sql
     ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
     ```
   - Verify appropriate policies exist (SELECT, INSERT, UPDATE, DELETE)

3. **Auth Flow Review**
   - If auth files changed: verify token validation, session handling
   - Check for proper `ProtectedRoute` usage on new pages

4. **Webhook Security**
   - If webhook endpoints changed: verify signature validation
   - Stripe: `stripe.webhooks.constructEvent()` must be present

5. **Input Validation**
   - Check for SQL injection (parameterized queries?)
   - Check for XSS (sanitized user input in React?)

Output: List of findings with severity (CRITICAL / HIGH / MEDIUM / LOW)

### Step 3: Testing Agent Review

1. **Coverage Check**
   - For each new function/component, verify a corresponding test exists
   - Check mock completeness (Supabase, i18next, Stripe)
   - Verify E2E tests cover new user flows

2. **Test Quality**
   - Tests describe behavior, not implementation
   - Edge cases are covered (empty data, errors, loading states)
   - Mocks match actual API contracts

Output: Coverage gaps and test quality issues

### Step 4: Frontend Agent Review

1. **i18n Completeness**
   - Every new user-visible string uses `t()` function
   - All 5 locale files (fr, en, de, es, it) have the new keys
   - No hardcoded strings in JSX

2. **Tailwind Compliance**
   - No Tailwind v4 classes used
   - Consistent with existing styling patterns

3. **Component Patterns**
   - Follows existing component structure
   - Uses lazy loading for route-level components
   - Proper error boundaries and loading states

Output: i18n gaps, styling issues, pattern violations

### Step 5: Backend Agent Review

1. **Migration Safety**
   - Migrations are idempotent (can be run multiple times safely)
   - No destructive operations without safeguards
   - Proper naming convention followed

2. **Function Quality**
   - Edge Functions handle CORS properly
   - Error responses follow consistent format
   - No service role key exposure

3. **API Contract Compliance**
   - Endpoints match the contracts defined in plan phase
   - Request/response schemas are validated

Output: Migration risks, function issues, contract violations

### Step 6: Generate Review Report

Produce a consolidated report:

```markdown
# Code Review: <Feature Name>

## Summary
- Files changed: X
- Agents involved: [list]
- Overall status: PASS / NEEDS_CHANGES

## Critical Issues (must fix)
1. [CRITICAL] <description> — File: <path>

## High Priority Issues
1. [HIGH] <description> — File: <path>

## Medium Priority Issues
1. [MEDIUM] <description> — File: <path>

## Low Priority / Suggestions
1. [LOW] <description> — File: <path>

## Checklist
- [ ] Security: No hardcoded secrets
- [ ] Security: RLS enabled on all new tables
- [ ] Security: Webhook signatures verified
- [ ] Testing: Unit tests for new functions
- [ ] Testing: E2E tests for new user flows
- [ ] Frontend: i18n complete (5 locales)
- [ ] Frontend: No Tailwind v4 classes
- [ ] Backend: Migrations are idempotent
- [ ] Backend: CORS handled properly
- [ ] DevOps: No new env vars uncommitted in .env.example
```

### Step 7: Next Steps

If PASS:
- Inform the user: Review passed. Run `/deploy` to deploy.

If NEEDS_CHANGES:
- List all issues that must be fixed
- After fixes, re-run `/review` to verify
