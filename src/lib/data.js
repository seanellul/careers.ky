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
import WORK_TYPES_RAW from "@/data/keys/WorkTypes.csv?raw";
// eslint-disable-next-line
import EDUCATION_TYPES_RAW from "@/data/keys/EducationTypes.csv?raw";
// eslint-disable-next-line
import EXPERIENCE_TYPES_RAW from "@/data/keys/ExperienceTypes.csv?raw";

let cache = {
  cisco: null,
  occCisco: null,
  jobTitles: null,
  jobData: null,
  jobAgg: null,
  workTypes: null,
  eduTypes: null,
  expTypes: null,
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


