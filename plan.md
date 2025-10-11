## Lifestyle → Career Mapper: Implementation Plan (Hackathon)



### Pitch: How We Deliver Lifestyle → Career Fit (and Make It Actionable)
We turn Cayman’s job market into a personalized map of possibility.

How it works:
1. Preference capture: A clean, 3-minute stepper gathers what matters—balance, pay, commute, and work style.
2. Smart matching: We enrich live WORC listings with local transit and cost-of-living context, normalize pay, and compute a transparent 0–100 Fit score.
3. Clear explanations: Every score is broken down—compensation fit, commute, schedule, qualifications—so decisions feel informed, not opaque.
4. Effortless handoff: When you’re ready, “Apply on WORC” opens the official portal with the role reference and helpful linking—no dead ends, no confusion.
5. Designed for momentum: Subtle, Caymanesque animations guide attention; favorites and a simple tracker help you keep moving towards interviews.

Why it matters:
- Caymanians can weigh career moves not just by title, but by how they want to live—today and over the next 24 months.
- Employers benefit from better-aligned applicants who stay longer and grow faster.

Built on our code today:
- `src/careers.jsx` provides the layout, live WORC feed, and UI controls—we’ll swap in the interactive mapper in place of static pathway cards and show Fit badges in the Jobs grid.
- `src/animations/gsapEffects.js` powers smooth, accessible motion that keeps focus on choices.
- `vite.config.js` proxy enables reliable job data in dev; outbound links always open safely to the official portal.

In a weekend, we deliver a working prototype that makes job search feel human—rooted in Cayman’s rhythms—and actionable on WORC in one click.



### 0) Purpose
Design and prototype a platform that maps personal lifestyle goals to real roles in Cayman, using WORC job data plus local economic insights. Outcomes: a guided “mapper” that collects preferences, computes a match score for jobs, and presents ranked, explainable results with GSAP-powered scrollytelling.

### 1) Current Codebase Anchors (where we’ll integrate)
- `src/careers.jsx` — primary page and sections (Hero, Pathway steps, Explore, JobsFeed, FAQ, CTA, Footer). Jobs are rendered via `JobsFeed`, which already fetches from WORC and has DevTests. We will convert the “Pathway (scrollytelling)” into an interactive mapper.
- `src/animations/gsapEffects.js` — reusable GSAP hooks for hero intro, scroll reveals, marquee control, hover floats, accordion motion, CTA pulse, and footer reveal. We’ll reuse for mapper interactions.
- `vite.config.js` — dev proxy to WORC (`/api/worc`) to avoid CORS in development.

Key touchpoints to extend:
- Replace static “Pathway” cards with an interactive stepper (preferences → compute → matches). Jobs section will display match scores and allow filtering/sorting by lifestyle fit.

### 2) Data Inputs
2.1 WORC Jobs (already wired)
- Source: `https://my.egov.ky/o/worc-job-post-search/?p_auth=...` (proxied via `/api/worc`).
- Fields used today in `src/careers.jsx`: `workType`, `jobLocation`, `hoursPerWeek`, `educationLevel`, `yearsOfExperience`, `approvalDate/startDate/endDate`, salary (`minimumAmount`, `maximumAmount`, `kydPerAnnum`, `salaryShort`), `employerName`, `jobTitle`.
- We’ll derive additional features (booleans and normalized metrics) for the matcher.

2.2 Enrichment Datasets (static JSON under `src/data/` for hackathon speed)
- Cost-of-living indices by district (housing, groceries, utilities) → `col_index.json`.
- Commute time estimates between districts (simple matrix) → `commute_matrix.json`.
- Remote/Hybrid feasibility by track/industry → `work_arrangements.json`.
- Education equivalency mapping (WORC codes → readable labels already exist; extend with program tags) → `education_map.json`.
- Salary normalization helpers (KYD/USD parity and frequency conversion) → constants/util.

Data ingestion approach
- Import static JSON in the client; no backend required for hackathon.
- Keep fallbacks if a file is missing; never block the UI.

