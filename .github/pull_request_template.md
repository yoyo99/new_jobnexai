## Summary

<!-- Describe what this PR does in 1-3 bullet points -->

-

## Related

<!-- Link to issue, spec, or task list -->

- Spec: `Jobnexai-spec/specs/<feature>/spec.md`
- Tasks: `Jobnexai-spec/specs/<feature>/tasks.md`

## Agent Review Checklist

### Security Agent
- [ ] No hardcoded secrets, API keys, or tokens
- [ ] RLS enabled on all new tables with appropriate policies
- [ ] Webhook endpoints verify signatures
- [ ] Auth tokens validated on protected endpoints
- [ ] No PII in logs or URL parameters

### Frontend Agent
- [ ] i18n complete — all 5 locales updated (fr, en, de, es, it)
- [ ] No hardcoded user-visible strings
- [ ] Tailwind CSS 3.4 only — no v4 classes
- [ ] Loading, error, and empty states handled
- [ ] Mobile responsive (320px+)

### Backend Agent
- [ ] Migrations are idempotent
- [ ] Edge Functions handle CORS
- [ ] No service role keys in client code
- [ ] Parameterized queries (no SQL injection)
- [ ] Consistent error response format

### AI/ML Agent
- [ ] AI API keys only in server-side functions
- [ ] Fallback model chain implemented
- [ ] AI responses validated before use
- [ ] Token usage logged

### Billing Agent
- [ ] Stripe secret key server-side only
- [ ] Webhook signature verification present
- [ ] Subscription changes are idempotent

### Testing Agent
- [ ] Unit tests added for new functions/components
- [ ] E2E tests added for new user flows
- [ ] Existing tests still pass
- [ ] Mocks match actual API contracts

### DevOps Agent
- [ ] `.env.example` updated with new variable names
- [ ] No impact on build configuration
- [ ] CI pipeline passes

## Test Plan

<!-- How to verify this PR works -->

1.
2.
3.
