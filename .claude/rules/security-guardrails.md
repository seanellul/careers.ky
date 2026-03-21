---
description: Security guardrails for all code changes
globs: *
---

# Security Guardrails

## Input Validation
- Validate all user input at API route boundaries (Zod schemas or manual checks)
- Never trust client-side data — always re-validate on the server

## SQL Injection Prevention
- Use postgres.js tagged template literals exclusively — they auto-parameterize
- Never concatenate user input into SQL strings
- Example: `sql\`SELECT * FROM users WHERE id = ${userId}\`` (safe)

## XSS Prevention
- Never use `dangerouslySetInnerHTML` without proper sanitization
- React auto-escapes JSX expressions — don't bypass this without good reason
- Sanitize any HTML content from external sources before rendering

## Auth & Authorization
- Every protected API route must call `getSession()` and verify the user
- Check authorization (not just authentication) — verify the user has permission for the specific resource
- Never expose admin routes without role checks

## Secrets Management
- No secrets, API keys, or credentials in client components
- No secrets committed to git — use `.env.local` and verify `.gitignore` coverage
- Reference secrets only via `process.env` in server-side code

## Rate Limiting
- Apply rate limiting to public-facing API endpoints (auth, form submissions)
- Use appropriate limits based on endpoint sensitivity
