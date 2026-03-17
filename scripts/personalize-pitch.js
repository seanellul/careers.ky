#!/usr/bin/env node
/**
 * personalize-pitch.js
 * Generates personalized pitch deck HTML files for careers.ky employer outreach.
 * 
 * Usage:
 *   node personalize-pitch.js --input employers.json --outdir ./pitches
 *   node personalize-pitch.js --single '{"name":"Walkers","industry":"Legal","jobCount":23,"hiringVolume":8}'
 * 
 * Input JSON format (array of employers):
 * [
 *   { "name": "Walkers", "industry": "Legal", "location": "George Town",
 *     "jobCount": 23, "hiringVolume": 8, "slug": "walkers" }
 * ]
 */

const fs = require('fs');
const path = require('path');

// --- Segment config ---
const SEGMENTS = {
  'Legal': {
    hook: 'Legal liability meets compliance complexity',
    headline: (c) => `${c.jobCount} open positions. ${c.hiringVolume * 6} hours of compliance work. One audit away from trouble.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a Compliance Review',
    avgSalary: 120000, // CI$ avg for recruiter fee calc
    tier: 'Enterprise',
  },
  'Finance': {
    hook: 'Regulatory audit risk in every hire',
    headline: (c) => `Regulatory audit risk. ${c.jobCount} open roles. The 2025 changes just made it worse.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a Compliance Review',
    avgSalary: 110000,
    tier: 'Enterprise',
  },
  'Hospitality': {
    hook: 'High-volume hiring meets new compliance burden',
    headline: (c) => `${c.jobCount} jobs posted. ${c.hiringVolume} work permits needed. One denial = frozen hiring.`,
    ctaPrimary: 'Get Your Free Report',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 45000,
    tier: 'Pro',
  },
  'Construction': {
    hook: 'Permit delays stop projects cold',
    headline: (c) => `${c.hiringVolume} work permits pending. A denied one delays your next project by months.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 55000,
    tier: 'Pro',
  },
  'Retail': {
    hook: 'Seasonal hiring + new compliance = headaches',
    headline: (c) => `${c.jobCount} positions to fill. New WORC rules on every one. We automated it.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'See Your Compliance Report',
    avgSalary: 40000,
    tier: 'Pro',
  },
  'Other': {
    hook: 'The 2025 WORC changes affect every employer',
    headline: (c) => `You posted ${c.jobCount} jobs. The rules changed. We built the fix.`,
    ctaPrimary: 'Start Free Trial',
    ctaSecondary: 'Schedule a 15-min Demo',
    avgSalary: 65000,
    tier: 'Pro',
  },
};

function getSegment(industry) {
  const key = Object.keys(SEGMENTS).find(k => 
    industry.toLowerCase().includes(k.toLowerCase())
  );
  return SEGMENTS[key] || SEGMENTS['Other'];
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function calcROI(hiringVolume, avgSalary) {
  const recruiterLow = Math.round(hiringVolume * avgSalary * 0.15);
  const recruiterHigh = Math.round(hiringVolume * avgSalary * 0.25);
  const proCost = 299 * 12;  // 3,588
  const entCost = 799 * 12;  // 9,588
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

function personalize(template, employer) {
  const seg = getSegment(employer.industry || 'Other');
  const slug = employer.slug || slugify(employer.name);
  const hv = employer.hiringVolume || Math.max(1, Math.round(employer.jobCount * 0.3));
  const roi = calcROI(hv, seg.avgSalary);
  
  const company = { ...employer, hiringVolume: hv, slug };

  const replacements = {
    '{{COMPANY_NAME}}': employer.name,
    '{{COMPANY_SLUG}}': slug,
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
    '{{EMPLOYER_COUNT}}': '3,169',
    // Segment-specific overrides for slide 1 headline
    'You Posted <span class="accent">{{JOB_COUNT}} Jobs</span>.<br>Then WORC Changed the Rules.':
      seg.headline(company).replace(/</g, '&lt;').replace(/>/g, '&gt;')
        ? `<span class="accent">${seg.headline(company)}</span>`
        : undefined,
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

// --- CLI ---
function main() {
  const args = process.argv.slice(2);
  const templatePath = path.join(__dirname, 'pitch-deck-template.html');
  
  if (!fs.existsSync(templatePath)) {
    console.error('Template not found:', templatePath);
    process.exit(1);
  }
  
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // --single mode
  const singleIdx = args.indexOf('--single');
  if (singleIdx !== -1) {
    const employer = JSON.parse(args[singleIdx + 1]);
    const html = personalize(template, employer);
    const slug = employer.slug || slugify(employer.name);
    const outPath = path.join(__dirname, `pitch-${slug}.html`);
    fs.writeFileSync(outPath, html);
    console.log(`✓ Generated: ${outPath}`);
    return;
  }
  
  // --input mode (batch)
  const inputIdx = args.indexOf('--input');
  const outdirIdx = args.indexOf('--outdir');
  
  if (inputIdx === -1) {
    console.log('Usage:');
    console.log('  node personalize-pitch.js --single \'{"name":"Acme","industry":"Legal","jobCount":10}\'');
    console.log('  node personalize-pitch.js --input employers.json --outdir ./pitches');
    return;
  }
  
  const inputFile = args[inputIdx + 1];
  const outdir = outdirIdx !== -1 ? args[outdirIdx + 1] : './pitches';
  
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
  
  const employers = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  let count = 0;
  
  for (const emp of employers) {
    const html = personalize(template, emp);
    const slug = emp.slug || slugify(emp.name);
    fs.writeFileSync(path.join(outdir, `pitch-${slug}.html`), html);
    count++;
  }
  
  console.log(`✓ Generated ${count} personalized pitch decks in ${outdir}/`);
}

main();
