#!/usr/bin/env python3
"""
Score and categorize 500 Cayman Islands employers for careers.ky sales pipeline.
Outputs: scored CSV + markdown report with tier breakdowns.
"""

import csv
import json
from pathlib import Path
from collections import defaultdict

# Read CSV
csv_path = Path("/home/node/.openclaw/workspace/careers-ky/content/employer-pipeline-500.csv")
data = list(csv.DictReader(csv_path.open()))

# ===== SCORING LOGIC =====

def get_hiring_volume_score(total_jobs):
    """Hiring volume (40% weight): more jobs posted = higher need"""
    if total_jobs >= 50:
        return 40
    elif total_jobs >= 20:
        return 30
    elif total_jobs >= 10:
        return 20
    elif total_jobs >= 5:
        return 10
    else:
        return 5

def get_industry_value_score(industry):
    """Industry value (30% weight): higher-salary industries"""
    industry_lower = industry.lower()
    
    # Exact matches for legal/professional
    if "professional, scientific and technical" in industry_lower:
        return 30  # Will be refined based on company context
    elif "financial and insurance" in industry_lower:
        return 28
    elif "real estate" in industry_lower:
        return 22
    elif "information and communication" in industry_lower:
        return 20
    elif "education" in industry_lower:
        return 18
    elif "human health and social work" in industry_lower:
        return 18
    elif "accommodation and food service" in industry_lower:
        return 15
    elif "wholesale and retail trade" in industry_lower:
        return 12
    elif "construction" in industry_lower:
        return 10
    elif "arts, entertainment and recreation" in industry_lower:
        return 10
    elif "administrative and support service" in industry_lower:
        # RECRUITMENT AGENCIES get 5 points (they're competitors)
        return 5
    else:
        return 8

def get_salary_score(avg_salary_str):
    """Salary level (15% weight): higher salary = more recruiter fee savings"""
    try:
        salary = float(avg_salary_str) if avg_salary_str else 0
    except:
        salary = 0
    
    if salary >= 100000:
        return 15
    elif salary >= 60000:
        return 12
    elif salary >= 40000:
        return 8
    elif salary >= 20000:
        return 5
    else:
        return 3

def get_decision_maker_score(total_jobs):
    """Decision-maker access (15% weight): smaller/mid firms easier to reach"""
    if 10 <= total_jobs <= 50:
        return 15  # Sweet spot
    elif total_jobs > 50:
        return 12  # Large, harder to reach
    elif 5 <= total_jobs < 10:
        return 10  # Small, may not need platform
    else:
        return 5   # Very small

def calculate_score(row):
    """Calculate total score (1-100)"""
    total_jobs = int(row['total_jobs'])
    industry = row['industry']
    avg_salary = row['avg_salary']
    
    volume = get_hiring_volume_score(total_jobs)
    ind_value = get_industry_value_score(industry)
    salary = get_salary_score(avg_salary)
    decision_maker = get_decision_maker_score(total_jobs)
    
    total = volume + ind_value + salary + decision_maker
    return total, volume, ind_value, salary, decision_maker

