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
    INSERT INTO candidates (email, name, is_caymanian, education_code, experience_code, location_code, availability, is_discoverable, bio)
    VALUES (${email.toLowerCase()}, ${data.name || null}, ${data.isCaymanian || false},
            ${data.educationCode || null}, ${data.experienceCode || null}, ${data.locationCode || null},
            ${data.availability || 'actively_looking'}, ${data.isDiscoverable || false}, ${data.bio || null})
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, candidates.name),
      is_caymanian = EXCLUDED.is_caymanian,
      education_code = COALESCE(EXCLUDED.education_code, candidates.education_code),
      experience_code = COALESCE(EXCLUDED.experience_code, candidates.experience_code),
      location_code = COALESCE(EXCLUDED.location_code, candidates.location_code),
      availability = EXCLUDED.availability,
      is_discoverable = EXCLUDED.is_discoverable,
      bio = COALESCE(EXCLUDED.bio, candidates.bio),
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
  const { ciscoCode, educationCode, experienceCode, locationCode, availability, skillIds } = filters;

  let query = `
    SELECT DISTINCT c.id, c.education_code, c.experience_code, c.location_code,
           c.availability, c.is_caymanian, c.bio, c.created_at
    FROM candidates c
  `;

  const conditions = ["c.is_discoverable = TRUE"];
  const joins = [];

  if (ciscoCode) {
    joins.push("INNER JOIN candidate_interests ci ON c.id = ci.candidate_id");
    conditions.push(`ci.cisco_code = '${ciscoCode}'`);
  }

  if (skillIds && skillIds.length > 0) {
    joins.push("INNER JOIN candidate_skills cs ON c.id = cs.candidate_id");
    conditions.push(`cs.skill_id IN (${skillIds.join(",")})`);
  }

  if (educationCode) conditions.push(`c.education_code = '${educationCode}'`);
  if (experienceCode) conditions.push(`c.experience_code = '${experienceCode}'`);
  if (locationCode) conditions.push(`c.location_code = '${locationCode}'`);
  if (availability) conditions.push(`c.availability = '${availability}'`);

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

export async function createIntroduction(employerAccountId, candidateId, message) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO introductions (employer_account_id, candidate_id, message)
    VALUES (${employerAccountId}, ${candidateId}, ${message || null})
    ON CONFLICT (employer_account_id, candidate_id) DO NOTHING
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getIntroductionsForCandidate(candidateId) {
  const sql = getDb();
  return sql`
    SELECT i.*, ea.name as employer_contact_name, e.name as employer_name, e.slug as employer_slug
    FROM introductions i
    JOIN employer_accounts ea ON i.employer_account_id = ea.id
    LEFT JOIN employers e ON ea.employer_id = e.id
    WHERE i.candidate_id = ${candidateId}
    ORDER BY i.created_at DESC
  `;
}

export async function getIntroductionsForEmployer(employerAccountId) {
  const sql = getDb();
  return sql`
    SELECT i.*, c.name as candidate_name, c.email as candidate_email,
           c.education_code, c.experience_code, c.location_code
    FROM introductions i
    JOIN candidates c ON i.candidate_id = c.id
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

// --- URL helper (stateless, no DB needed) ---

export function generateWORCSearchURL(jobPosting) {
  const baseURL = "https://my.egov.ky/web/myworc/find-a-job#/";
  const params = new URLSearchParams();
  if (jobPosting.cTitle) params.append("search", jobPosting.cTitle);
  if (jobPosting.Employer) params.append("employer", jobPosting.Employer);
  return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
}
