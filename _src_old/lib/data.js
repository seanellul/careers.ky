import { parseCSV, groupBy } from "@/lib/csv";

// Loaders read CSV files via Vite's raw import. Keep synchronous to simplify UI.
// Consumers can call these inside effects once at app start.

// Vite's ?raw lets us import CSV strings at build time
// eslint-disable-next-line
import CISCO_RAW from "@/data/keys/CISCO.csv?raw";
// eslint-disable-next-line
import OCCUPATION_CISCO_RAW from "@/data/keys/OccupationCISCO.csv?raw";
// eslint-disable-next-line
import JOB_TITLES_RAW from "@/data/keys/JobTitles.csv?raw";
// eslint-disable-next-line
import JOB_DATA_RAW from "@/data/content/JobData.csv?raw";
// eslint-disable-next-line
import JOB_POSTINGS_DETAILED_RAW from "@/data/content/job_postings_detailed.csv?raw";
// eslint-disable-next-line
import WORK_TYPES_RAW from "@/data/keys/WorkTypes.csv?raw";
// eslint-disable-next-line
import EDUCATION_TYPES_RAW from "@/data/keys/EducationTypes.csv?raw";
// eslint-disable-next-line
import EXPERIENCE_TYPES_RAW from "@/data/keys/ExperienceTypes.csv?raw";
// eslint-disable-next-line
import LOCATION_TYPES_RAW from "@/data/keys/LocationTypes.csv?raw";

let cache = {
  cisco: null,
  occCisco: null,
  jobTitles: null,
  jobData: null,
  jobAgg: null,
  workTypes: null,
  eduTypes: null,
  expTypes: null,
  locationTypes: null,
  jobPostingsDetailed: null,
};

// Clear cache function for development
export function clearCache() {
  cache = {
    cisco: null,
    occCisco: null,
    jobTitles: null,
    jobData: null,
    jobAgg: null,
    workTypes: null,
    eduTypes: null,
    expTypes: null,
    locationTypes: null,
    jobPostingsDetailed: null,
  };
}

export function loadCISCO() {
  if (cache.cisco) return cache.cisco;
  const { rows } = parseCSV(CISCO_RAW);
  // Normalize numeric code to string key for stability
  for (const r of rows) {
    r.sCISCO = String(r.sCISCO);
  }
  cache.cisco = rows;
  return cache.cisco;
}

export function loadOccupationCisco() {
  if (cache.occCisco) return cache.occCisco;
  const { rows } = parseCSV(OCCUPATION_CISCO_RAW);
  for (const r of rows) {
    r.sOccupation = String(r.sOccupation);
    r.sCISCO = String(r.sCISCO);
  }
  cache.occCisco = rows;
  return cache.occCisco;
}

export function loadJobTitles() {
  if (cache.jobTitles) return cache.jobTitles;
  const { rows } = parseCSV(JOB_TITLES_RAW);
  for (const r of rows) {
    r.sOccupation = String(r.sOccupation);
    // Map cJobTitle to cTitle for consistency
    r.cTitle = r.cJobTitle;
  }
  cache.jobTitles = rows;
  return cache.jobTitles;
}

export function loadJobData() {
  if (cache.jobData) return cache.jobData;
  const { rows } = parseCSV(JOB_DATA_RAW);
  // Cast numbers where appropriate
  for (const r of rows) {
    r.fMinSalary = Number(r.fMinSalary || 0);
    r.fMaxSalary = Number(r.fMaxSalary || 0);
    r.fMeanSalary = Number(r.fMeanSalary || 0);
    r.sOccupation = String(r.sOccupation);
  }
  cache.jobData = rows;
  return cache.jobData;
}