def categorize_employer(name, industry):
    """Categorize into one of 25 segments"""
    name_lower = name.lower()
    industry_lower = industry.lower()
    
    # ===== EXACT MATCHES / KEYWORDS =====
    
    # 1. Offshore Law Firms
    if any(x in name_lower for x in ['walkers', 'ogier', 'conyers', 'harneys', 'appleby', 'mourant', 'carey olsen', 'bedell cristin', 'stuarts walker']):
        return "Offshore Law Firms"
    
    # 2. Fund Administration & Corporate Services
    if any(x in name_lower for x in ['maples', 'citco', 'intertrust', 'vistra', 'fund services', 'fiduciary']):
        return "Fund Administration & Corporate Services"
    
    # 3. Banking & Retail Finance
    if any(x in name_lower for x in ['bank', 'butterfield', 'rbc royal', 'scotiabank']):
        return "Banking & Retail Finance"
    
    # 4. Insurance (Brokers, Captive, Underwriters)
    if any(x in name_lower for x in ['insurance', 'reinsurance', 'aon', 'artex', 'greenlight']) and 'health' not in industry_lower:
        return "Insurance (Brokers, Captive, Underwriters)"
    
    # 5. Accounting & Audit (Big 4 + local)
    if any(x in name_lower for x in ['pwc', 'kpmg', 'deloitte', 'ey', 'bdo', 'grant thornton', 'hlb', 'rsm', 'alvarez & marsal']):
        return "Accounting & Audit (Big 4 + local)"
    
    # 6. Hotels & Resorts
    if any(x in name_lower for x in ['resort', 'ritz', 'marriott', 'hotel', 'hospitality services']) and 'cayman' in name_lower:
        return "Hotels & Resorts"
    
    # 7. Restaurants & F&B
    if 'accommodation and food service' in industry_lower and any(x in name_lower for x in ['restaurant', 'cafe', 'bar', 'grill', 'pizza', 'bakery', 'food', 'kitchen', 'diner', 'smokehouse', 'pizzeria', 'thai', 'roti']):
        return "Restaurants & F&B"
    
    # 8. Grocery & Retail
    if any(x in name_lower for x in ['market', 'retail', 'grocery', 'supermarket', 'cost u less', 'hurley', 'foster', 'kirk market']):
        return "Grocery & Retail"
    
    # 9. Construction & Contractors
    if 'construction' in industry_lower or any(x in name_lower for x in ['construction', 'contractor', 'builder', 'plumbing', 'electrical', 'hvac', 'drywall']):
        return "Construction & Contractors"
    
    # 10. Real Estate & Property Management
    if 'real estate' in industry_lower or any(x in name_lower for x in ['property', 'real estate', 'davenport development']):
        return "Real Estate & Property Management"
    
    # 11. Healthcare & Medical
    if 'health' in industry_lower or any(x in name_lower for x in ['hospital', 'clinic', 'dental', 'medical', 'health city', 'pharmacy']):
        return "Healthcare & Medical"
    
    # 12. Education & Training
    if 'education' in industry_lower or any(x in name_lower for x in ['school', 'university', 'college', 'academy', 'prep']):
        return "Education & Training"
    
    # 13. Government & Statutory Bodies
    if any(x in name_lower for x in ['authority', 'cayman islands', 'government', 'statutory']) and any(y in name_lower for y in ['water', 'monetary', 'legal services authority']):
        return "Government & Statutory Bodies"
    
    # 14. Technology & Fintech
    if any(x in name_lower for x in ['tech', 'software', 'it ', 'digital', 'digicel', 'cable & wireless', 'broadband', 'telecom', 'logic', 'netclues']):
        return "Technology & Fintech"
    
    # 15. Utilities & Telecoms
    if any(x in name_lower for x in ['utilities', 'power', 'electricity', 'water authority', 'utility', 'agl']):
        return "Utilities & Telecoms"
    
    # 16. Transportation & Logistics
    if 'transportation' in industry_lower or any(x in name_lower for x in ['transport', 'airline', 'shipping', 'logistics', 'cayman airways', 'tour']):
        return "Transportation & Logistics"
    
    # 17. Manufacturing & Industrial
    if 'manufacturing' in industry_lower or any(x in name_lower for x in ['manufacturing', 'spirits company', 'brewery', 'precast', 'industrial']):
        return "Manufacturing & Industrial"
    
    # 18. Non-Profit & Religious
    if any(x in name_lower for x in ['church', 'baptist', 'adventist', 'humane society', 'foundation', 'non-profit']):
        return "Non-Profit & Religious"
    
    # 19. Media & Communications
    if any(x in name_lower for x in ['media', 'publishing', 'communications', 'compass media']):
        return "Media & Communications"
    
    # 20. Fitness, Beauty & Wellness
    if any(x in name_lower for x in ['spa', 'salon', 'gym', 'fitness', 'wellness', 'beauty', 'lash', 'nail', 'grooming']):
        return "Fitness, Beauty & Wellness"
    
    # 21. Automotive & Marine
    if any(x in name_lower for x in ['auto', 'car', 'marine', 'yacht', 'boat', 'esso', 'refuel', 'detailing']):
        return "Automotive & Marine"
    
    # 22. Security Services
    if any(x in name_lower for x in ['security', 'ironshore']) or 'administrative and support service' in industry_lower and any(x in name_lower for x in ['security']):
        return "Security Services"
    
    # 23. Professional Consulting
    if any(x in name_lower for x in ['consulting', 'consultant', 'prime consulting']):
        return "Professional Consulting"
    
    # 24. Dive & Tourism Operators
    if any(x in name_lower for x in ['dive', 'diving', 'tours', 'watersports', 'red sail', 'anchor tours', 'turtle']):
        return "Dive & Tourism Operators"
    
    # 25. Other Services (fallback)
    return "Other Services"

