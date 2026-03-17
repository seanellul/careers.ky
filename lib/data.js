import { getDb } from "@/lib/db";

// --- Taxonomy loaders ---

export async function loadCISCO() {
  const sql = getDb();
  const rows = await sql`SELECT cisco_code as "sCISCO", title as "cTitle", description as "cDescription", tasks as "cTasks" FROM cisco_units ORDER BY cisco_code`;
  return rows;
}

export async function loadOccupationCisco() {
  const sql = getDb();
  const rows = await sql`SELECT occupation_code as "sOccupation", cisco_code as "sCISCO" FROM occupation_cisco`;
  return rows;
}

export async function loadJobTitles() {
  const sql = getDb();
  const rows = await sql`SELECT occupation_code as "sOccupation", title as "cTitle", title as "cJobTitle" FROM job_titles`;
  return rows;
}

// --- Lookup loaders (return Maps) ---

export async function loadWorkTypes() {
  const sql = getDb();
  const rows = await sql`SELECT code, description FROM work_types`;
  return new Map(rows.map((r) => [String(r.code), r.description]));
}

export async function loadEducationTypes() {
  const sql = getDb();
  const rows = await sql`SELECT code, description FROM education_types`;
  return new Map(rows.map((r) => [String(r.code), r.description]));
}

export async function loadExperienceTypes() {
  const sql = getDb();
  const rows = await sql`SELECT code, description FROM experience_types`;
  return new Map(rows.map((r) => [String(r.code), r.description]));
}

export async function loadLocationTypes() {
  const sql = getDb();
  const rows = await sql`SELECT code, description FROM location_types`;
  return new Map(rows.map((r) => [String(r.code), r.description]));
}

// --- Job postings ---

export async function loadJobPostingsDetailed() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      job_id as "cJobId",
      title as "cTitle",
      status as "Status",
      created_date as "createdDate",
      start_date as "startDate",
      end_date as "endDate",
      work_type as "sWork",
      employer as "Employer",
      education as "sEducation",
      experience as "sExperience",
      location as "sLocation",
      occupation_code as "sOccupation",
      occupation_name as "Occupation",
      hours_per_week as "Hours Per Week",
      currency as "Currency",
      salary_description as "Salary Description",
      min_salary as "fMinSalary",
      max_salary as "fMaxSalary",
      mean_salary as "fMeanSalary",
      industry as "sIndustry",
      (status = 'Active' AND end_date > NOW()) as "isActive"
    FROM job_postings
    ORDER BY created_date DESC
  `;
  return rows;
}

export async function getActiveJobPostings() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      job_id as "cJobId",
      title as "cTitle",
      status as "Status",
      created_date as "createdDate",
      start_date as "startDate",
      end_date as "endDate",
      work_type as "sWork",
      employer as "Employer",
      education as "sEducation",
      experience as "sExperience",
      location as "sLocation",
      occupation_code as "sOccupation",
      occupation_name as "Occupation",
      hours_per_week as "Hours Per Week",
      currency as "Currency",
      salary_description as "Salary Description",
      min_salary as "fMinSalary",
      max_salary as "fMaxSalary",
      mean_salary as "fMeanSalary",
      industry as "sIndustry",
      (status = 'Active' AND end_date > NOW()) as "isActive"
    FROM job_postings
    WHERE status = 'Active' AND end_date > NOW()
    ORDER BY created_date DESC
  `;
  return rows;
}

export async function getJobPostingsByCiscoCode(ciscoCode) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      jp.job_id as "cJobId",
      jp.title as "cTitle",
      jp.status as "Status",
      jp.created_date as "createdDate",
      jp.start_date as "startDate",
      jp.end_date as "endDate",
      jp.work_type as "sWork",
      jp.employer as "Employer",
      jp.education as "sEducation",
      jp.experience as "sExperience",
      jp.location as "sLocation",
      jp.occupation_code as "sOccupation",
      jp.occupation_name as "Occupation",
      jp.hours_per_week as "Hours Per Week",
      jp.currency as "Currency",
      jp.salary_description as "Salary Description",
      jp.min_salary as "fMinSalary",
      jp.max_salary as "fMaxSalary",
      jp.mean_salary as "fMeanSalary",
      jp.industry as "sIndustry",
      (jp.status = 'Active' AND jp.end_date > NOW()) as "isActive"
    FROM job_postings jp
    INNER JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
    WHERE oc.cisco_code = ${ciscoCode}
    ORDER BY jp.created_date DESC
  `;
  return rows;
}

// --- Aggregates (computed in SQL) ---

export async function loadAggregates() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      oc.cisco_code,
      COUNT(*) as count,
      MIN(jp.min_salary) as min_salary,
      MAX(jp.max_salary) as max_salary,
      AVG(jp.mean_salary) as mean_salary,
      json_object_agg(DISTINCT COALESCE(jp.work_type, '0'), 1) FILTER (WHERE jp.work_type IS NOT NULL) as work_dist,
      json_object_agg(DISTINCT COALESCE(jp.education, '0'), 1) FILTER (WHERE jp.education IS NOT NULL) as edu_dist,
      json_object_agg(DISTINCT COALESCE(jp.experience, '0'), 1) FILTER (WHERE jp.experience IS NOT NULL) as exp_dist
    FROM job_postings jp
    INNER JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
    GROUP BY oc.cisco_code
  `;

  // We need actual counts per type, not just distinct existence. Use a different approach.
  const detailRows = await sql`
    SELECT
      oc.cisco_code,
      jp.work_type,
      jp.education,
      jp.experience,
      COUNT(*) as cnt
    FROM job_postings jp
    INNER JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
    GROUP BY oc.cisco_code, jp.work_type, jp.education, jp.experience
  `;

  // Build distribution maps
  const distMap = new Map();
  for (const r of detailRows) {
    const code = r.cisco_code;
    if (!distMap.has(code)) distMap.set(code, { work: {}, edu: {}, exp: {} });
    const d = distMap.get(code);
    const wk = String(r.work_type || "0");
    const ed = String(r.education || "0");
    const ex = String(r.experience || "0");
    d.work[wk] = (d.work[wk] || 0) + Number(r.cnt);
    d.edu[ed] = (d.edu[ed] || 0) + Number(r.cnt);
    d.exp[ex] = (d.exp[ex] || 0) + Number(r.cnt);
  }

  const out = new Map();
  for (const r of rows) {
    const code = r.cisco_code;
    out.set(code, {
      count: Number(r.count),
      min: Number(r.min_salary) || 0,
      max: Number(r.max_salary) || 0,
      mean: Number(r.mean_salary) || 0,
      dist: distMap.get(code) || { work: {}, edu: {}, exp: {} },
    });
  }
  return out;
}

