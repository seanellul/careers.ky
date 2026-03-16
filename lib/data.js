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
    WHERE status = 'Active'
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

// --- URL helper (stateless, no DB needed) ---

export function generateWORCSearchURL(jobPosting) {
  const baseURL = "https://my.egov.ky/web/myworc/find-a-job#/";
  const params = new URLSearchParams();
  if (jobPosting.cTitle) params.append("search", jobPosting.cTitle);
  if (jobPosting.Employer) params.append("employer", jobPosting.Employer);
  return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
}
