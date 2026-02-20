# Adversarial Code Review Checklist

This checklist is designed to find problems. A good review finds **3-10 specific issues**.
**"Looks good" is NOT an acceptable review outcome.**

---

## 1. Correctness

### Logic
- [ ] Does the code do what the story requires?
- [ ] Are all acceptance criteria met?
- [ ] Are edge cases handled?
- [ ] Are error conditions handled gracefully?

### Data
- [ ] Are inputs validated?
- [ ] Are outputs correct for all inputs?
- [ ] Are null/undefined cases handled?
- [ ] Are array bounds checked?

---

## 2. Security (CRITICAL)

### Authentication & Authorization
- [ ] Is auth required where needed?
- [ ] Are RLS policies in place for new tables?
- [ ] Are service role keys server-side only?
- [ ] Are JWT tokens validated?

### Input Validation
- [ ] Is user input sanitized?
- [ ] Is SQL injection prevented (parameterized queries)?
- [ ] Is XSS prevented (output encoding)?
- [ ] Are file uploads validated?

### Secrets
- [ ] No hardcoded API keys or secrets?
- [ ] No secrets in frontend code?
- [ ] Environment variables used correctly?

### OWASP Top 10
- [ ] Injection prevention
- [ ] Broken authentication checks
- [ ] Sensitive data exposure
- [ ] Security misconfiguration

---

## 3. Performance

### Efficiency
- [ ] No unnecessary re-renders (React)?
- [ ] No N+1 query patterns?
- [ ] Appropriate use of caching?
- [ ] Large lists virtualized?

### Resources
- [ ] No memory leaks?
- [ ] Event listeners cleaned up?
- [ ] Subscriptions unsubscribed?
- [ ] Files/connections closed?

### Database
- [ ] Queries use indexes?
- [ ] No SELECT * in production?
- [ ] Pagination for large datasets?

---

## 4. Code Quality

### Readability
- [ ] Clear variable/function names?
- [ ] Functions are small and focused?
- [ ] Complex logic has comments?
- [ ] No magic numbers?

### Maintainability
- [ ] DRY principle followed?
- [ ] Single responsibility principle?
- [ ] No deeply nested code?
- [ ] Consistent formatting?

### Patterns
- [ ] Follows existing codebase patterns?
- [ ] Consistent with AGENTS.md rules?
- [ ] No anti-patterns?

---

## 5. Testing

### Coverage
- [ ] Unit tests for new functions?
- [ ] Edge cases tested?
- [ ] Error paths tested?
- [ ] Coverage meets 70% target for critical paths?

### Quality
- [ ] Tests are meaningful (not just coverage)?
- [ ] Tests are independent?
- [ ] Mocks used appropriately?
- [ ] No flaky tests?

---

## 6. Architecture Compliance

### AGENTS.md Rules
- [ ] Follows rules for relevant agent(s)?
- [ ] File changes in correct scope?
- [ ] Handoff protocols followed?

### Tech Stack
- [ ] React 18 patterns (not 19)?
- [ ] Tailwind CSS 3.4 (not v4)?
- [ ] TypeScript strict mode compliant?

### i18n
- [ ] All user text uses `t()`?
- [ ] All 5 locales updated (fr, en, de, es, it)?
- [ ] No hardcoded strings?

---

## 7. Documentation

- [ ] Complex code commented?
- [ ] README updated if needed?
- [ ] API changes documented?
- [ ] CHANGELOG updated for significant changes?

---

## Review Summary

### Issues Found

| # | Severity | Category | Description | File:Line |
|---|----------|----------|-------------|-----------|
| 1 | Critical/Major/Minor | [Category] | [Description] | [Location] |
| 2 | | | | |
| 3 | | | | |

### Verdict
- [ ] **Request Changes**: Critical/major issues must be fixed
- [ ] **Approve with Comments**: Minor issues, can fix later
- [ ] **Approve**: All issues addressed (rare for first review)

### Reviewer
- **Name**:
- **Date**:
- **Time Spent**:

---

## Auto-Fix Suggestions

[List specific fixes that can be auto-applied with user approval]

1. [Fix description] - [File:Line]
2. [Fix description] - [File:Line]