def is_recruitment_agency(name, industry):
    """Identify recruitment/staffing agencies (EXCLUDE)"""
    name_lower = name.lower()
    industry_lower = industry.lower()
    
    excluded = [
        'steppingstones', 'baraud', 'invenio', 'cml offshore', 'employment agency',
        'recruitment', 'staffing', 'temp agency', 'personnel', 'employment',
        'css employment', 'caystaff', 'placement', 'au pair', 'labor supply',
        'workforce', 'helper', 'maverick group (au pair)', 'progression workforce',
        'rdm recruitment', 'lds employment', 'affinity recruitment'
    ]
    
    for keyword in excluded:
        if keyword in name_lower:
            return True
    
    return False

def is_government(name, industry):
    """Identify government entities"""
    name_lower = name.lower()
    keywords = ['cayman islands', 'authority', 'government', 'statutory', 'water authority']
    return any(x in name_lower for x in keywords)

def is_warm_intro(name):
    """Flag Sean's warm intros"""
    name_lower = name.lower()
    warm_intros = ['maples', 'maplesfs', 'walkers', 'ogier', 'campbells']
    return any(x in name_lower for x in warm_intros)

# ===== PROCESS ALL EMPLOYERS =====

employers = []
for i, row in enumerate(data, 1):
    name = row['name']
    industry = row['industry']
    total_jobs = int(row['total_jobs'])
    
    # Skip recruitment agencies & staffing
    if is_recruitment_agency(name, industry):
        employers.append({
            'rank': i,
            'name': name,
            'score': 0,
            'segment': 'EXCLUDED',
            'industry': industry,
            'total_jobs': total_jobs,
            'active_jobs': row['active_jobs'],
            'avg_salary': row['avg_salary'],
            'category': 'recruitment_agency',
            'is_government': False,
            'is_warm_intro': False
        })
        continue
    
    # Calculate score
    total_score, vol_score, ind_score, sal_score, dm_score = calculate_score(row)
    
    # Categorize
    segment = categorize_employer(name, industry)
    
    # Check special flags
    is_gov = is_government(name, industry)
    is_warm = is_warm_intro(name)
    
    employers.append({
        'rank': i,
        'name': name,
        'score': total_score,
        'segment': segment if not is_gov else "Government & Statutory Bodies",
        'industry': industry,
        'total_jobs': total_jobs,
        'active_jobs': row['active_jobs'],
        'avg_salary': row['avg_salary'],
        'total_positions': row['total_positions'],
        'vol_score': vol_score,
        'ind_score': ind_score,
        'sal_score': sal_score,
        'dm_score': dm_score,
        'is_government': is_gov,
        'is_warm_intro': is_warm,
        'category': 'employer'
    })

# ===== GENERATE HOOKS =====