// --- Tree builder (takes pre-loaded CISCO data) ---

export function buildCiscoTree(ciscoRows) {
  const nodes = new Map();
  const root = { id: "root", title: "Occupations", children: [] };
  const ensure = (id, title) => {
    if (!nodes.has(id)) nodes.set(id, { id, title, children: [] });
    return nodes.get(id);
  };
  const findTitle = (code) => {
    const pad = (id) => {
      if (id.length === 1) return id + "000";
      if (id.length === 2) return id + "00";
      if (id.length === 3) return id + "0";
      return id;
    };
    const row = ciscoRows.find((r) => String(r.sCISCO) === pad(String(code)));
    return row?.cTitle || code;
  };

  for (const r of ciscoRows) {
    const code = String(r.sCISCO);
    if (!/^[0-9]+$/.test(code) || code.length < 4) continue;

    const major = code.slice(0, 1);
    const subMajor = code.slice(0, 2);
    const minor = code.slice(0, 3);
    const unit = code;

    if (major === subMajor || subMajor === minor || minor === unit) continue;

    const majorN = ensure(major, findTitle(major));
    if (!root.children.includes(majorN)) root.children.push(majorN);

    const subN = ensure(subMajor, findTitle(subMajor));
    if (!majorN.children.includes(subN)) majorN.children.push(subN);

    const minorN = ensure(minor, findTitle(minor));
    if (!subN.children.includes(minorN)) subN.children.push(minorN);

    const unitN = ensure(unit, r.cTitle || unit);
    unitN.description = r.cDescription || "";
    unitN.tasks = r.cTasks || "";
    if (!minorN.children.includes(unitN)) minorN.children.push(unitN);
  }
  return root;
}

// --- Single unit lookup ---

export async function getCiscoUnit(code) {
  const sql = getDb();
  const rows = await sql`SELECT cisco_code as "sCISCO", title as "cTitle", description as "cDescription", tasks as "cTasks" FROM cisco_units WHERE cisco_code = ${String(code)}`;
  if (!rows.length) return null;
  const row = rows[0];
  return { id: String(row.sCISCO), title: row.cTitle, description: row.cDescription, tasks: row.cTasks };
}

// --- Search (trigram) ---

export async function searchTitles(q, limit = 20) {
  if (!q || !String(q).trim()) return [];
  const sql = getDb();
  const rows = await sql`
    SELECT occupation_code as "sOccupation", title as "cTitle"
    FROM job_titles
    WHERE title ILIKE ${"%" + q + "%"}
    LIMIT ${limit}
  `;
  return rows;
}

export async function titleSuggestions(q, limit = 20) {
  if (!q || !String(q).trim()) return [];
  const sql = getDb();
  const rows = await sql`
    SELECT DISTINCT jt.title as label, jt.occupation_code as "sOccupation", oc.cisco_code as "sCISCO",
      cu.title as "ciscoTitle", cu.description as "ciscoDescription", cu.tasks as "ciscoTasks"
    FROM job_titles jt
    INNER JOIN occupation_cisco oc ON jt.occupation_code = oc.occupation_code
    INNER JOIN cisco_units cu ON oc.cisco_code = cu.cisco_code
    WHERE jt.title ILIKE ${"%" + q + "%"}
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    label: r.label,
    sOccupation: r.sOccupation,
    sCISCO: r.sCISCO,
    ciscoUnit: {
      id: r.sCISCO,
      title: r.ciscoTitle,
      description: r.ciscoDescription,
      tasks: r.ciscoTasks,
    },
  }));
}

// --- Employer functions ---

export async function getEmployerList() {
  const sql = getDb();
  return sql`
    SELECT
      e.id, e.slug, e.name, e.claimed, e.website, e.logo_url,
      COUNT(jp.job_id) as total_postings,
      COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW()) as active_postings,
      MIN(jp.min_salary) FILTER (WHERE jp.min_salary > 0) as min_salary,
      MAX(jp.max_salary) FILTER (WHERE jp.max_salary > 0) as max_salary,
      AVG(jp.mean_salary) FILTER (WHERE jp.mean_salary > 0) as avg_salary
    FROM employers e
    LEFT JOIN job_postings jp ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
    GROUP BY e.id, e.slug, e.name, e.claimed, e.website, e.logo_url
    ORDER BY active_postings DESC, total_postings DESC
  `;
}

export async function getEmployerBySlug(slug) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM employers WHERE slug = ${slug}`;
  if (!rows.length) return null;
  return rows[0];
}

