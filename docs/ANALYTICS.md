# Analytics — Event Taxonomy

PostHog (`NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`). Client events via
`posthog-js` (initialised in `components/PostHogProvider.jsx`, DNT respected); server
events via `lib/analytics-server.js` (HTTP capture, fire-and-forget, tagged `source: server`).

## Identity

Signed-in users are identified as `candidate-<id>` / `employer-<employerAccountId>`
with a `role` person property. No emails or names are sent to PostHog. Server-side
captures use the same distinct IDs so funnels stitch across client and server.

## Events

| Event | Source | Properties | Fires when |
|---|---|---|---|
| `$pageview` / `$pageleave` | client | url | SPA navigation |
| `sign_up_started` | client | auth_type | Auth modal opened |
| `auth_method_chosen` | client | method, auth_type | OAuth provider clicked |
| `onboarding_started` | client | — | Profile setup mounted |
| `sign_up_completed` | client | status, profile_type, interests_count, **registration_seconds** | Onboarding saved |
| `profile_updated` | client | skills_count, interests_count, profile_type | Profile edit saved |
| `express_interest_clicked` | client | job-related | CTA clicked (intent) |
| `interest_expressed` | server | on_platform_employer, has_message | Interest persisted (outcome) |
| `introduction_sent` | server | count, has_job, has_message | Employer sends intro(s) |
| `introduction_responded` | server | responder, accepted | Either side accepts/declines |
| `stage_changed` | server | from, to, rejection_reason | Pipeline stage moves |
| `filter_applied` | client | filter details | Job search filters |
| `nps_submitted` | client | score (0–10), role | NPS survey answered |
| `nps_dismissed` | client | role | NPS survey closed |

## LogFrame indicator mapping

| Indicator | How to measure in PostHog |
|---|---|
| 30%+ monthly active retention | Retention insight on `$pageview`, identified users, by `role` |
| NPS ≥ 40 (both audiences) | `nps_submitted`: % promoters (9–10) − % detractors (0–6), split by `role` |
| Profile completion ≥ 70% | Funnel `onboarding_started` → `sign_up_completed` |
| Introduction acceptance ≥ 40% | `introduction_responded` where `accepted = true` / all |
| 5-minute registration (MVP #5) | `registration_seconds` distribution on `sign_up_completed` |
| Candidate→hire funnel | `sign_up_completed` → `interest_expressed` → `introduction_responded` → `stage_changed (to: hired)` |

## Conventions

- Event names: snake_case, past tense for outcomes, `_clicked`/`_started` for intent.
- Business outcomes are captured **server-side** (client events can be lost to ad
  blockers; server events are the source of truth for funnels).
- Never send PII (emails, names, free-text messages) as properties.
- NPS shows on dashboards from the 3rd visit, max once per 90 days per outcome
  (`components/NPSSurvey.jsx`).