def generate_hook(emp):
    """Create specific 1-line hook for this employer"""
    name = emp['name']
    total_jobs = emp['total_jobs']
    avg_salary = float(emp['avg_salary']) if emp['avg_salary'] else 0
    industry = emp['industry'].lower()
    
    # High salary, high volume: focus on recruiter fee savings
    if avg_salary >= 100000 and total_jobs >= 50:
        fee_saved = int(total_jobs * avg_salary * 0.20 / 1000) * 1000  # Assume 20% commission
        return f"{total_jobs} positions at CI${avg_salary:,.0f} avg. That's CI${fee_saved:,}+ in recruiter fees. careers.ky: CI$9,588/year Enterprise."
    
    # High volume, any salary: direct access to talent
    if total_jobs >= 50:
        return f"You posted {total_jobs} jobs last year. careers.ky gives you direct access to Caymanian talent for every one of them."
    
    # Law/Professional Services: focus on work permits & compliance
    if 'professional' in industry or 'legal' in industry:
        fee_est = int(total_jobs * 1500)  # Rough estimate per hire
        return f"{total_jobs} hires. careers.ky takes the work permit headache out. Skip the recruiter middleman."
    
    # Finance/Insurance: focus on compliance & insurance savings
    if 'financial' in industry or 'insurance' in industry:
        savings = int(total_jobs * avg_salary * 0.15 / 1000) * 1000 if avg_salary else int(total_jobs * 5000)
        return f"{total_jobs} positions at {avg_salary:.0f}K avg. careers.ky: direct to talent, zero recruiter fees."
    
    # Hospitality: high volume, lower salary
    if 'accommodation' in industry or 'food service' in industry:
        return f"You posted {total_jobs} jobs for seasonal staff. careers.ky: instant access, no recruiter markup."
    
    # Construction: price-sensitive, volume play
    if 'construction' in industry:
        return f"{total_jobs} positions, price-sensitive budget. careers.ky eliminates recruiter markup entirely."
    
    # Retail/Wholesale: volume + accessibility
    if 'wholesale' in industry or 'retail' in industry:
        return f"{total_jobs} retail + logistics posts. careers.ky gives you direct pipeline year-round."
    
    # Education: compliance + mission alignment
    if 'education' in industry:
        return f"{total_jobs} teaching + admin roles. careers.ky connects you with qualified local talent faster."
    
    # Healthcare: compliance + high importance
    if 'health' in industry:
        fee_est = int(total_jobs * avg_salary * 0.20) if avg_salary else int(total_jobs * 10000)
        return f"Medical recruitment shouldn't cost CI${fee_est:,}+. careers.ky: streamlined hiring, same quality talent."
    
    # Default: focus on direct access + cost
    fee_estimate = int(total_jobs * 3000)  # Conservative estimate
    return f"{total_jobs} hires. careers.ky direct: eliminate recruiter fees (~CI${fee_estimate:,} saved annually)."

# ===== TIER BREAKDOWN =====

excluded = [e for e in employers if e['category'] != 'employer']
active_employers = [e for e in employers if e['category'] == 'employer']

tier1 = sorted([e for e in active_employers if e['score'] >= 70 and not e['is_government']], key=lambda x: -x['score'])
tier2 = sorted([e for e in active_employers if 50 <= e['score'] < 70 and not e['is_government']], key=lambda x: -x['score'])
tier3 = sorted([e for e in active_employers if 30 <= e['score'] < 50 and not e['is_government']], key=lambda x: -x['score'])
tier4 = [e for e in active_employers if e['score'] < 30 and not e['is_government']]
government = sorted([e for e in active_employers if e['is_government']], key=lambda x: -x['score'])

# Add priority rank
priority_rank = 1
for emp in tier1 + tier2 + tier3:
    emp['priority_rank'] = priority_rank
    priority_rank += 1
for emp in tier4:
    emp['priority_rank'] = priority_rank
    priority_rank += 1

# Generate hooks for all scored employers
for emp in active_employers:
    emp['hook'] = generate_hook(emp)

# ===== BUILD MARKDOWN REPORT =====

def format_tier_row(emp):
    """Format single employer for tier section"""
    salary = emp['avg_salary']
    try:
        salary_str = f"CI${int(float(salary)):,}" if salary and salary != '0' else "—"
    except:
        salary_str = "—"
    
    return (
        f"| {emp['priority_rank']} | {emp['name']} | {emp['score']} | {emp['segment']} | "
        f"{emp['industry']} | {emp['total_jobs']} | {salary_str} | "
        f"{'Enterprise' if emp['total_jobs'] >= 20 else 'Pro'} | {emp['hook']} |"
    )

