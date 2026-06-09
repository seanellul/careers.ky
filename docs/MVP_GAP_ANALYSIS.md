# MVP Gap Analysis — Specs vs. Current Platform

**Date:** June 9, 2026
**Inputs:** LogFrame v1.0 (Rochelle), MVP Specification (May 2026), Website Build Specification Year 1 (May 2026), current codebase (main @ June 9).
**Status:** Internal working document for the MVP scope conversation. Nothing here is a commitment.

---

## 1. The headline

The three documents describe **two different products**, and the current platform is a third thing that overlaps both:

- The **LogFrame** describes the platform we have: WORC-synced job board, candidate profiles, double opt-in introductions, compliance reports, career development ecosystem.
- The **MVP/Year-1 specs** describe a recruiter-replacement ATS: native employer job postings with enforced fields, in-platform messaging, application pipelines, tiered billing, and candidate status ranking.
- The **current codebase** is a WORC aggregation + introductions marketplace with an admin CRM — strong on data/taxonomy (CISCO matching, 20k postings, scoring), absent on messaging, billing, native postings, and the candidate status model.

These can converge, but four decisions have to be made first (Section 2). Until they are, "feature list prioritised and frozen" (LogFrame M1 milestone) can't honestly happen.

---

## 2. Decisions needed before any building (Phase 0)

### D1. The dual job-source problem — *the* architecture decision
The specs assume employers post jobs on the platform (salary required, 3+ qualifications, district dropdown, early-access windows). The current platform has **no native posting flow at all** — 100% of jobs come from the WORC feed, which we don't control and can't enforce fields on.

Neither doc addresses this. The resolution is almost certainly a **two-class job model**:

| | Native postings | WORC-synced postings |
|---|---|---|
| Source | Employer posts on-platform | Government feed (sync) |
| Field enforcement | Yes (salary, quals, district) | No — display what WORC gives us |
| Caymanian 24h early access | Possible | **Impossible — already public** |
| ATS / applications | Full pipeline | Express Interest → lead gen (current behaviour) |
| Compliance evidence | Full audit trail | Partial (interest log only) |

