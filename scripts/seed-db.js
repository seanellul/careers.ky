import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "_src_old", "data");

// Simple CSV parser (matches the one in lib/csv.js)
function parseCSV(text) {
  if (!text || typeof text !== "string") return { headers: [], rows: [] };
  const rows = [];
  const headers = [];
  let i = 0;
  const len = text.length;
  let cell = "";
  let row = [];
  let inQuotes = false;

  const pushCell = () => { row.push(cell); cell = ""; };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") { row = []; return; }
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { pushCell(); }
      else if (ch === '\n') { pushCell(); pushRow(); }
      else if (ch === '\r') { pushCell(); pushRow(); if (text[i] === '\n') i++; }
      else { cell += ch; }
    }
  }
  pushCell();
  if (row.length) pushRow();

  if (!rows.length) return { headers: [], rows: [] };
  const headerRow = rows[0];
  for (let h of headerRow) headers.push(String(h || '').trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const record = {};
    const cur = rows[r];
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = String(cur[c] ?? "").trim();
    }
    out.push(record);
  }
  return { headers, rows: out };
}

function readCSV(relativePath) {
  // Strip BOM
  const raw = readFileSync(join(dataDir, relativePath), "utf-8").replace(/^\uFEFF/, "");
  return parseCSV(raw);
}

function parseDateDMY(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (match) {
    const [_, day, monthStr, year] = match;
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const month = monthMap[monthStr.toLowerCase()];
    if (month === undefined) return null;
    return new Date(2000 + parseInt(year), month, parseInt(day));
  }
  return null;
}

function parseSalary(s) {
  if (!s) return null;
  const cleaned = String(s).replace(/[$,]/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Provide it via .env.local or environment.");
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log("Seeding CISCO units...");
  const cisco = readCSV("keys/CISCO.csv");
  for (const r of cisco.rows) {
    await sql`
      INSERT INTO cisco_units (cisco_code, title, description, tasks)
      VALUES (${String(r.sCISCO)}, ${r.cTitle || null}, ${r.cDescription || null}, ${r.cTasks || null})
      ON CONFLICT (cisco_code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, tasks = EXCLUDED.tasks
    `;
  }
  console.log(`  ${cisco.rows.length} CISCO units`);

  console.log("Seeding occupation-CISCO mappings...");
  const occCisco = readCSV("keys/OccupationCISCO.csv");
  for (const r of occCisco.rows) {
    await sql`
      INSERT INTO occupation_cisco (occupation_code, cisco_code)
      VALUES (${String(r.sOccupation)}, ${String(r.sCISCO)})
      ON CONFLICT (occupation_code) DO UPDATE SET cisco_code = EXCLUDED.cisco_code
    `;
  }
  console.log(`  ${occCisco.rows.length} mappings`);

  console.log("Seeding job titles...");
  const titles = readCSV("keys/JobTitles.csv");
  // Truncate first to avoid duplicates on re-seed
  await sql`TRUNCATE job_titles RESTART IDENTITY`;
  for (const r of titles.rows) {
    await sql`
      INSERT INTO job_titles (occupation_code, title)
      VALUES (${String(r.sOccupation)}, ${r.cJobTitle || ""})
    `;
  }
  console.log(`  ${titles.rows.length} titles`);

  console.log("Seeding work types...");
  const wt = readCSV("keys/WorkTypes.csv");
  for (const r of wt.rows) {
    await sql`INSERT INTO work_types (code, description) VALUES (${String(r.sWork)}, ${r.cDescription}) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`;
  }

  console.log("Seeding education types...");
  const et = readCSV("keys/EducationTypes.csv");
  for (const r of et.rows) {
    await sql`INSERT INTO education_types (code, description) VALUES (${String(r.sEducation)}, ${r.cDescription}) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`;
  }

  console.log("Seeding experience types...");
  const ext = readCSV("keys/ExperienceTypes.csv");
  for (const r of ext.rows) {
    await sql`INSERT INTO experience_types (code, description) VALUES (${String(r.sExperience)}, ${r.cDescription}) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`;
  }

  console.log("Seeding location types...");
  const lt = readCSV("keys/LocationTypes.csv");
  for (const r of lt.rows) {
    await sql`INSERT INTO location_types (code, description) VALUES (${String(r.sLocation)}, ${r.cDescription}) ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`;
  }

  console.log("Seeding job postings...");
  const postings = readCSV("content/job_postings_detailed.csv");
  let count = 0;
  for (const r of postings.rows) {
    const createdDate = parseDateDMY(r["Created Date"]);
    const startDate = parseDateDMY(r["Start Date"]);
    const endDate = parseDateDMY(r["End Date"]);
    const minSal = parseSalary(r.fMinSalary);
    const maxSal = parseSalary(r.fMaxSalary);
    const meanSal = parseSalary(r.fMeanSalary);

    await sql`
      INSERT INTO job_postings (
        job_id, title, status, created_date, start_date, end_date,
        work_type, employer, education, experience, location,
        occupation_code, occupation_name, hours_per_week, currency,
        salary_description, min_salary, max_salary, mean_salary, industry
      ) VALUES (
        ${r.cJobId}, ${r.cTitle}, ${r.Status || null}, ${createdDate}, ${startDate}, ${endDate},
        ${r.sWork || null}, ${r.Employer || null}, ${r.sEducation || null}, ${r.sExperience || null}, ${r.sLocation || null},
        ${String(r.sOccupation || "0")}, ${r.Occupation || null}, ${r["Hours Per Week"] ? parseFloat(r["Hours Per Week"]) : null},
        ${r.Currency || "KYD"}, ${r["Salary Description"] || null}, ${minSal}, ${maxSal}, ${meanSal}, ${r.sIndustry || null}
      )
      ON CONFLICT (job_id) DO UPDATE SET
        title = EXCLUDED.title, status = EXCLUDED.status, employer = EXCLUDED.employer,
        min_salary = EXCLUDED.min_salary, max_salary = EXCLUDED.max_salary, mean_salary = EXCLUDED.mean_salary
    `;
    count++;
    if (count % 1000 === 0) console.log(`  ${count} postings...`);
  }
  console.log(`  ${count} total postings seeded`);

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