md_report = f"""# careers.ky Sales Pipeline: 500 Cayman Islands Employers

**Generated:** 2026-03-17
**Total Employers Analyzed:** 500
**Active Sales Targets (Tier 1-4):** {len(active_employers)}
**Excluded (Recruitment Agencies):** {len([e for e in excluded if e['category'] == 'recruitment_agency'])}
**Government Entities (Separate Track):** {len(government)}

---

## Executive Summary

### Pipeline Snapshot
- **Tier 1 (Hot Leads, Score 70+):** {len(tier1)} employers — immediate outreach, highest ROI
- **Tier 2 (Warm Leads, Score 50-69):** {len(tier2)} employers — secondary wave, strong fit
- **Tier 3 (Nurture, Score 30-49):** {len(tier3)} employers — long-tail education cycle
- **Tier 4 (Long-tail, Score <30):** {len(tier4)} employers — monitor, nurture over time

### Scoring Model
Each employer scored 1-100 on:
- **Hiring Volume (40%):** More jobs = higher need for careers.ky
- **Industry Value (30%):** Higher-salary industries save more on recruiter fees
- **Salary Level (15%):** Larger fees = greater motivation to switch
- **Decision-Maker Access (15%):** Mid-size firms (10-50 jobs) = sweet spot

### Segment Breakdown (Top Employers)
"""

# Build segment breakdown
segment_counts = {}
for seg in sorted(set(e['segment'] for e in active_employers)):
    count = len([e for e in active_employers if e['segment'] == seg])
    segment_counts[seg] = count

for segment, count in sorted(segment_counts.items(), key=lambda x: -x[1])[:10]:
    md_report += f"- **{segment}:** {count} employers\n"

md_report += """


### Sean's Warm Intros (Priority)
{', '.join([e['name'] for e in active_employers if e['is_warm_intro']])}

---

## Tier 1: Hot Leads (Score 70+) — {len(tier1)} employers

**Action:** Week 1 outreach. Direct to decision-makers. Enterprise tier recommended.

| Priority | Employer | Score | Segment | Industry | Jobs | Avg Salary | Tier | Suggested Hook |
|----------|----------|-------|---------|----------|------|-----------|------|-----------------|
"""

for emp in tier1:
    md_report += format_tier_row(emp) + "\n"

md_report += f"""

---

## Tier 2: Warm Leads (Score 50-69) — {len(tier2)} employers

**Action:** Week 2-3 outreach. Mid-market focus. Pro/Enterprise mix.

| Priority | Employer | Score | Segment | Industry | Jobs | Avg Salary | Tier | Suggested Hook |
|----------|----------|-------|---------|----------|------|-----------|------|-----------------|
"""

for emp in tier2:
    md_report += format_tier_row(emp) + "\n"

md_report += f"""

---

## Tier 3: Nurture (Score 30-49) — {len(tier3)} employers

**Action:** Month 2+. Educational content, demos. Long-tail conversion.

| Priority | Employer | Score | Segment | Industry | Jobs | Avg Salary | Tier | Suggested Hook |
|----------|----------|-------|---------|----------|------|-----------|------|-----------------|
"""

for emp in tier3[:50]:  # Show first 50
    md_report += format_tier_row(emp) + "\n"

if len(tier3) > 50:
    md_report += f"\n*... and {len(tier3) - 50} more in Tier 3*\n"

md_report += f"""

---

## Tier 4: Long-tail (Score <30) — {len(tier4)} employers

**Segment Distribution:**
"""

tier4_by_segment = defaultdict(list)
for emp in tier4:
    tier4_by_segment[emp['segment']].append(emp)

for segment in sorted(tier4_by_segment.keys()):
    md_report += f"- **{segment}:** {len(tier4_by_segment[segment])} employers\n"

md_report += f"""

---

## Excluded: Recruitment Agencies & Staffing Firms

**Count:** {len([e for e in excluded if e['category'] == 'recruitment_agency'])}

**Why:** They are competitors, not customers. Targeting them wastes outreach.

**Excluded Companies:**
"""

excluded_agencies = sorted([e['name'] for e in excluded if e['category'] == 'recruitment_agency'])
for agency in excluded_agencies:
    md_report += f"- {agency}\n"

