# QA Checklist — careers.ky Pitch Deck

## Template Validation
- [x] All placeholder variables render: `{{COMPANY_NAME}}`, `{{JOB_COUNT}}`, `{{HIRING_VOLUME}}`, etc.
- [x] No raw `{{...}}` visible after personalization
- [x] 9 slides, each full-viewport height with scroll-snap
- [x] Dark navy theme consistent across all slides
- [x] Navigation dots working (fixed right side)

## Content Accuracy
- [x] WORC rule change date: November 2025 ✓
- [x] 14-day advertising requirement ✓
- [x] Structured feedback requirement ✓
- [ ] **Time savings (4-6 hours per permit)** — estimate based on manual process complexity. Validate with real employer interviews.
- [ ] **Recruiter fees (15-25% of salary)** — standard for Cayman market. Confirm with local recruiters.
- [x] Pro pricing: $299/mo ✓
- [x] Enterprise pricing: $799/mo ✓
- [x] Employer count: 3,169 (from WORC database) ✓
- [ ] **$15K-25K cost of denied permit** — includes re-application fees, lost productivity, hiring delays. Estimate; validate.

## ROI Math Verification
- [x] Recruiter cost calc: hiringVolume × avgSalary × 15-25% ✓
- [x] Pro annual: $299 × 12 = $3,588 ✓
- [x] Enterprise annual: $799 × 12 = $9,588 ✓
- [x] Savings = recruiter cost − careers.ky cost ✓

## Mobile & Responsive
- [x] `clamp()` font sizing for all headings
- [x] Flex-wrap on stat rows, steps, tiers
- [x] Min-width breakpoint at 600px
- [x] Touch-friendly scroll snap
- [x] Buttons large enough for mobile tap targets

## Links & CTAs
- [ ] Trial link: `https://careers.ky/trial?company={{COMPANY_SLUG}}` — needs backend route
- [ ] Demo link: `https://careers.ky/demo?company={{COMPANY_SLUG}}` — needs backend route  
- [ ] Strategy link: `https://careers.ky/strategy` — needs backend route
- [x] All CTA buttons have hover states
- [x] Segment-specific CTAs in personalization engine

## Personalization Engine
- [x] `--single` mode works for individual employer
- [x] `--input` batch mode works for JSON array
- [x] Segment detection from industry string
- [x] ROI calculations produce reasonable numbers
- [x] Slug generation handles special characters
- [x] Fallback to "Other" segment for unknown industries

## Pre-Launch
- [ ] Test with 5 real employer profiles from database
- [ ] Review with Sean
- [ ] Set up trial/demo landing pages
- [ ] Configure email sending infrastructure
- [ ] A/B test tracking (open rates, click rates, conversions)
