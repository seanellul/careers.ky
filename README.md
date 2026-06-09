# careers.ky

Employment platform for the Cayman Islands. Jobs are imported daily from the WORC government feed (my.egov.ky), classified against CISCO occupation codes, and matched to candidate profiles. Employers claim their profile, search ranked talent, and connect with candidates through introductions — **Express Interest** is the primary interaction on the platform.

## Tech Stack

- **Next.js 16** (App Router, server components by default) — plain JavaScript, no TypeScript
- **PostgreSQL** on Neon serverless (`@neondatabase/serverless`, tagged template literals — no ORM)
- **Tailwind CSS** with the warm Caymanian theme in `lib/theme.js`, shadcn/ui components
- **Auth**: passwordless magic links (Resend email) + session cookie, see `lib/auth.js`
- **Hosting**: Vercel (cron-driven WORC sync at 06:00 UTC, see `vercel.json`)
- GSAP (homepage animations), Lucide React (icons), PostHog (analytics)

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at **http://localhost:3001** (port 3001, not 3000).

Create `.env.local` based on `.env.example` (database, WORC token, Resend, cron secret, admin email).

With `DEV_MODE=1` set locally, the orange **DEV** toolbar (bottom-right) includes **New candidate → profile setup**: it signs you in as a fresh synthetic user so you can exercise candidate onboarding repeatedly without real emails. These dev routes are hard-disabled on all Vercel deployments.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run migrate` | Run schema migrations (`scripts/migrate.js`) |
| `npm run seed` | Seed taxonomy + job data from `scripts/data/` |
| `npm run seed-skills` | Seed skills taxonomy |
| `npm run seed-pipeline` | Seed the 500-employer sales pipeline CRM |
| `npm run sync-worc` | Manually sync jobs from the WORC feed |

One-off SQL migrations live in `migrations/` with timestamped filenames and `-- UP` / `-- DOWN` sections.

## Project Structure

```
app/                     # Next.js App Router
├── (candidate-dashboard)/  # Candidate dashboard, interests, alerts
├── employer/               # Employer profiles, dashboard, talent search, team
├── admin/                  # Admin + sales pipeline CRM (gated by ADMIN_EMAIL)
├── api/                    # API routes (auth, jobs, introductions, cron, admin)
├── careers/                # Public job search
└── jobs/[jobId]/           # Job detail pages
components/              # Shared React components (shadcn/ui in components/ui)
lib/                     # Data layer (data.js), auth, scoring, theme, caching
scripts/                 # Migrations, seeds, WORC sync (seed CSVs in scripts/data/)
content/                 # Marketing copy, compliance docs, pipeline CSVs
migrations/              # Timestamped one-off SQL migrations
```

## Admin

`ADMIN_EMAIL` (comma-separated) must match the signed-in account's email to access `/admin`. If unset in production, the admin area is disabled. See `ADMIN_CRM_README.md` and `QUICK_START_CRM.md` for the sales pipeline CRM.

## License

Private
