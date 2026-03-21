---
description: Core project conventions for careers.ky
globs: *
---

# careers.ky Project Conventions

## Stack
- **Framework**: Next.js App Router — server components by default, add `"use client"` only when state/effects/browser APIs are needed
- **Database**: postgres.js via `getDb()` from `lib/db.js` — no ORMs, use tagged template literals for parameterized queries
- **Styling**: Tailwind CSS with dark theme (neutral-950 background), shadcn/ui components
- **Auth**: Magic link + session cookie flow, use `getSession()` from `lib/auth.js` for auth checks

## Data Model
- WORC job postings imported from government feed
- CISCO occupation codes for job classification
- Employer/candidate model with Express Interest as primary interaction
- Express Interest is the **primary CTA** — always prioritize it over WORC links

## Code Style
- Conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- No hardcoded secrets — always use environment variables
- Prefer simple, direct solutions over abstractions

## Development
- Dev server runs on **port 3001**
- Never kill Chrome or browser processes without asking the user first
- Keep the dev server running in tmux or a separate terminal