export async function getEmployerProfile(slug) {
  const sql = getDb();
  const employer = await getEmployerBySlug(slug);
  if (!employer) return null;

  // Get all postings for this employer
  const postings = await sql`
    SELECT
      jp.job_id as "cJobId", jp.title as "cTitle", jp.status as "Status",
      jp.created_date as "createdDate", jp.start_date as "startDate", jp.end_date as "endDate",
      jp.work_type as "sWork", jp.employer as "Employer",
      jp.education as "sEducation", jp.experience as "sExperience", jp.location as "sLocation",
      jp.occupation_code as "sOccupation", jp.occupation_name as "Occupation",
      jp.hours_per_week as "Hours Per Week", jp.currency as "Currency",
      jp.salary_description as "Salary Description",
      jp.min_salary as "fMinSalary", jp.max_salary as "fMaxSalary", jp.mean_salary as "fMeanSalary",
      jp.industry as "sIndustry",
      (jp.status = 'Active' AND jp.end_date > NOW()) as "isActive"
    FROM job_postings jp
    WHERE LOWER(TRIM(jp.employer)) = LOWER(${employer.name})
    ORDER BY jp.created_date DESC
  `;

  // Aggregate stats
  const stats = {
    totalPostings: postings.length,
    activePostings: postings.filter(p => p.isActive).length,
    minSalary: Math.min(...postings.filter(p => p.fMinSalary > 0).map(p => p.fMinSalary)) || 0,
    maxSalary: Math.max(...postings.filter(p => p.fMaxSalary > 0).map(p => p.fMaxSalary)) || 0,
    avgSalary: postings.filter(p => p.fMeanSalary > 0).reduce((a, p) => a + p.fMeanSalary, 0) / Math.max(1, postings.filter(p => p.fMeanSalary > 0).length) || 0,
  };

  // Top roles
  const roleCounts = {};
  postings.forEach(p => {
    const title = p.cTitle;
    if (!title) return;
    roleCounts[title] = (roleCounts[title] || 0) + 1;
  });
  const topRoles = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([title, count]) => ({ title, count }));

  // Distributions
  const workDist = {}, eduDist = {}, expDist = {}, locDist = {};
  postings.forEach(p => {
    workDist[p.sWork || "0"] = (workDist[p.sWork || "0"] || 0) + 1;
    eduDist[p.sEducation || "0"] = (eduDist[p.sEducation || "0"] || 0) + 1;
    expDist[p.sExperience || "0"] = (expDist[p.sExperience || "0"] || 0) + 1;
    locDist[p.sLocation || "0"] = (locDist[p.sLocation || "0"] || 0) + 1;
  });

  // Hiring timeline (postings per month)
  const timeline = {};
  postings.forEach(p => {
    if (!p.createdDate) return;
    const d = new Date(p.createdDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    timeline[key] = (timeline[key] || 0) + 1;
  });

  // Industries
  const industries = {};
  postings.forEach(p => {
    if (p.sIndustry) industries[p.sIndustry] = (industries[p.sIndustry] || 0) + 1;
  });

  return {
    employer,
    postings,
    stats,
    topRoles,
    distributions: { work: workDist, edu: eduDist, exp: expDist, loc: locDist },
    timeline: Object.entries(timeline).sort((a, b) => a[0].localeCompare(b[0])),
    industries: Object.entries(industries).sort((a, b) => b[1] - a[1]),
  };
}

// --- Candidate functions ---

export async function getCandidateById(id) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM candidates WHERE id = ${id}`;
  return rows[0] || null;
}

export async function getCandidateByEmail(email) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM candidates WHERE email = ${email.toLowerCase()}`;
  return rows[0] || null;
}

export async function upsertCandidate(email, data) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO candidates (email, name, is_caymanian, education_code, experience_code, location_code,
      availability, is_discoverable, bio, salary_min, work_type_preferences, linkedin_url, resume_summary,
      profile_picture_url, headline, phone, portfolio_url, years_of_experience, preferred_industries, willing_to_relocate)
    VALUES (${email.toLowerCase()}, ${data.name || null}, ${data.isCaymanian || false},
            ${data.educationCode || null}, ${data.experienceCode || null}, ${data.locationCode || null},
            ${data.availability || 'actively_looking'}, ${data.isDiscoverable || false}, ${data.bio || null},
            ${data.salaryMin || null},
            ${data.workTypePreferences || []}, ${data.linkedinUrl || null}, ${data.resumeSummary || null},
            ${data.profilePictureUrl || null}, ${data.headline || null}, ${data.phone || null},
            ${data.portfolioUrl || null}, ${data.yearsOfExperience || null},
            ${data.preferredIndustries || []}, ${data.willingToRelocate || false})
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, candidates.name),
      is_caymanian = EXCLUDED.is_caymanian,
      education_code = COALESCE(EXCLUDED.education_code, candidates.education_code),
      experience_code = COALESCE(EXCLUDED.experience_code, candidates.experience_code),
      location_code = COALESCE(EXCLUDED.location_code, candidates.location_code),
      availability = EXCLUDED.availability,
      is_discoverable = EXCLUDED.is_discoverable,
      bio = COALESCE(EXCLUDED.bio, candidates.bio),
      salary_min = EXCLUDED.salary_min,
      work_type_preferences = EXCLUDED.work_type_preferences,
      linkedin_url = COALESCE(EXCLUDED.linkedin_url, candidates.linkedin_url),
      resume_summary = COALESCE(EXCLUDED.resume_summary, candidates.resume_summary),
      profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, candidates.profile_picture_url),
      headline = COALESCE(EXCLUDED.headline, candidates.headline),
      phone = COALESCE(EXCLUDED.phone, candidates.phone),
      portfolio_url = COALESCE(EXCLUDED.portfolio_url, candidates.portfolio_url),
      years_of_experience = COALESCE(EXCLUDED.years_of_experience, candidates.years_of_experience),
      preferred_industries = EXCLUDED.preferred_industries,
      willing_to_relocate = EXCLUDED.willing_to_relocate,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

export async function updateCandidateInterests(candidateId, ciscoCodes) {
  const sql = getDb();
  await sql`DELETE FROM candidate_interests WHERE candidate_id = ${candidateId}`;
  for (const code of ciscoCodes) {
    await sql`INSERT INTO candidate_interests (candidate_id, cisco_code) VALUES (${candidateId}, ${code}) ON CONFLICT DO NOTHING`;
  }
}

export async function getCandidateInterests(candidateId) {
  const sql = getDb();
  return sql`
    SELECT ci.cisco_code, cu.title
    FROM candidate_interests ci
    LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
    WHERE ci.candidate_id = ${candidateId}
  `;
}

// --- Talent search (for employers) ---

export async function searchTalent(filters = {}) {
  const sql = getDb();
  const { ciscoCode, educationCode, experienceCode, locationCode, availability, isCaymanian } = filters;

  // Use parameterized queries for safety
  const rows = await sql`
    SELECT DISTINCT c.id, c.education_code, c.experience_code, c.location_code,
           c.availability, c.is_caymanian, c.bio, c.created_at
    FROM candidates c
    LEFT JOIN candidate_interests ci ON c.id = ci.candidate_id
    LEFT JOIN candidate_skills cs ON c.id = cs.candidate_id
    WHERE c.is_discoverable = TRUE
      AND (${ciscoCode || null}::text IS NULL OR ci.cisco_code = ${ciscoCode || null})
      AND (${educationCode || null}::text IS NULL OR c.education_code = ${educationCode || null})
      AND (${experienceCode || null}::text IS NULL OR c.experience_code = ${experienceCode || null})
      AND (${locationCode || null}::text IS NULL OR c.location_code = ${locationCode || null})
      AND (${availability || null}::text IS NULL OR c.availability = ${availability || null})
      AND (${isCaymanian ? true : null}::boolean IS NULL OR c.is_caymanian = TRUE)
    ORDER BY c.created_at DESC
    LIMIT 100
  `;

  // Enrich with interests and skills
  const enriched = [];
  for (const row of rows) {
    const interests = await sql`
      SELECT ci.cisco_code, cu.title
      FROM candidate_interests ci
      LEFT JOIN cisco_units cu ON ci.cisco_code = cu.cisco_code
      WHERE ci.candidate_id = ${row.id}
    `;
    const skills = await sql`
      SELECT s.id, s.name, s.category
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_id = ${row.id}
    `;
    enriched.push({ ...row, interests, skills });
  }
  return enriched;
}