### 3) Preference Model (what the user tells us)
We capture a “PreferenceProfile”:
```ts
type PreferenceProfile = {
  priorities: {
    lifestyleBalance: number;    // beach-time balance, wellness
    compensationGrowth: number;  // salary now + growth potential
    communityImpact: number;     // impact orientation
  };
  schedule: {
    workType: number[];          // map to WORK_TYPE codes (full-time/part-time/shifts/weekends)
    hoursPerWeek: [min, max];
  };
  commute: {
    homeDistrict: number;        // LOCATION_KEY code
    maxMinutes: number;          // tolerance
  };
  arrangement: {
    remote: boolean;
    hybrid: boolean;
    onsite: boolean;
  };
  growth: {
    targetSalaryKYD: number;     // desired range
    learningFocus: string[];     // tags to encourage upskilling alignment
  };
  qualifiers: {
    educationLevel: number;      // user’s current level
    yearsExperience: number;     // user’s current exp
  };
};
```

UX capture
- Use a stepper (5 steps) mirroring current copy: priorities → schedule/commute → growth/salary → matches → tracker.
- Each step updates a central state; preview the evolving match score.

### 4) Job Feature Engineering (client-side)
For each job from WORC, derive:
- `isRemotePossible`, `isHybridPossible` from `work_arrangements.json` (track/industry heuristics or employer tags).
- `targetSalaryKYD` normalized from `salaryShort` or numerical fields (convert to KYD per annum).
- `commuteMinutes` derived via `commute_matrix.json` (homeDistrict → jobLocation).
- `meetsEducation` / `meetsExperience` booleans.
- `workTypeScore` based on match with user’s schedule preferences.
- `colAdjustment` based on district index; used to rank compensation net-of-COL.

Implementation:
- Create `src/lib/deriveJobFeatures.js` to accept raw WORC job and return an enriched `JobFeatures` structure.
- Memoize derivations per job id to avoid recompute.

### 5) Matching Engine (scoring)
Goal: weighted, explainable score in range 0–100 with partial credit.

Components and weights (tunable):
- Compensation fit (0–30): closeness of job’s normalized salary to `targetSalaryKYD`, adjusted by district COL.
- Lifestyle balance (0–20): proxy via work type (hours proximity to desired; weekends/shifts penalty if user prefers balance).
- Commute tolerance (0–15): penalty if `commuteMinutes` exceeds `maxMinutes`.
- Arrangement fit (0–10): remote/hybrid/onsite flags matching user’s arrangement preferences.
- Education/Experience (0–15): full/partial match with soft penalty for near-misses; suggest upskilling if shortfall.
- Community impact (0–10): track tags (e.g., education, civic) boost if the user cares.

Formula sketch (pseudo):
```js
function scoreJob(jobFeatures, prefs) {
  const comp = 30 * proximity(jobFeatures.salaryKydPaAdj, prefs.growth.targetSalaryKYD);
  const life = 20 * scheduleBalance(jobFeatures.hoursPerWeek, prefs.schedule);
  const commute = 15 * commuteFit(jobFeatures.commuteMinutes, prefs.commute.maxMinutes);
  const arrange = 10 * arrangementFit(jobFeatures, prefs.arrangement);
  const qual = 15 * qualifierFit(jobFeatures, prefs.qualifiers);
  const impact = 10 * impactFit(jobFeatures, prefs.priorities.communityImpact);
  return clamp(0, 100, comp + life + commute + arrange + qual + impact);
}
```
Helper functions will return 0..1, often using smooth ramps (e.g., sigmoid/linear falloff) to feel fair.

Implementation:
- `src/lib/match.js` exports `scoreJob(job, prefs, enrichment)` and `explainScore(job, prefs)` returning component breakdown for UI tooltips.
- Unit-testable via DevTests style or small Jest-like harness, but we can start with in-UI tests (see §10).

