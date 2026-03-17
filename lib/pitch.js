// Shared personalization logic for pitch decks
// Extracted from scripts/personalize-pitch.js

export const SEGMENTS = {
  'Legal': {
    hook: 'Your recruiter costs CI$120K+/year. We cost CI$9,588.',
    headline: (c) => `${c.jobCount} open positions. CI$${Math.round(c.hiringVolume * 120000 * 0.2).toLocaleString()} in recruiter fees. There's a better way.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'See Your Savings',
    avgSalary: 120000,
    tier: 'Enterprise',
  },
  'Finance': {
    hook: 'Find Caymanian talent in finance directly. Skip the recruiter.',
    headline: (c) => `${c.jobCount} open roles. CI$${Math.round(c.hiringVolume * 110000 * 0.2).toLocaleString()} in recruiter fees. One platform replaces them all.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'See Your Savings',
    avgSalary: 110000,
    tier: 'Enterprise',
  },
  'Hospitality': {
    hook: 'Hiring 50+ people/year? Stop paying per-hire fees.',
    headline: (c) => `${c.jobCount} jobs posted. ${c.hiringVolume} hires needed. At CI$7-11K each in recruiter fees, that adds up fast.`,
    ctaPrimary: 'Get Your Free Report',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 45000,
    tier: 'Pro',
  },
  'Construction': {
    hook: 'Find skilled Caymanian workers directly. No recruiter markup.',
    headline: (c) => `${c.hiringVolume} hires needed this year. Skip the recruiter. Find Caymanian talent directly.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 55000,
    tier: 'Pro',
  },
  'Retail': {
    hook: "Seasonal hiring shouldn't cost CI$10K per person.",
    headline: (c) => `${c.jobCount} positions to fill. At 15-25% per hire, you're overpaying. We fixed that.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'See Your Savings',
    avgSalary: 40000,
    tier: 'Pro',
  },
  'Other': {
    hook: 'Find Caymanian talent directly. Save CI$10-16K per hire.',
    headline: (c) => `You posted ${c.jobCount} jobs. Your recruiter charged 15-25% on each hire. We charge $299/month.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 65000,
    tier: 'Pro',
  },
};

export function getSegment(industry) {
  if (!industry) return SEGMENTS['Other'];
  const key = Object.keys(SEGMENTS).find(k =>
    industry.toLowerCase().includes(k.toLowerCase())
  );
  return SEGMENTS[key] || SEGMENTS['Other'];
}

export function calcROI(hiringVolume, avgSalary) {
  const recruiterLow = Math.round(hiringVolume * avgSalary * 0.15);
  const recruiterHigh = Math.round(hiringVolume * avgSalary * 0.25);
  const proCost = 299 * 12;
  const entCost = 799 * 12;
  return {
    recruiterLow: recruiterLow.toLocaleString(),
    recruiterHigh: recruiterHigh.toLocaleString(),
    ckyAnnualPro: proCost.toLocaleString(),
    ckyAnnualEnt: entCost.toLocaleString(),
    savingsLow: (recruiterLow - entCost).toLocaleString(),
    savingsHigh: (recruiterHigh - proCost).toLocaleString(),
    savingsPro: (recruiterLow - proCost).toLocaleString(),
    savingsEnt: (recruiterLow - entCost).toLocaleString(),
  };
}

export function personalizePitchHTML(template, employer) {
  const seg = getSegment(employer.industry);
  const hv = employer.hiringVolume || Math.max(1, Math.round((employer.jobCount || 0) * 0.3));
  const roi = calcROI(hv, seg.avgSalary);

  const company = { ...employer, hiringVolume: hv };

  const replacements = {
    '{{COMPANY_NAME}}': employer.name,
    '{{COMPANY_SLUG}}': employer.slug,
    '{{INDUSTRY}}': employer.industry || 'Your Industry',
    '{{JOB_COUNT}}': String(employer.jobCount || 0),
    '{{HIRING_VOLUME}}': String(hv),
    '{{RECRUITER_COST_LOW}}': roi.recruiterLow,
    '{{RECRUITER_COST_HIGH}}': roi.recruiterHigh,
    '{{CKY_ANNUAL_COST}}': roi.ckyAnnualEnt,
    '{{SAVINGS_LOW}}': roi.savingsLow,
    '{{SAVINGS_HIGH}}': roi.savingsHigh,
    '{{SAVINGS_PRO}}': roi.savingsPro,
    '{{SAVINGS_ENT}}': roi.savingsEnt,
    '{{EMPLOYER_COUNT}}': '3,564',
    '{{SEGMENT_HOOK}}': seg.hook,
    '<span class="accent">{{SEGMENT_HEADLINE}}</span>':
      `<span class="accent">${seg.headline(company)}</span>`,
  };

  let html = template;
  for (const [key, val] of Object.entries(replacements)) {
    if (val !== undefined) {
      html = html.split(key).join(val);
    }
  }

  // Replace CTA text based on segment
  html = html.replace(/>Start Your Free Trial</g, `>${seg.ctaPrimary}<`);

  return html;
}