// --- Employer accounts ---

export async function getEmployerAccountByEmail(email) {
  const sql = getDb();
  const rows = await sql`
    SELECT ea.*, e.name as employer_name, e.slug as employer_slug
    FROM employer_accounts ea
    LEFT JOIN employers e ON ea.employer_id = e.id
    WHERE ea.email = ${email.toLowerCase()}
  `;
  return rows[0] || null;
}

export async function upsertEmployerAccount(email, data) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO employer_accounts (email, employer_id, name)
    VALUES (${email.toLowerCase()}, ${data.employerId || null}, ${data.name || null})
    ON CONFLICT (email) DO UPDATE SET
      employer_id = COALESCE(EXCLUDED.employer_id, employer_accounts.employer_id),
      name = COALESCE(EXCLUDED.name, employer_accounts.name)
    RETURNING *
  `;
  return rows[0];
}

// --- Introductions ---

export async function createIntroduction(employerAccountId, candidateId, message, jobId = null, matchScore = null, matchBreakdown = null) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO introductions (employer_account_id, candidate_id, message, job_id, match_score, match_breakdown)
    SELECT ${employerAccountId}, ${candidateId}, ${message || null}, ${jobId || null},
           ${matchScore != null ? matchScore : null}, ${matchBreakdown ? JSON.stringify(matchBreakdown) : null}
    WHERE NOT EXISTS (
      SELECT 1 FROM introductions
      WHERE employer_account_id = ${employerAccountId} AND candidate_id = ${candidateId}
        AND ((job_id IS NULL AND ${jobId || null}::text IS NULL) OR job_id = ${jobId || null})
    )
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getIntroductionsForCandidate(candidateId) {
  const sql = getDb();
  return sql`
    SELECT i.*,
           ea.name as employer_contact_name,
           CASE WHEN i.status = 'accepted' THEN ea.email ELSE NULL END as employer_contact_email,
           e.name as employer_name, e.slug as employer_slug,
           jp.title as job_title, jp.min_salary as job_min_salary,
           jp.max_salary as job_max_salary, jp.salary_description as job_salary_description,
           i.initiated_by
    FROM introductions i
    JOIN employer_accounts ea ON i.employer_account_id = ea.id
    LEFT JOIN employers e ON ea.employer_id = e.id
    LEFT JOIN job_postings jp ON i.job_id = jp.job_id
    WHERE i.candidate_id = ${candidateId}
    ORDER BY i.created_at DESC
  `;
}

export async function getIntroductionsForEmployer(employerAccountId) {
  const sql = getDb();
  return sql`
    SELECT i.*,
           CASE WHEN i.status = 'accepted' THEN c.name ELSE NULL END as candidate_name,
           CASE WHEN i.status = 'accepted' THEN c.email ELSE NULL END as candidate_email,
           CASE WHEN i.status = 'accepted' THEN c.linkedin_url ELSE NULL END as candidate_linkedin,
           c.education_code, c.experience_code, c.location_code,
           jp.title as job_title,
           i.initiated_by, i.rejection_reason, i.rejection_notes
    FROM introductions i
    JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN job_postings jp ON i.job_id = jp.job_id
    WHERE i.employer_account_id = ${employerAccountId}
    ORDER BY i.created_at DESC
  `;
}

export async function respondToIntroduction(introductionId, candidateId, accept) {
  const sql = getDb();
  const status = accept ? "accepted" : "declined";
  await sql`
    UPDATE introductions SET status = ${status}, responded_at = NOW()
    WHERE id = ${introductionId} AND candidate_id = ${candidateId}
  `;
}

// --- Skills ---

export async function searchSkills(query, limit = 20) {
  if (!query) return [];
  const sql = getDb();
  return sql`
    SELECT id, name, category FROM skills
    WHERE name ILIKE ${"%" + query + "%"}
    ORDER BY name
    LIMIT ${limit}
  `;
}

export async function getSkillsForCisco(ciscoCode) {
  const sql = getDb();
  return sql`
    SELECT s.id, s.name, s.category
    FROM cisco_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.cisco_code = ${ciscoCode}
    ORDER BY s.name
  `;
}

export async function updateCandidateSkills(candidateId, skillIds) {
  const sql = getDb();
  await sql`DELETE FROM candidate_skills WHERE candidate_id = ${candidateId}`;
  for (const id of skillIds) {
    await sql`INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (${candidateId}, ${id}) ON CONFLICT DO NOTHING`;
  }
}

export async function getCandidateSkills(candidateId) {
  const sql = getDb();
  return sql`
    SELECT s.id, s.name, s.category
    FROM candidate_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.candidate_id = ${candidateId}
    ORDER BY s.name
  `;
}

// --- Notifications ---

export async function getNotifications(recipientType, recipientId, limit = 50) {
  const sql = getDb();
  return sql`
    SELECT * FROM notifications
    WHERE recipient_type = ${recipientType} AND recipient_id = ${recipientId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function getUnreadCount(recipientType, recipientId) {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_type = ${recipientType} AND recipient_id = ${recipientId} AND is_read = FALSE
  `;
  return Number(rows[0].count);
}

export async function markNotificationRead(id, recipientType, recipientId) {
  const sql = getDb();
  await sql`
    UPDATE notifications SET is_read = TRUE
    WHERE id = ${id} AND recipient_type = ${recipientType} AND recipient_id = ${recipientId}
  `;
}

export async function markAllNotificationsRead(recipientType, recipientId) {
  const sql = getDb();
  await sql`
    UPDATE notifications SET is_read = TRUE
    WHERE recipient_type = ${recipientType} AND recipient_id = ${recipientId} AND is_read = FALSE
  `;
}

export async function createNotification(recipientType, recipientId, title, body, link) {
  const sql = getDb();
  await sql`
    INSERT INTO notifications (recipient_type, recipient_id, title, body, link)
    VALUES (${recipientType}, ${recipientId}, ${title}, ${body || null}, ${link || null})
  `;
}

// --- Match alerts ---

export async function getMatchAlerts(candidateId) {
  const sql = getDb();
  return sql`SELECT * FROM match_alerts WHERE candidate_id = ${candidateId} AND is_active = TRUE`;
}

export async function createMatchAlert(candidateId, filters, frequency = "daily") {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO match_alerts (candidate_id, filters, frequency)
    VALUES (${candidateId}, ${JSON.stringify(filters)}, ${frequency})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteMatchAlert(id, candidateId) {
  const sql = getDb();
  await sql`DELETE FROM match_alerts WHERE id = ${id} AND candidate_id = ${candidateId}`;
}

// --- Single job posting loader ---

export async function getJobPostingById(jobId) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      job_id as "cJobId",
      title as "cTitle",
      status as "Status",
      created_date as "createdDate",
      start_date as "startDate",
      end_date as "endDate",
      work_type as "sWork",
      employer as "Employer",
      education as "sEducation",
      experience as "sExperience",
      location as "sLocation",
      occupation_code as "sOccupation",
      occupation_name as "Occupation",
      hours_per_week as "hoursPerWeek",
      currency as "Currency",
      salary_description as "salaryShort",
      salary_long as "salaryLong",
      min_salary as "fMinSalary",
      max_salary as "fMaxSalary",
      mean_salary as "fMeanSalary",
      industry as "Industry",
      job_description as "jobDescription",
      frequency_of_payment as "frequencyOfPayment",
      kyd_per_annum as "kydPerAnnum",
      number_of_positions as "numberOfPositions",
      medical_check as "medicalCheck",
      police_check as "policeCheck",
      driving_license as "drivingLicense",
      cover_letter_required as "coverLetterRequired",
      applicant_count as "applicantCount",
      (status = 'Active' AND end_date > NOW()) as "isActive"
    FROM job_postings
    WHERE job_id = ${jobId}
  `;
  return rows[0] || null;
}

// --- Employer search (for claim flow) ---

export async function searchEmployersByName(query) {
  if (!query || !String(query).trim()) return [];
  const sql = getDb();
  return sql`
    SELECT id, slug, name, claimed, website, logo_url
    FROM employers
    WHERE name ILIKE ${"%" + query + "%"}
    ORDER BY name
    LIMIT 20
  `;
}

// --- Employer dashboard stats ---

export async function getEmployerDashboardStats(employerAccountId) {
  const sql = getDb();
  const intros = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
      COUNT(*) FILTER (WHERE status = 'declined') as declined,
      AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600)
        FILTER (WHERE responded_at IS NOT NULL) as avg_response_hours,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '60 days' AND created_at <= NOW() - INTERVAL '30 days') as last_month
    FROM introductions
    WHERE employer_account_id = ${employerAccountId}
  `;

  const pipeline = await sql`
    SELECT stage, COUNT(*) as count
    FROM introductions
    WHERE employer_account_id = ${employerAccountId}
    GROUP BY stage
  `;

  const activity = await sql`
    SELECT * FROM activity_log
    WHERE employer_account_id = ${employerAccountId}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const row = intros[0];
  const responded = Number(row.accepted) + Number(row.declined);
  return {
    total: Number(row.total),
    pending: Number(row.pending),
    accepted: Number(row.accepted),
    declined: Number(row.declined),
    responseRate: responded > 0 ? Math.round(Number(row.accepted) / responded * 100) : 0,
    avgResponseHours: row.avg_response_hours ? Math.round(Number(row.avg_response_hours)) : null,
    thisMonth: Number(row.this_month),
    lastMonth: Number(row.last_month),
    pipeline: Object.fromEntries(pipeline.map(p => [p.stage, Number(p.count)])),
    recentActivity: activity,
  };
}

