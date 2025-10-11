## Project TODOs — Lifestyle → Career Mapper (Supabase + Frontend)

### Phase 0 — Setup
- [ ] Confirm Supabase env (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) and access roles

### Phase 1 — Data backbone (Supabase)
- [ ] Create view `v_jobs_flat` joining `Jobs` + dimensions + CISCO + JobTitles
- [ ] Add indexes on `Jobs(sLocation, sWork, sIndustry, sEducation, sExperience)` and title search
- [ ] Sanity-check CSV loads and null/empty value conventions across dimensions

### Phase 2 — Enrichment & scoring utilities
- [ ] Add datasets: `src/data/col_index.json`, `commute_matrix.json`, `work_arrangements.json`, `education_map.json`
- [ ] Implement `src/lib/currency.js` (to KYD/pa), `src/lib/commute.js` (lookup minutes), `src/lib/normalize.js`
- [ ] Implement `src/lib/deriveJobFeatures.js` (salary norm, commute, qualifiers, arrangement flags)
- [ ] Implement `src/lib/match.js` (Fit 0–100 + `explainScore` breakdown)

### Phase 3 — Mapper UI
- [ ] Create `src/components/mapper/MapperProvider.jsx` (context + reducer + localStorage persist)
- [ ] Build `StepPriorities.jsx`, `StepScheduleCommute.jsx`, `StepGrowthSalary.jsx`
- [ ] Build `StepMatches.jsx` (ranked jobs with Fit + breakdown tooltips)
- [ ] Build `StepTracker.jsx` (favorites + simple application tracker)

### Phase 4 — Frontend data integration
- [ ] Add Supabase client and feature flag: switch between WORC proxy and Supabase
- [ ] Implement `fetchSupabaseJobs` with filters (q, location, workType) and map to UI model
- [ ] Integrate stepper into `src/careers.jsx` Pathway section; wire score into Jobs grid
- [ ] Add Fit badge + “Best Match” sort and GSAP stagger on changes

### Phase 5 — Apply flow and links
- [ ] Implement WORC deep-link builder or fallback to portal root with UTM params
- [ ] Add “Copy WORC ID” + open-portal CTA; log outbound clicks (dev-only)

### Phase 6 — QA, a11y, and polish
- [ ] Expand DevTests with salary/commute/score cases and add a dev debug panel
- [ ] Verify reduced-motion, keyboard flow, and performance on large lists
- [ ] Final GSAP micro-interactions for the stepper and score changes