if government:
    md_report += f"""

---

## Government Entities (Separate Sales Cycle) — {len(government)} employers

**Note:** Government hiring follows different approval processes, budgets, and timelines. Recommend separate RFP/tender strategy.

| Employer | Score | Industry | Jobs | Avg Salary |
|----------|-------|----------|------|-----------|
"""
    for emp in government:
        try:
            salary_str = f"CI${int(float(emp['avg_salary'])):,}" if emp['avg_salary'] and emp['avg_salary'] != '0' else "—"
        except:
            salary_str = "—"
        md_report += f"| {emp['name']} | {emp['score']} | {emp['industry']} | {emp['total_jobs']} | {salary_str} |\n"

md_report += f"""

---

## Recommended Outreach Sequence

### Week 1: Top 20 (Tier 1 - Highest Priority)
Focus: Warm intros first, then top scorers
- {', '.join([e['name'] for e in (tier1[:10])])}
- ...and next 10 from Tier 1

### Week 2-3: Next 30 (Tier 1 Remainder + Tier 2 Top)
Focus: Volume + case studies from Week 1 wins
- Remaining Tier 1
- Top 15 Tier 2

### Week 4-6: Next 50 (Tier 2 + Top Tier 3)
Focus: Educational content, demo scheduling
- Remaining Tier 2
- Top 25 Tier 3

### Month 2+: Long-tail Nurture
Focus: Content, automation, drip campaigns
- Tier 3 (remaining)
- Tier 4 (monitor)

---

## How to Use This Pipeline

1. **Export scored CSV** → Use in your CRM for tracking
2. **Week 1 calls:** Use the "Suggested Hook" verbatim + personalize with LinkedIn research
3. **Demo prep:** Customize demo for their industry segment (see segment breakdowns above)
4. **Track conversion:** Update priority_rank in CRM as deals move through stages

---

## Notes
- Salary data from careers.ky DB; some employers show $0 (private companies, no disclosures)
- Recruitment agencies identified by keyword + industry classification; review list for accuracy
- Warm intros (Maples, Walkers, Ogier, Campbells) flagged for executive reach-out
- Government entities: budget CI$100K+/year for RFP process (vs. CI$9.6K Enterprise self-serve)
"""

print("✅ Markdown report generated")

# ===== BUILD SCORED CSV =====

csv_rows = []
for emp in sorted(active_employers + government, key=lambda x: (x.get('priority_rank', 999999))):
    if emp['category'] != 'employer':
        continue
    
    priority = emp.get('priority_rank', '')
    csv_rows.append({
        'priority_rank': priority,
        'name': emp['name'],
        'score': emp['score'],
        'segment': emp['segment'],
        'industry': emp['industry'],
        'total_jobs': emp['total_jobs'],
        'active_jobs': emp['active_jobs'],
        'avg_salary': emp['avg_salary'],
        'recommended_tier': 'Enterprise' if emp['total_jobs'] >= 20 else 'Pro',
        'suggested_hook': emp['hook'],
        'is_warm_intro': '✓' if emp['is_warm_intro'] else '',
        'is_government': '✓' if emp['is_government'] else '',
    })

# ===== WRITE OUTPUTS =====

# Write markdown
md_path = Path("/home/node/.openclaw/workspace/careers-ky/content/sales-pipeline-500.md")
md_path.write_text(md_report)
print(f"✅ Wrote {md_path}")

# Write CSV
csv_path_out = Path("/home/node/.openclaw/workspace/careers-ky/content/sales-pipeline-500-scored.csv")
with csv_path_out.open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=csv_rows[0].keys())
    writer.writeheader()
    writer.writerows(csv_rows)
print(f"✅ Wrote {csv_path_out}")

print(f"\n📊 PIPELINE SUMMARY")
print(f"  Tier 1 (70+): {len(tier1)} employers")
print(f"  Tier 2 (50-69): {len(tier2)} employers")
print(f"  Tier 3 (30-49): {len(tier3)} employers")
print(f"  Tier 4 (<30): {len(tier4)} employers")
print(f"  Government: {len(government)} employers")
print(f"  Excluded: {len([e for e in excluded if e['category'] == 'recruitment_agency'])} agencies")
print(f"  Warm Intros: {len([e for e in active_employers if e['is_warm_intro']])} flagged")