// --- Introduction by ID ---

export async function getIntroductionById(id) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM introductions WHERE id = ${id}`;
  return rows[0] || null;
}

// --- Job postings paginated (server-side) ---

export async function getActiveJobPostingsPaginated(page = 1, pageSize = 12, filters = {}) {
  const sql = getDb();
  const offset = (page - 1) * pageSize;
  const { search, location, workType, employer, sort } = filters;

  const searchPattern = search ? `%${search}%` : null;
  const employerPattern = employer ? `%${employer}%` : null;

  // Count total matching
  const countResult = await sql`
    SELECT COUNT(*) as total
    FROM job_postings
    WHERE status = 'Active' AND end_date > NOW()
      AND (${searchPattern}::text IS NULL OR (title ILIKE ${searchPattern} OR employer ILIKE ${searchPattern}))
      AND (${location || null}::text IS NULL OR location = ${location || null})
      AND (${workType || null}::text IS NULL OR work_type = ${workType || null})
      AND (${employerPattern}::text IS NULL OR employer ILIKE ${employerPattern})
  `;

  // Use separate queries per sort to avoid dynamic ORDER BY
  let rows;
  const whereClause = sql`
    WHERE status = 'Active' AND end_date > NOW()
      AND (${searchPattern}::text IS NULL OR (title ILIKE ${searchPattern} OR employer ILIKE ${searchPattern}))
      AND (${location || null}::text IS NULL OR location = ${location || null})
      AND (${workType || null}::text IS NULL OR work_type = ${workType || null})
      AND (${employerPattern}::text IS NULL OR employer ILIKE ${employerPattern})
  `;

  const selectCols = sql`
    job_id as "cJobId", title as "cTitle", status as "Status",
    created_date as "createdDate", start_date as "startDate", end_date as "endDate",
    work_type as "sWork", employer as "Employer",
    education as "sEducation", experience as "sExperience", location as "sLocation",
    occupation_code as "sOccupation", occupation_name as "Occupation",
    hours_per_week as "Hours Per Week", currency as "Currency",
    salary_description as "Salary Description",
    min_salary as "fMinSalary", max_salary as "fMaxSalary", mean_salary as "fMeanSalary",
    industry as "sIndustry"
  `;

  if (sort === "salary_desc") {
    rows = await sql`SELECT ${selectCols} FROM job_postings ${whereClause} ORDER BY mean_salary DESC NULLS LAST LIMIT ${pageSize} OFFSET ${offset}`;
  } else if (sort === "salary_asc") {
    rows = await sql`SELECT ${selectCols} FROM job_postings ${whereClause} ORDER BY mean_salary ASC NULLS LAST LIMIT ${pageSize} OFFSET ${offset}`;
  } else {
    rows = await sql`SELECT ${selectCols} FROM job_postings ${whereClause} ORDER BY created_date DESC LIMIT ${pageSize} OFFSET ${offset}`;
  }

  return { jobs: rows, total: Number(countResult[0].total) };
}

// --- Employer postings (for current employer) ---

export async function getEmployerPostings(employerId) {
  const sql = getDb();
  // Look up employer name first
  const employers = await sql`SELECT name FROM employers WHERE id = ${employerId}`;
  if (!employers.length) return [];
  const employerName = employers[0].name;

  return sql`
    SELECT job_id as "cJobId", title as "cTitle", status as "Status",
           created_date as "createdDate", end_date as "endDate",
           occupation_code as "sOccupation", occupation_name as "Occupation",
           education as "sEducation", experience as "sExperience", location as "sLocation",
           work_type as "sWork",
           (status = 'Active' AND end_date > NOW()) as "isActive"
    FROM job_postings
    WHERE LOWER(TRIM(employer)) = LOWER(${employerName})
    ORDER BY created_date DESC
  `;
}

// --- Compliance report data ---

export async function getComplianceReportData(employerAccountId, jobId) {
  const sql = getDb();

  // Job details
  const jobs = await sql`SELECT * FROM job_postings WHERE job_id = ${jobId}`;
  if (!jobs.length) return null;
  const job = jobs[0];

  // All intros for this job with candidate demographics (anonymized)
  const intros = await sql`
    SELECT i.id, i.status, i.stage, i.match_score, i.match_breakdown,
           i.created_at, i.responded_at, i.message,
           i.initiated_by, i.rejection_reason, i.rejection_notes,
           c.is_caymanian, c.education_code, c.experience_code, c.location_code
    FROM introductions i
    JOIN candidates c ON i.candidate_id = c.id
    WHERE i.employer_account_id = ${employerAccountId} AND i.job_id = ${jobId}
    ORDER BY i.created_at ASC
  `;

  // Activity timeline
  const activity = await sql`
    SELECT * FROM activity_log
    WHERE employer_account_id = ${employerAccountId} AND job_id = ${jobId}
    ORDER BY created_at ASC
  `;

  // Summary stats
  const caymanianCount = intros.filter(i => i.is_caymanian).length;
  const respondedCount = intros.filter(i => i.responded_at).length;
  const stageBreakdown = {};
  const statusBreakdown = {};
  const rejectionBreakdown = {};
  for (const i of intros) {
    const stage = i.stage || "outreach";
    const status = i.status || "pending";
    stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    if (i.rejection_reason) {
      rejectionBreakdown[i.rejection_reason] = (rejectionBreakdown[i.rejection_reason] || 0) + 1;
    }
  }

  return {
    job,
    intros,
    activity,
    summary: {
      totalContacted: intros.length,
      responseRate: intros.length > 0 ? Math.round((respondedCount / intros.length) * 100) : 0,
      caymanianCount,
      stageBreakdown,
      statusBreakdown,
      rejectionBreakdown,
      dateRange: {
        first: intros[0]?.created_at || null,
        last: intros[intros.length - 1]?.created_at || null,
      },
    },
  };
}

// --- Candidate interest / bidirectional introductions ---

export async function checkEmployerForJob(jobId) {
  const sql = getDb();
  const rows = await sql`
    SELECT ea.id as employer_account_id, e.name as employer_name
    FROM job_postings jp
    JOIN employers e ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
    JOIN employer_accounts ea ON ea.employer_id = e.id
    WHERE jp.job_id = ${jobId}
    LIMIT 1
  `;
  return rows[0] ? { employerAccountId: rows[0].employer_account_id, employerName: rows[0].employer_name } : null;
}

export async function createCandidateInterest(candidateId, employerAccountId, jobId, message) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO introductions (employer_account_id, candidate_id, message, job_id, initiated_by, status, stage)
    SELECT ${employerAccountId}, ${candidateId}, ${message || null}, ${jobId}, 'candidate', 'pending', 'outreach'
    WHERE NOT EXISTS (
      SELECT 1 FROM introductions
      WHERE employer_account_id = ${employerAccountId} AND candidate_id = ${candidateId}
        AND job_id = ${jobId} AND initiated_by = 'candidate'
    )
    RETURNING *
  `;
  return rows[0] || null;
}