### 6) UI Architecture & Components
New directories:
- `src/components/mapper/`
  - `MapperProvider.jsx` (React context + reducer for `PreferenceProfile`)
  - `StepPriorities.jsx`
  - `StepScheduleCommute.jsx`
  - `StepGrowthSalary.jsx`
  - `StepMatches.jsx` (renders ranked jobs with score + explanation)
  - `StepTracker.jsx` (save favorites, application steps)

State management:
- Keep it simple with Context + `useReducer`. Persist to `localStorage` so refreshes keep preferences.

Integration points in `src/careers.jsx`:
- Replace static “Pathway” cards with the step components above inside the existing layout. The sticky left column remains the narrative; the right column becomes the live stepper.
- The CTA “Explore matches” button triggers navigation to `#map` stepper and focuses Step 4 (matches) if profile is filled.
- In Jobs section, display a small “Fit X%” badge on each card when a profile exists; allow sorting by Fit.

### 7) Jobs Pipeline in the UI (today → mapper-aware)
Current list and controls:
```12:220:src/careers.jsx
      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {view.map((j, idx) => (
              <Card key={`${j.jobPostId || idx}`} className="job-card group bg-white/5 border-white/10 hover:border-white/20 transition">
                <CardContent className="p-5 space-y-2">
                  <div className="text-xs uppercase tracking-wide text-emerald-300">{WORK_TYPE[j.workType || 0] || "Role"}</div>
                  <div className="font-medium leading-snug group-hover:text-white">{j.jobTitle || "Untitled role"}</div>
```

Planned updates:
- After fetching, derive features per job and compute a match score (if preferences exist). Use `useMemo` to produce `scoredJobs`. Respect existing filters (`q`, `loc`, `type`) and then re-sort by user-selected `sort` or by “Best Match”.
- UI: add a right-aligned subtle badge “Fit 78%” and an info tooltip with score breakdown (components from §5).
- Animation: reuse `useStaggerList` to cascade matches upon changes for a polished feel.

### 8) GSAP & Narrative Layer
- Use existing hooks in `src/animations/gsapEffects.js`:
  - `useHeroIntro`, `useFadeInOnScroll`, `useMarqueeControl`, `useAccordionMotion`, `useCTAGradientPulse`, `useFooterReveal`.
- Add small micro-interactions for the stepper: score number yoyo pulse on improvement, subtle parallax on track cards, and progress line reveal as steps are completed.
- Respect reduced motion (already handled by hooks); ensure all new animations opt-in to this behavior.

### 9) Data Normalization & Utilities
- `src/lib/currency.js`: normalize to KYD per annum; parse `salaryShort` gracefully as a fallback.
- `src/lib/commute.js`: lookup minutes via `commute_matrix.json`.
- `src/lib/normalize.js`: clamp/scales, sigmoid helpers, and ranking utilities.

### 10) Testing Strategy (within hackathon constraints)
- Expand `DevTests` in `src/careers.jsx` to include:
  - Salary normalization tests across common shapes (min/max vs `kydPerAnnum` vs `salaryShort`).
  - Commute fit calculations with edge cases (0, equal to max, above max).
  - Score composition totals sum and are clamped 0–100.
- Add a debug panel in dev (behind a query param) to show the current `PreferenceProfile` and the score breakdown for the first 3 jobs.

### 11) Milestones & Deliverables
- M0 (Setup): folders, proxy verified, enrichment JSON placeholders, `MapperProvider` scaffold. Target: 2–3 hours.
- M1 (Interactive Mapper): steps 1–3 UI completed; profile persisted; matches computed and shown in Step 4 with scores; jobs list shows Fit badges. Target: 1 day.
- M2 (Explainability & Polish): score breakdown tooltips; GSAP scrollytelling polish; Best Match sort; hover micro-interactions. Target: 0.5 day.
- M3 (Tracker & Feedback): basic favorites/app tracker; export to CSV; feedback capture. Target: 0.5 day.

### 12) Risks & Mitigations
- CORS instability from WORC → use the Vite proxy (`/api/worc`) and keep robust fallback sample (already in place) so the UI always renders.
- Missing salary data → normalize partial info, show wider uncertainty bands, and explain in tooltip.
- Ambiguous remote/hybrid signals → start with heuristic mapping by track; allow user toggles to include/exclude unknowns.
- Performance with large lists → memoize feature derivations; incremental render; lightweight scoring; avoid heavy regex.