export function loadJobPostingsDetailed() {
  if (cache.jobPostingsDetailed) return cache.jobPostingsDetailed;
  const { rows } = parseCSV(JOB_POSTINGS_DETAILED_RAW);
  
  // Helper to parse dates in "DD-MMM-YY" format (e.g., "01-Jan-25")
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    // Match DD-MMM-YY format
    const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
    if (match) {
      const [_, day, monthStr, year] = match;
      const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      const month = monthMap[monthStr.toLowerCase()];
      const fullYear = 2000 + parseInt(year, 10); // Assuming 20xx
      return new Date(fullYear, month, parseInt(day, 10));
    }
    return new Date(dateStr);
  };
  
  // Helper function to parse salary strings like "$24,700" to numbers
  const parseSalary = (salaryStr) => {
    if (!salaryStr) return 0;
    const cleaned = String(salaryStr).replace(/[$,]/g, '');
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Cast numbers and dates where appropriate
  for (const r of rows) {
    r.fMinSalary = parseSalary(r.fMinSalary);
    r.fMaxSalary = parseSalary(r.fMaxSalary);
    r.fMeanSalary = parseSalary(r.fMeanSalary);
    r.sOccupation = String(r.sOccupation);
    r.sWork = String(r.sWork || 0);
    r.sEducation = String(r.sEducation || 0);
    r.sExperience = String(r.sExperience || 0);
    r.sLocation = String(r.sLocation || 0);
    
    // Parse dates
    r.createdDate = parseDate(r["Created Date"]);
    r.startDate = parseDate(r["Start Date"]);
    r.endDate = parseDate(r["End Date"]);
    
    // Check if job is active (has future end date)
    const now = new Date();
    r.isActive = r.Status?.toLowerCase() === 'active' && r.endDate > now;
  }
  cache.jobPostingsDetailed = rows;
  return cache.jobPostingsDetailed;
}

// Aggregations — by sOccupation
export function loadAggregates() {
  if (cache.jobAgg) return cache.jobAgg;
  const data = loadJobData();
  const occCisco = loadOccupationCisco();
  const occToCisco = new Map(occCisco.map((r) => [String(r.sOccupation), String(r.sCISCO)]));

  // Re-key job rows by sCISCO via mapping
  const byCisco = new Map();
  for (const r of data) {
    const cisco = occToCisco.get(String(r.sOccupation));
    const key = cisco ? String(cisco) : "unknown";
    if (!byCisco.has(key)) byCisco.set(key, []);
    byCisco.get(key).push(r);
  }
  const out = new Map();
  for (const [cisco, list] of byCisco.entries()) {
    const count = list.length;
    const min = Math.min(...list.map((x) => x.fMinSalary || 0));
    const max = Math.max(...list.map((x) => x.fMaxSalary || 0));
    const mean = list.reduce((a, b) => a + (b.fMeanSalary || 0), 0) / Math.max(1, count);
    // Distributions
    const work = {};
    const edu = {};
    const exp = {};
    for (const x of list) {
      const w = String(x.sWork || 0);
      const e = String(x.sEducation || 0);
      const ex = String(x.sExperience || 0);
      work[w] = (work[w] || 0) + 1;
      edu[e] = (edu[e] || 0) + 1;
      exp[ex] = (exp[ex] || 0) + 1;
    }
    out.set(cisco, { count, min, max, mean, dist: { work, edu, exp } });
  }
  cache.jobAgg = out;
  return cache.jobAgg;
}

// Helper to walk CISCO taxonomy depth: Major → Sub-major → Minor → Unit
export function buildCiscoTree() {
  const cisco = loadCISCO();
  // Each entry has sCISCO (code), cTitle, cDescription, cTasks
  // Use first digit groups: 1xxx → major (1), 11xx → sub-major (11), 111x → minor (111), 1111 → unit
  const nodes = new Map();
  const root = { id: "root", title: "Occupations", children: [] };
  const ensure = (id, title) => {
    if (!nodes.has(id)) nodes.set(id, { id, title, children: [] });
    return nodes.get(id);
  };
  for (const r of cisco) {
    const code = r.sCISCO;
    if (!/^[0-9]+$/.test(code) || code.length < 4) continue;
    
    const major = code.slice(0, 1);
    const subMajor = code.slice(0, 2);
    const minor = code.slice(0, 3);
    const unit = code;

    // Ensure we don't create circular references
    if (major === subMajor || subMajor === minor || minor === unit) continue;

    const majorN = ensure(major, findTitle(cisco, major));
    if (!root.children.includes(majorN)) root.children.push(majorN);
    
    const subN = ensure(subMajor, findTitle(cisco, subMajor));
    if (!majorN.children.includes(subN)) majorN.children.push(subN);
    
    const minorN = ensure(minor, findTitle(cisco, minor));
    if (!subN.children.includes(minorN)) subN.children.push(minorN);
    
    const unitN = ensure(unit, r.cTitle || unit);
    unitN.description = r.cDescription || "";
    unitN.tasks = r.cTasks || "";
    if (!minorN.children.includes(unitN)) minorN.children.push(unitN);
  }
  return root;
}