export async function respondToIntroductionAsEmployer(introductionId, employerAccountId, accept) {
  const sql = getDb();
  const status = accept ? "accepted" : "declined";
  await sql`
    UPDATE introductions SET status = ${status}, responded_at = NOW(),
      stage = CASE WHEN ${accept} THEN 'responded' ELSE stage END
    WHERE id = ${introductionId} AND employer_account_id = ${employerAccountId} AND initiated_by = 'candidate'
  `;
}

// --- Introduction messages ---

export async function getIntroductionMessages(introductionId) {
  const sql = getDb();
  return sql`
    SELECT * FROM introduction_messages
    WHERE introduction_id = ${introductionId}
    ORDER BY created_at ASC
  `;
}

export async function createIntroductionMessage(introductionId, senderType, senderId, body) {
  const sql = getDb();
  // Verify intro is accepted
  const intros = await sql`SELECT status FROM introductions WHERE id = ${introductionId}`;
  if (!intros.length || intros[0].status !== 'accepted') return null;

  const rows = await sql`
    INSERT INTO introduction_messages (introduction_id, sender_type, sender_id, body)
    VALUES (${introductionId}, ${senderType}, ${senderId}, ${body})
    RETURNING *
  `;
  return rows[0] || null;
}

// --- Job interests (lead gen for employers not on platform) ---