### 13) Stretch Goals (if time permits)
- Semantic job parsing (basic keyword extraction) to infer remote/hybrid and impact tags.
- Learning path suggestions based on near-miss qualifiers (show courses, apprenticeships) with local providers.
- Shareable profile links and lightweight auth to save progress.

### 14) Concrete File/Module Plan
- Create:
  - `src/components/mapper/MapperProvider.jsx`
  - `src/components/mapper/StepPriorities.jsx`
  - `src/components/mapper/StepScheduleCommute.jsx`
  - `src/components/mapper/StepGrowthSalary.jsx`
  - `src/components/mapper/StepMatches.jsx`
  - `src/components/mapper/StepTracker.jsx`
  - `src/lib/deriveJobFeatures.js`
  - `src/lib/match.js`
  - `src/lib/currency.js`, `src/lib/commute.js`, `src/lib/normalize.js`
  - `src/data/col_index.json`, `src/data/commute_matrix.json`, `src/data/work_arrangements.json`, `src/data/education_map.json`
- Update:
  - `src/careers.jsx` Pathway section → mount stepper; Jobs section → show Fit badges + sorting by Fit.
  - `src/animations/gsapEffects.js` (if needed) → small mapper-specific micro-interactions.

This plan fits our existing React + Vite + Tailwind + GSAP stack and leverages the already-wired WORC jobs to deliver a compelling, explainable lifestyle-to-career matching experience within hackathon timelines.


### 15) Linking Cleanly to WORC Applications
Goal: Provide a frictionless, trackable handoff from our ranked matches to the official WORC application flow without nesting anchors or brittle routes.

- Deep-link strategy
  - Preferred: direct detail route if available (to be validated). Example patterns to test: `#/job/<jobPostIdString>` or `#/details/<jobPostIdString>`. If confirmed, build the link with UTM tags.
  - Robust fallback: open the general portal (`#/`) and surface the `WORC ID` (e.g., `G2Q5C4`) prominently with a one-click “Copy ID” and “Open portal” pair.

- Tracking & attribution
  - Append UTM parameters to outbound links where possible: `utm_source=careers.ky&utm_medium=mapper&utm_campaign=apply&utm_content=<jobPostIdString>`.
  - Use a lightweight outbound click logger (console or optional analytics) before navigation.

- Implementation in our UI (already safe for nesting)
  - We render the action as a single `<a>` styled like a button (no nested anchor). The existing code is in `src/careers.jsx` inside `JobsFeed` cards.
  - Update the `href` at render time to use either the validated deep-link or the portal root with UTMs; otherwise, show helpful copy to search by ID.

- Dev proxy and CORS
  - Continue using Vite proxy for job fetches only (`/api/worc` → `https://my.egov.ky/o/worc-job-post-search`). Outbound application links always go directly to the WORC portal in a new tab (`target="_blank" rel="noreferrer"`).

- Future enhancement
  - If WORC exposes a stable job-detail API, we can generate a shortlink (`/out/<id>`) in our app that redirects with UTMs and gives us a small click metric, without storing PII.


### 16) Main Value Proposition for End Consumers
- Personalized fit, not generic listings: Roles are ranked by how they align with lifestyle balance, commute tolerance, arrangement (remote/hybrid/onsite), and compensation goals.
- Transparent, explainable scoring: A clear breakdown shows why a job fits (or doesn’t), with tips on closing gaps (skills/education).
- Grounded in local reality: Commute times and district cost-of-living inform the ranking so offers are weighed in a Cayman context.
- Time saved: A guided stepper captures preferences once; results and filters adapt instantly, with smooth GSAP scrollytelling that makes the flow feel effortless.
- Growth pathways: Near-miss roles surface suggested steps (certifications, apprenticeships) to unlock eligibility.
- Lightweight and private: Runs in-browser, no account required to get value; preferences can be kept local unless the user opts into saving.