function findTitle(ciscoRows, code) {
  const pad = (id) => {
    if (id.length === 1) return id + "000"; // major → 1000
    if (id.length === 2) return id + "00";  // sub-major → 1100
    if (id.length === 3) return id + "0";   // minor → 1110
    return id;                                // unit → 1111
  };
  const row = ciscoRows.find((r) => String(r.sCISCO) === pad(String(code)));
  return row?.cTitle || code;
}

export function searchTitles(q, limit = 20) {
  const titles = loadJobTitles();
  const ql = String(q || "").toLowerCase();
  if (!ql) return [];
  const out = [];
  for (const r of titles) {
    if (r.cTitle?.toLowerCase().includes(ql)) {
      out.push(r);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function getCiscoUnit(code) {
  const rows = loadCISCO();
  const id = String(code);
  const row = rows.find((r) => String(r.sCISCO) === id);
  if (!row) return null;
  return { id, title: row.cTitle, description: row.cDescription, tasks: row.cTasks };
}

export function titleSuggestions(q, limit = 20) {
  const list = searchTitles(q, limit * 2); // overfetch for filtering
  if (!list.length) return [];
  const occCisco = loadOccupationCisco();
  const occToCisco = new Map(occCisco.map((r) => [String(r.sOccupation), String(r.sCISCO)]));
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const sOcc = String(r.sOccupation);
    const code = occToCisco.get(sOcc);
    if (!code) continue;
    const key = `${r.cTitle}|${code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: r.cTitle, sOccupation: sOcc, sCISCO: code, ciscoUnit: getCiscoUnit(code) });
    if (out.length >= limit) break;
  }
  return out;
}

// Key label loaders
export function loadWorkTypes() {
  if (cache.workTypes) return cache.workTypes;
  const { rows } = parseCSV(WORK_TYPES_RAW);
  const map = new Map(rows.map((r) => [String(r.sWork), r.cDescription]));
  cache.workTypes = map;
  return cache.workTypes;
}

export function loadEducationTypes() {
  if (cache.eduTypes) return cache.eduTypes;
  const { rows } = parseCSV(EDUCATION_TYPES_RAW);
  const map = new Map(rows.map((r) => [String(r.sEducation), r.cDescription]));
  cache.eduTypes = map;
  return cache.eduTypes;
}

export function loadExperienceTypes() {
  if (cache.expTypes) return cache.expTypes;
  const { rows } = parseCSV(EXPERIENCE_TYPES_RAW);
  const map = new Map(rows.map((r) => [String(r.sExperience), r.cDescription]));
  cache.expTypes = map;
  return cache.expTypes;
}

export function loadLocationTypes() {
  if (cache.locationTypes) return cache.locationTypes;
  const { rows } = parseCSV(LOCATION_TYPES_RAW);
  const map = new Map(rows.map((r) => [String(r.sLocation), r.cDescription]));
  cache.locationTypes = map;
  return cache.locationTypes;
}

// Get job postings by CISCO code
export function getJobPostingsByCiscoCode(ciscoCode) {
  const postings = loadJobPostingsDetailed();
  const occCisco = loadOccupationCisco();
  const occToCisco = new Map(occCisco.map((r) => [String(r.sOccupation), String(r.sCISCO)]));
  
  // Find all occupations that map to this CISCO code
  const matchingOccupations = Array.from(occToCisco.entries())
    .filter(([occ, cisco]) => cisco === String(ciscoCode))
    .map(([occ]) => occ);
  
  // Return postings for matching occupations
  return postings.filter(posting => matchingOccupations.includes(String(posting.sOccupation)));
}

// Generate WORC search URL for a job posting
export function generateWORCSearchURL(jobPosting) {
  const baseURL = "https://my.egov.ky/web/myworc/find-a-job#/";
  const params = new URLSearchParams();
  
  // Add job title to search parameter
  if (jobPosting.cTitle) {
    params.append('search', jobPosting.cTitle);
  }
  
  // Add employer to employer parameter
  if (jobPosting.Employer) {
    params.append('employer', jobPosting.Employer);
  }
  
  // Return URL with properly encoded parameters
  return params.toString() ? `${baseURL}?${params.toString()}` : baseURL;
}

// Get active job postings (future end date)
export function getActiveJobPostings() {
  const postings = loadJobPostingsDetailed();
  const now = new Date();
  return postings.filter(p => p.isActive || (p.Status?.toLowerCase() === 'active' && p.endDate > now));
}


