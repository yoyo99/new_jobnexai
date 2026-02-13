# Requirements Quality Checklist

## Input

```
$ARGUMENTS
```

## Instructions

You are the **Orchestrator Agent** with the **Testing Agent** perspective. Generate quality checklists that serve as "unit tests for requirements."

### Step 1: Load Context

1. Read `Jobnexai-spec/specs/<feature-name>/spec.md`
2. Read `Jobnexai-spec/specs/<feature-name>/plan.md` (if exists)
3. If `$ARGUMENTS` specifies a checklist type, generate only that type

### Step 2: Determine Checklist Types

Based on the feature, generate applicable checklists:

| Type | When to Generate |
|------|-----------------|
| `ux.md` | Always (any feature with UI) |
| `api.md` | When new API endpoints are created |
| `security.md` | Always |
| `performance.md` | When data-heavy operations exist |
| `accessibility.md` | When new UI components are added |
| `i18n.md` | When new user-facing text is added |

### Step 3: Generate Checklists

Create files in `Jobnexai-spec/specs/<feature-name>/checklists/`:

#### UX Checklist (`ux.md`)
```markdown
# UX Quality Checklist

## User Flow
- [ ] CHK001: User can discover the feature from the main navigation
- [ ] CHK002: Loading states are shown during async operations
- [ ] CHK003: Error states display helpful messages with recovery actions
- [ ] CHK004: Empty states guide the user on what to do next
- [ ] CHK005: Success feedback is provided after completing actions

## Responsiveness
- [ ] CHK006: Layout works on mobile (320px+)
- [ ] CHK007: Layout works on tablet (768px+)
- [ ] CHK008: Layout works on desktop (1024px+)
- [ ] CHK009: Touch targets are at least 44x44px on mobile

## Consistency
- [ ] CHK010: Uses existing component patterns from src/components/ui/
- [ ] CHK011: Colors match the existing design system
- [ ] CHK012: Typography follows existing heading/body hierarchy
```

#### Security Checklist (`security.md`)
```markdown
# Security Quality Checklist

## Authentication & Authorization
- [ ] CHK001: All new pages behind ProtectedRoute
- [ ] CHK002: API endpoints validate auth tokens
- [ ] CHK003: RLS policies cover all CRUD operations on new tables
- [ ] CHK004: No privilege escalation possible

## Data Protection
- [ ] CHK005: User can only access their own data
- [ ] CHK006: Sensitive data is not logged
- [ ] CHK007: No PII in URL parameters
- [ ] CHK008: GDPR deletion covers new data

## Input Validation
- [ ] CHK009: All user inputs are sanitized
- [ ] CHK010: SQL injection prevented (parameterized queries)
- [ ] CHK011: XSS prevented (React auto-escaping, no dangerouslySetInnerHTML)

## Secrets
- [ ] CHK012: No hardcoded API keys or tokens
- [ ] CHK013: Secrets only in environment variables
- [ ] CHK014: .env.example updated with new variable names (no values)
```

#### API Checklist (`api.md`)
```markdown
# API Quality Checklist

## Endpoints
- [ ] CHK001: All endpoints return consistent response format
- [ ] CHK002: Error responses include error code and message
- [ ] CHK003: HTTP status codes are appropriate (200, 201, 400, 401, 403, 404, 500)
- [ ] CHK004: Rate limiting is considered

## Data Validation
- [ ] CHK005: Request body is validated before processing
- [ ] CHK006: Response matches the contract schema
- [ ] CHK007: Null/undefined values are handled gracefully

## Performance
- [ ] CHK008: Database queries use indexes
- [ ] CHK009: N+1 queries are avoided
- [ ] CHK010: Response payloads are reasonable size
```

#### i18n Checklist (`i18n.md`)
```markdown
# Internationalization Quality Checklist

## Translation Coverage
- [ ] CHK001: All new strings use t() function
- [ ] CHK002: French (fr) translations provided
- [ ] CHK003: English (en) translations provided
- [ ] CHK004: German (de) translations provided
- [ ] CHK005: Spanish (es) translations provided
- [ ] CHK006: Italian (it) translations provided

## Quality
- [ ] CHK007: No concatenated strings (use interpolation: t('key', {name}))
- [ ] CHK008: Pluralization handled correctly
- [ ] CHK009: Date/number formatting uses locale-aware functions
- [ ] CHK010: No hardcoded text in JSX
```

### Step 4: Checklist Numbering

Each checklist uses `CHK###` numbering starting at CHK001 per file. Items test requirement QUALITY, not implementation correctness.

### Step 5: Report

```markdown
Checklists generated:
- ux.md: X items
- security.md: X items
- api.md: X items (if applicable)
- i18n.md: X items (if applicable)

Location: Jobnexai-spec/specs/<feature-name>/checklists/

These checklists will be verified during /implement phase.
Mark items as [x] when they pass during implementation.
```
