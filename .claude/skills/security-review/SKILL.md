---
name: security-review
description: Security audit checklist for pre-deployment review
triggers:
  - security review
  - security audit
  - pre-deploy check
  - vulnerability check
  - security checklist
---

# Security Review

17-item pre-deployment security checklist for careers.ky. Run through each item, check the codebase, and report findings.

## Checklist

### Authentication & Sessions
1. **Magic link tokens**: Single-use, time-limited (< 15 min), invalidated after use
2. **Session cookies**: HttpOnly, Secure, SameSite=Lax/Strict, appropriate expiry
3. **Session validation**: `getSession()` called on every protected route
4. **Logout**: Sessions properly invalidated server-side on logout

### Authorization
5. **Role checks**: Admin routes verify admin role, not just authentication
6. **Resource ownership**: Users can only access/modify their own data
7. **API route protection**: No unprotected API routes that should require auth

### Input Validation
8. **API inputs**: All request body/query params validated before use
9. **File uploads**: Type, size, and content validation (if applicable)
10. **SQL injection**: All queries use postgres.js tagged templates (parameterized)

### Output & Client Security
11. **XSS prevention**: No `dangerouslySetInnerHTML` without sanitization
12. **Sensitive data exposure**: No secrets, tokens, or PII in client bundles or responses
13. **Error messages**: No stack traces or internal details leaked to clients

### Infrastructure
14. **Environment variables**: All secrets in `.env.local`, not committed to git
15. **CORS**: Appropriate origin restrictions on API routes
16. **Rate limiting**: Applied to auth endpoints and public form submissions
17. **Dependencies**: No known critical vulnerabilities (`npm audit`)

## How to Run

For each item:
1. Search the codebase for relevant patterns
2. Assess: PASS / FAIL / WARN / N/A
3. For FAIL/WARN: provide file path, line number, and recommended fix

## Output Format

```
## Security Review Results

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Magic link tokens | PASS | Expires in 10 min, single-use |
| 2 | Session cookies | WARN | Missing SameSite attribute |
...

### Critical Issues
[Details of any FAIL items with remediation steps]

### Recommendations
[Nice-to-have improvements]
```