export async function createJobInterest(candidateId, jobId, employerName, jobTitle, message) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO job_interests (candidate_id, job_id, employer_name, job_title, message)
    VALUES (${candidateId}, ${jobId}, ${employerName || null}, ${jobTitle || null}, ${message || null})
    ON CONFLICT (candidate_id, job_id) DO NOTHING
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getJobInterestsForCandidate(candidateId) {
  const sql = getDb();
  return sql`SELECT * FROM job_interests WHERE candidate_id = ${candidateId} ORDER BY created_at DESC`;
}

export async function getJobInterestsByEmployer(employerName) {
  const sql = getDb();
  return sql`
    SELECT ji.*, c.name as candidate_name
    FROM job_interests ji
    JOIN candidates c ON ji.candidate_id = c.id
    WHERE LOWER(TRIM(ji.employer_name)) = LOWER(TRIM(${employerName}))
    ORDER BY ji.created_at DESC
  `;
}

// --- Pitch deck data ---

export async function getEmployerPitchData(slug) {
  const sql = getDb();
  const rows = await sql`
    SELECT e.name, e.slug, e.claimed,
      COUNT(jp.job_id) as job_count,
      COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW()) as active_count,
      MODE() WITHIN GROUP (ORDER BY jp.industry) as primary_industry,
      AVG(jp.mean_salary) FILTER (WHERE jp.mean_salary > 0) as avg_salary
    FROM employers e
    LEFT JOIN job_postings jp ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
    WHERE e.slug = ${slug}
    GROUP BY e.id, e.name, e.slug, e.claimed
  `;
  return rows[0] || null;
}

// --- Admin data ---

export async function getAdminStats() {
  const sql = getDb();

  const [employers, candidates, jobs, interests, intros, pitchViews] = await Promise.all([
    sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE claimed = true) as claimed FROM employers`,
    sql`SELECT COUNT(*) as total FROM candidates`,
    sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Active' AND end_date > NOW()) as active FROM job_postings`,
    sql`SELECT COUNT(*) as total FROM job_interests`,
    sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'accepted') as accepted FROM introductions`,
    sql`SELECT COUNT(*) as total FROM pitch_views WHERE viewed_at > NOW() - INTERVAL '30 days'`,
  ]);

  return {
    totalEmployers: Number(employers[0].total),
    claimedEmployers: Number(employers[0].claimed),
    totalCandidates: Number(candidates[0].total),
    totalJobs: Number(jobs[0].total),
    activeJobs: Number(jobs[0].active),
    totalInterests: Number(interests[0].total),
    totalIntros: Number(intros[0].total),
    acceptedIntros: Number(intros[0].accepted),
    pitchViews30d: Number(pitchViews[0].total),
  };
}

export async function getAdminPitchList(search = '', page = 1, pageSize = 50) {
  const sql = getDb();
  const offset = (page - 1) * pageSize;
  const searchPattern = search ? `%${search}%` : null;

  const rows = await sql`
    SELECT
      e.id, e.name, e.slug, e.claimed,
      COUNT(jp.job_id) as job_count,
      COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW()) as active_jobs,
      MODE() WITHIN GROUP (ORDER BY jp.industry) as industry,
      COALESCE(pv.view_count, 0) as view_count,
      pv.last_viewed,
      eo.status as outreach_status,
      eo.notes as outreach_notes,
      eo.contacted_at
    FROM employers e
    LEFT JOIN job_postings jp ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
    LEFT JOIN (
      SELECT employer_slug, COUNT(*) as view_count, MAX(viewed_at) as last_viewed
      FROM pitch_views GROUP BY employer_slug
    ) pv ON pv.employer_slug = e.slug
    LEFT JOIN employer_outreach eo ON eo.employer_slug = e.slug
    WHERE (${searchPattern}::text IS NULL OR e.name ILIKE ${searchPattern})
    GROUP BY e.id, e.name, e.slug, e.claimed, pv.view_count, pv.last_viewed, eo.status, eo.notes, eo.contacted_at
    ORDER BY COUNT(jp.job_id) DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countResult = await sql`
    SELECT COUNT(*) as total FROM employers
    WHERE (${searchPattern}::text IS NULL OR name ILIKE ${searchPattern})
  `;

  return { employers: rows, total: Number(countResult[0].total) };
}

export async function getAdminInterests() {
  const sql = getDb();
  return sql`
    SELECT ji.*,
      c.name as candidate_name, c.email as candidate_email, c.is_caymanian,
      CASE WHEN EXISTS (
        SELECT 1 FROM employers e
        JOIN employer_accounts ea ON ea.employer_id = e.id
        WHERE LOWER(TRIM(e.name)) = LOWER(TRIM(ji.employer_name))
      ) THEN true ELSE false END as employer_on_platform
    FROM job_interests ji
    JOIN candidates c ON ji.candidate_id = c.id
    ORDER BY ji.created_at DESC
  `;
}

export async function getAdminOutreachList() {
  const sql = getDb();
  return sql`
    SELECT
      e.id, e.name, e.slug, e.claimed,
      COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW()) as active_jobs,
      COALESCE(ic.interest_count, 0) as interest_count,
      COALESCE(pv.view_count, 0) as view_count,
      eo.status as outreach_status,
      eo.notes,
      eo.contacted_at,
      (COALESCE(ic.interest_count, 0) * 3 + COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW())) as priority_score
    FROM employers e
    LEFT JOIN job_postings jp ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
    LEFT JOIN employer_accounts ea ON ea.employer_id = e.id
    LEFT JOIN (
      SELECT LOWER(TRIM(employer_name)) as emp_name, COUNT(*) as interest_count
      FROM job_interests GROUP BY LOWER(TRIM(employer_name))
    ) ic ON ic.emp_name = LOWER(e.name)
    LEFT JOIN (
      SELECT employer_slug, COUNT(*) as view_count FROM pitch_views GROUP BY employer_slug
    ) pv ON pv.employer_slug = e.slug
    LEFT JOIN employer_outreach eo ON eo.employer_slug = e.slug
    WHERE ea.id IS NULL
    GROUP BY e.id, e.name, e.slug, e.claimed, ic.interest_count, pv.view_count, eo.status, eo.notes, eo.contacted_at
    ORDER BY (COALESCE(ic.interest_count, 0) * 3 + COUNT(jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW())) DESC
  `;
}