Note: several MVP features (#10 early access, #15 salary required, #16 JD fields) only make sense for native postings. The WORC board remains the traffic/SEO engine; native postings become the paid product.

### D2. Auth model
Spec mandates email + password registration (Screen 1). Current platform is passwordless (magic link API + OAuth UI). **Recommendation: keep passwordless** — it's already built, more secure, and faster than the spec's own 60-second target. Push back on the spec rather than build password infrastructure. (Separate finding: the sign-in UI currently shows *only* Google/LinkedIn — the email magic-link option was dropped from the form and should probably return regardless.)

### D3. Tier structure and pricing — three conflicts to resolve
1. **LogFrame:** two paid tiers — Pro CI$299/mo, Enterprise CI$799/mo. **Specs:** three paid tiers — Standard / Premium / Enterprise (+ free Government). Names, count, and prices all differ; LogFrame itself says "Need to talk through pricing."
2. **Compliance dashboard:** Year-1 spec lists it as FREE/Standard (11.2b); MVP spec calls it "Core Premium value — employers need this to justify the subscription." It can't be both — and it's the main thing employers will pay for, so this is a revenue-model decision, not a detail.
3. **WORC audit trail export:** Enterprise in the tier table (11.1), Premium in the feature table (11.3j).

### D4. Introductions vs. messaging
LogFrame: "double opt-in introduction system" (what's built). Specs: full in-platform messaging with contact-detail gating, plus "all hiring must happen through the platform" enforced by ToS and view-tracking. The messaging system is one of the two biggest builds on the list. Decide whether MVP launches with enhanced introductions (cheaper, working today) or full messaging (spec-faithful, weeks of work).

---

## 3. Scorecard — the 25 MVP features vs. what exists

**Legend:** ✅ built · 🟡 partial · ❌ not built · Effort: S (<1 day) / M (days) / L (week+) / XL (multi-week)

### Section A — Platform rules
| # | Feature | Status | Notes | Effort |
|---|---|---|---|---|
| 1 | Caymanian priority ranking, DB-level | 🟡 | Scoring gives +5 Caymanian *bonus*; spec wants absolute tier ordering (Caymanian → PR → RERC → WP). Schema only has `is_caymanian` boolean — **needs a status enum**, the single most schema-invasive change. | L |
| 2 | Agency block at registration | ❌ | Admin verification queue exists (domain checks) and can host this; detection is manual review, not magic. | M |
| 3 | All communication through portal | ❌ | No messaging system exists. Introductions carry one message. Biggest single build with #20. | XL |
| 4 | Government free access | ❌ | No tier system at all yet. Trivial once tiers exist. | S (after tiers) |

### Section B — Candidate side
| # | Feature | Status | Notes | Effort |
|---|---|---|---|---|
| 5 | 5-minute registration | 🟡 | Onboarding flow exists; needs status declaration step + profile-type step. Passwordless already beats the time target. | M |
| 6 | Three profile types + employer hard-block | ❌ | `is_discoverable` ≈ Open/Closed. Selective mode + company block list (enforced in queries) is new. The block list is the culturally critical feature — agree it's MVP. | L |
| 7 | Status badges + verification | 🟡 | Caymanian badge exists. PR/RERC/Permit badges need the status enum (#1) + document upload + admin review (queue exists for employers, extend to candidates). No file storage yet → Vercel Blob. | L |
| 8 | Preference form (5 core fields) | 🟡 | Have: availability toggle, salary_min, CISCO interests. Missing: notice period, exclude-companies block. | M |
| 9 | Salary assessment on sign-up | ❌ | Spec says hardcode bands. **We can do better:** 20,955 WORC postings with salary data → compute real Cayman bands by occupation/sector today. Genuine differentiator vs. spec. | M |
| 10 | Caymanian 24h early access | ❌ | **Only valid for native postings** (D1). Notification machinery (match-alerts) already exists to power it. | M (after D1) |
| 11 | Application status tracking | 🟡 | Introductions have status/stage/rejection_reason fields already. Needs the status enum expanded (Applied/Reviewed/Shortlisted/Offer/Hired) + candidate-facing view. | M |
| 12 | CV design tool | ❌ | No file uploads anywhere in the platform. Needs storage, parsing, PDF generation. Real build; the "primary reason candidates complete profiles" claim is plausible but untested. | L |
| 13 | Job alert notifications | ✅ | `match_alerts` with frequency + email digests, runs off the cron. Needs instant-frequency option. | S |

### Section C — Job board
| # | Feature | Status | Notes | Effort |
|---|---|---|---|---|
| 14 | Job board, live + searchable | ✅ | Built, with search/filters and 20k postings. Industry tabs w/ live counts = UI work on existing data. | S–M |
| 15 | Salary required at posting | ❌ | Requires native posting flow (D1). | — (in #posting) |
| 16 | Non-negotiable JD fields | ❌ | Same. Native posting flow itself: form, validation, moderation, display → | L |
| 17 | Notice-period / immediate-start filter | ❌ | Needs `notice_period` on candidates (#8) then trivial filter in talent search. | S (after #8) |

### Section D — Employer side
| # | Feature | Status | Notes | Effort |
|---|---|---|---|---|
| 18 | Employer registration + tiers | 🟡 | Accounts, claiming, domain verification, team management all exist. Tier column + entitlement checks are new (blocked on D3). | M |
| 19 | Stripe billing | ❌ | Nothing exists. Stripe subscription + webhooks + entitlement sync. | L |
| 20 | Basic ATS (pipeline + messaging) | 🟡 | Shortlists + introductions + match scoring ≈ proto-ATS. Drag-drop pipeline UI + stage emails buildable on introductions. Messaging is the XL part (see #3). | L (pipeline) + XL (messaging) |
| 21 | Compliance dashboard | 🟡 | Per-job compliance report + CSV export already built (genuinely ahead of spec here). Needs roll-up: Caymanian hire rate %, permit ratio, WORC-formatted summary. | M |
| 22 | Permit status per candidate card | 🟡 | Blocked on status enum (#1); display is trivial after. | S (after #1) |

### Section E — Growth & trust
| # | Feature | Status | Notes | Effort |
|---|---|---|---|---|
| 23 | Recommend-a-friend | ❌ | Referral links, attribution, reward gating. Self-contained. | M |
| 24 | WORC section on homepage/About | 🟡 | Content work — but see Risk R1 before displaying any "collaboration" badge. | S |
| 25 | Admin panel | ✅ | Arguably ahead of spec: pipeline CRM (500 employers), verification queue, candidate/employer admin, outreach tooling. | — |

**Totals: 4 built, 9 partial, 12 not built.** The two XL items are messaging (#3/#20) and the candidate status model ripple (#1 → 6, 7, 22). Stripe (#19) and native postings (#16) are the other long poles.

---

## 4. Critique — things to push back on or get checked

### R1. The WORC relationship is asserted, not established *(existential)*
The LogFrame lists "WORC/Immigration accepts platform records as valid documentation" as an *assumption*, and the spec requires a WORC badge and "we share hiring data with the authorities" copy on the homepage. Today the platform's WORC relationship is **a data feed accessed with an auth token** — there is no formal agreement. Displaying a collaboration badge without one is a reputational and possibly legal risk, and the entire compliance product (Output 2, the main revenue justification) rests on this assumption. **Validating it with WORC should precede building deeper compliance features.** The risk register rates "WORC feed disrupted" as Low likelihood; given the platform's total dependence on an informal feed, I'd rate it Medium and prioritise the mitigation (formal relationship + manual upload fallback, which doesn't exist yet).

### R2. Legally aggressive clauses need the lawyer *(you're seeing them this week anyway)*
- "Off-platform hires of registered candidates are a ToS breach… system tracks employer candidate views to create an audit trail" — enforceability is doubtful, the tracking is privacy-sensitive, and it sits awkwardly next to the spec's own GDPR section.
- "HR representation declaration… enforceable against agencies claiming commissions" (9.3d) — could this make careers.ky itself an employment agency under Cayman law, with whatever licensing that implies? Exactly the kind of question to put to the entity-formation lawyer now.
- LinkedIn scraping + agency bypass (Year 1, post-MVP) — scraping LinkedIn violates their ToS and they litigate; budget for this feature possibly never shipping in that form.

### R3. Internal contradictions to fix in the docs
- Tier conflicts (see D3).
- Year-1 spec section numbering is broken (two Section 9s, two 12s, two 13.2s) — cosmetic but will cause referencing confusion with the dev team.
- LogFrame has unresolved inline comments ("500+ ~~1,000?~~ candidates", "100+ ~~+20~~ employers", "Need to talk through pricing") — fine for a draft, but the indicators can't be "objectively verifiable" until the numbers are agreed.
- LogFrame's "≥ 1,860 live job postings" is oddly specific — it's roughly the current WORC active count, i.e., an indicator we already meet by definition. Consider reframing as "WORC sync uptime ≥ 99%" (operational) + "≥ N native postings" (commercial).

### R4. Measurement infrastructure doesn't exist yet
The LogFrame's means of verification — analytics dashboard, retention rate, NPS surveys, funnel analytics — are mostly unbuilt. PostHog is wired in, but there's no event taxonomy, no NPS mechanism, no retention reporting. If the LogFrame is the accountability document, instrumenting these is itself an MVP work item (M effort) and should happen *early* so baseline data exists.

### R5. Where the platform is ahead of the specs
Worth saying out loud in the team conversation, because the specs silently discard real assets:
- **CISCO occupation taxonomy + scoring engine** — the specs' "industry tabs" and "match quality ranking" are a flattened version of what already exists.
- **Salary data from 20k WORC postings** — makes the salary assessment real on day one instead of "hardcoded bands [to be loaded]".
- **Compliance report with CSV export** — already live; LogFrame's "compliance report feature live by Month 3" is already met.
- **Admin CRM with 500 scored employer prospects** — the M1–2 "employer outreach (20 demos)" activity has its tooling built.
- **Job alerts + cron infrastructure** — powers early-access and the newsletter with modest work.

### R6. Scope realism
12 not-built features including two XL builds is **not a small MVP** — it's roughly a quarter of build work even moving fast. The MVP spec's own cut philosophy ("if removing it just makes the platform less polished, it comes out") argues for cutting deeper for the *pilot*: the 5–10 employer compliance pilot (LogFrame M3) needs the status model, native postings, compliance roll-up, and enhanced introductions — it does not need messaging, Stripe, CV generation, or referrals. Suggest an explicit "Pilot scope" inside the MVP scope.

---

## 5. Suggested build order (after Phase 0 decisions)

| Phase | Work | Depends on |
|---|---|---|
| **1. Foundations** | Candidate status enum + migration; document upload (Vercel Blob) + verification queue extension; profile types + company hard-block; introduction status enum expansion; PostHog event taxonomy | D2 |
| **2. Ranking & search** | Tier-ordered ranking in talent search (status before score); notice period field + immediate-start filter; preference form completion | Phase 1 |
| **3. Native postings** | Posting flow with enforced fields; two-class job display; Caymanian 24h early access (reuse match-alerts); industry tabs UI | D1, Phase 1 |
| **4. Employer value** | Compliance roll-up dashboard (reuse report); ATS pipeline UI on introductions; tier column + entitlements | D3, Phase 3 |
| **5. Revenue** | Stripe subscriptions + webhooks; government free flag; tier gating live | D3, Phase 4 |
| **6. Growth** | Salary assessment from WORC bands; recommend-a-friend; newsletter (reuse digest infra); WORC section content | R1 resolved |
| **Deferred from MVP 25** | Messaging system (run pilot on enhanced introductions; build messaging once pilot feedback confirms need); CV design tool (validate demand with a CV-upload-only step first) | — |

The two deferrals are the contentious ones — they're MVP features #3/#20 and #12 in the spec. Rationale: messaging is the largest build on the list and the introduction model already enforces "contact through platform" for the pilot's purposes; CV generation is a conversion bet that can be validated with an upload field before building a PDF engine.

---

## 6. Open questions for the team meeting

1. D1–D4 above — the four blocking decisions.
2. Who owns the WORC conversation, and what's the minimum formal arrangement before the badge/compliance product ships? (R1)
3. Pilot scope vs. MVP scope — agree the cut line (R6).
4. Pricing workshop — LogFrame flags it, specs assume it's done.
5. Lawyer agenda additions: HR representation clause, off-platform hire enforcement, agency blocking, scraping. (R2)
6. Do we accept passwordless auth as a spec amendment? (D2)
7. LogFrame indicator cleanup — resolve the inline comments, replace the 1,860 indicator, add measurement-infrastructure as a work item. (R3, R4)