export async function getAdminCandidates() {
  const sql = getDb();

  const [statsRows, candidates] = await Promise.all([
    Promise.all([
      sql`SELECT COUNT(*) as total FROM candidates`,
      sql`SELECT COUNT(*) as total FROM candidates WHERE is_caymanian = true`,
      sql`SELECT COUNT(*) as total FROM candidates WHERE is_discoverable = true`,
      sql`SELECT COUNT(*) as total FROM candidates WHERE availability = 'actively_looking'`,
      sql`SELECT COUNT(*) as total FROM candidates WHERE created_at > NOW() - INTERVAL '7 days'`,
    ]),
    sql`
      SELECT
        c.id, c.email, c.name, c.is_caymanian, c.education_code, c.experience_code,
        c.availability, c.is_discoverable, c.headline, c.created_at,
        et.description as education_label,
        xt.description as experience_label,
        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as skills,
        COALESCE(ji_count.cnt, 0) as interest_count,
        COALESCE(intro_count.cnt, 0) as intro_count
      FROM candidates c
      LEFT JOIN education_types et ON et.code = c.education_code
      LEFT JOIN experience_types xt ON xt.code = c.experience_code
      LEFT JOIN candidate_skills cs ON cs.candidate_id = c.id
      LEFT JOIN skills s ON s.id = cs.skill_id
      LEFT JOIN (
        SELECT candidate_id, COUNT(*) as cnt FROM job_interests GROUP BY candidate_id
      ) ji_count ON ji_count.candidate_id = c.id
      LEFT JOIN (
        SELECT candidate_id, COUNT(*) as cnt FROM introductions GROUP BY candidate_id
      ) intro_count ON intro_count.candidate_id = c.id
      GROUP BY c.id, c.email, c.name, c.is_caymanian, c.education_code, c.experience_code,
               c.availability, c.is_discoverable, c.headline, c.created_at,
               et.description, xt.description, ji_count.cnt, intro_count.cnt
      ORDER BY c.created_at DESC
    `,
  ]);

  const [total, caymanian, discoverable, activelyLooking, newThisWeek] = statsRows;

  return {
    stats: {
      total: Number(total[0].total),
      caymanian: Number(caymanian[0].total),
      discoverable: Number(discoverable[0].total),
      activelyLooking: Number(activelyLooking[0].total),
      newThisWeek: Number(newThisWeek[0].total),
    },
    candidates,
  };
}

export async function getAdminEmployers() {
  const sql = getDb();

  const [statsRows, employers] = await Promise.all([
    Promise.all([
      sql`SELECT COUNT(*) as total FROM employers`,
      sql`SELECT COUNT(*) as total FROM employers WHERE claimed = true`,
      sql`SELECT COUNT(DISTINCT e.id) as total FROM employers e JOIN employer_accounts ea ON ea.employer_id = e.id`,
      sql`SELECT COUNT(*) as total FROM employers WHERE created_at > NOW() - INTERVAL '30 days'`,
    ]),
    sql`
      SELECT
        e.id, e.name, e.slug, e.claimed, e.created_at,
        array_agg(DISTINCT ea.email) FILTER (WHERE ea.email IS NOT NULL) as admin_emails,
        array_agg(DISTINCT ea.name) FILTER (WHERE ea.name IS NOT NULL) as admin_names,
        COUNT(DISTINCT jp.job_id) as job_count,
        COUNT(DISTINCT jp.job_id) FILTER (WHERE jp.status = 'Active' AND jp.end_date > NOW()) as active_jobs,
        MODE() WITHIN GROUP (ORDER BY jp.industry) as industry,
        COALESCE(ji_count.cnt, 0) as interest_count,
        COALESCE(intro_count.cnt, 0) as intro_count
      FROM employers e
      LEFT JOIN employer_accounts ea ON ea.employer_id = e.id
      LEFT JOIN job_postings jp ON LOWER(TRIM(jp.employer)) = LOWER(e.name)
      LEFT JOIN (
        SELECT LOWER(TRIM(employer_name)) as emp_name, COUNT(*) as cnt
        FROM job_interests GROUP BY LOWER(TRIM(employer_name))
      ) ji_count ON ji_count.emp_name = LOWER(e.name)
      LEFT JOIN (
        SELECT jp2.employer, COUNT(*) as cnt
        FROM introductions i
        JOIN job_interests ji ON ji.id = i.interest_id
        JOIN job_postings jp2 ON jp2.job_id = ji.job_id
        GROUP BY jp2.employer
      ) intro_count ON LOWER(TRIM(intro_count.employer)) = LOWER(e.name)
      GROUP BY e.id, e.name, e.slug, e.claimed, e.created_at, ji_count.cnt, intro_count.cnt
      ORDER BY e.created_at DESC
    `,
  ]);

  const [total, claimed, withAdmins, newThisMonth] = statsRows;

  return {
    stats: {
      total: Number(total[0].total),
      claimed: Number(claimed[0].total),
      withAdmins: Number(withAdmins[0].total),
      newThisMonth: Number(newThisMonth[0].total),
    },
    employers,
  };
}

export async function logPitchView(slug, referrer, ipHash) {
  const sql = getDb();
  await sql`
    INSERT INTO pitch_views (employer_slug, referrer, ip_hash)
    VALUES (${slug}, ${referrer || null}, ${ipHash || null})
  `;
}

export async function upsertOutreach(slug, status, notes) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO employer_outreach (employer_slug, status, notes, contacted_at, updated_at)
    VALUES (${slug}, ${status}, ${notes || null}, ${status !== 'not_contacted' ? new Date() : null}, NOW())
    ON CONFLICT (employer_slug) DO UPDATE SET
      status = EXCLUDED.status,
      notes = COALESCE(EXCLUDED.notes, employer_outreach.notes),
      contacted_at = CASE WHEN EXCLUDED.status != 'not_contacted' AND employer_outreach.contacted_at IS NULL THEN NOW() ELSE employer_outreach.contacted_at END,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

// --- URL helper (stateless, no DB needed) ---

export function generateWORCSearchURL(jobPosting) {
  const baseURL = "https://my.egov.ky/web/myworc/find-a-job#/";
  const params = new URLSearchParams();
  if (jobPosting.cTitle) params.append("search", jobPosting.cTitle);
  if (jobPosting.Employer) params.append("employer", jobPosting.Employer);
  return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
}
