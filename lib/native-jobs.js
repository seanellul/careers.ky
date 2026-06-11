import crypto from "crypto";
import { Resend } from "resend";
import { getDb } from "@/lib/db";
import { createNotification } from "@/lib/data";

// Native postings: created by employers on-platform (vs WORC-synced feed).
// Spec 9.3a / MVP #15-16: enforced fields; postings cannot go live without them.

export const DISTRICTS = [
  "George Town",
  "West Bay",
  "Seven Mile Beach",
  "Camana Bay",
  "Bodden Town",
  "North Side",
  "East End",
  "Cayman Brac",
  "Little Cayman",
  "Remote",
];

export const SENIORITY_LEVELS = ["entry", "junior", "mid", "senior", "director", "executive"];

export const EARLY_ACCESS_HOURS = 24;
const DEFAULT_DURATION_DAYS = 30;
const MAX_EARLY_ACCESS_NOTIFICATIONS = 200;

export function validateNativePosting(body) {
  const errors = [];
  if (!body.title?.trim()) errors.push("Job title is required");
  if (!body.description?.trim() || body.description.trim().length < 100)
    errors.push("Job description is required (at least 100 characters)");
  const minSalary = Number(body.minSalary);
  const maxSalary = Number(body.maxSalary);
  if (!minSalary || minSalary <= 0) errors.push("Minimum salary is required");
  if (!maxSalary || maxSalary < minSalary) errors.push("Maximum salary must be >= minimum");
  if (!DISTRICTS.includes(body.district)) errors.push("District is required");
  if (!body.industry?.trim()) errors.push("Industry is required");
  if (!SENIORITY_LEVELS.includes(body.seniority)) errors.push("Seniority level is required");
  const quals = Array.isArray(body.qualifications)
    ? body.qualifications.map((q) => String(q).trim()).filter(Boolean)
    : [];
  if (quals.length < 3) errors.push("At least 3 required qualifications");
  return { errors, qualifications: quals, minSalary, maxSalary };
}

export async function createNativeJobPosting(session, body, validated) {
  const sql = getDb();

  const employerRows = await sql`
    SELECT e.id, e.name FROM employers e WHERE e.id = ${session.employerId}
  `;
  if (!employerRows.length) return { error: "No employer profile linked to this account" };
  const employer = employerRows[0];

  const jobId = `native-${crypto.randomBytes(6).toString("hex")}`;
  const durationDays = Math.min(Number(body.durationDays) || DEFAULT_DURATION_DAYS, 90);

  const rows = await sql`
    INSERT INTO job_postings (
      job_id, source, title, status, created_date, start_date, end_date,
      employer, employer_id, posted_by_account_id,
      district, seniority, required_qualifications, cisco_code,
      industry, job_description, work_type,
      currency, min_salary, max_salary, mean_salary,
      number_of_positions, public_at, synced_at
    ) VALUES (
      ${jobId}, 'native', ${body.title.trim()}, 'Active', NOW(),
      ${body.startDate || null}, NOW() + (${durationDays} || ' days')::interval,
      ${employer.name}, ${employer.id}, ${session.employerAccountId},
      ${body.district}, ${body.seniority}, ${JSON.stringify(validated.qualifications)},
      ${body.ciscoCode || null},
      ${body.industry.trim()}, ${body.description.trim()}, ${body.workType || "1"},
      ${body.currency || "KYD"}, ${validated.minSalary}, ${validated.maxSalary},
      ${(validated.minSalary + validated.maxSalary) / 2},
      ${Number(body.numberOfPositions) || 1},
      NOW() + (${EARLY_ACCESS_HOURS} || ' hours')::interval, NOW()
    )
    RETURNING job_id, title, public_at, end_date
  `;
  return { posting: rows[0] };
}

// Caymanian 24h early access (spec 10.8): notify matching Caymanian
// candidates immediately; the posting stays off public lists until public_at.
export async function notifyEarlyAccessCandidates(jobId, title, employerName, ciscoCode) {
  if (!ciscoCode) return 0;
  const sql = getDb();

  // Early access is an alert, not a search exposure — closed/alert-only
  // profiles are deliberately included.
  const matching = await sql`
    SELECT DISTINCT c.id, c.email
    FROM candidates c
    JOIN candidate_interests ci ON ci.candidate_id = c.id
    WHERE c.status = 'caymanian' AND ci.cisco_code = ${ciscoCode}
    LIMIT ${MAX_EARLY_ACCESS_NOTIFICATIONS}
  `;

  let notified = 0;
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";

  for (const candidate of matching) {
    try {
      await createNotification(
        "candidate",
        candidate.id,
        "Early access: new role for you",
        `${employerName} posted "${title}". As a Caymanian candidate you can see it 24 hours before it goes public.`,
        `/jobs/${jobId}`
      );
      if (resend && candidate.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
          to: candidate.email,
          subject: `Early access: ${title} at ${employerName} — careers.ky`,
          html: `<p>${employerName} just posted <strong>${title}</strong>.</p><p>As a Caymanian candidate you have 24-hour early access before this role goes public.</p><p><a href="${baseUrl}/jobs/${jobId}">View the role</a></p>`,
        });
      }
      notified++;
    } catch (err) {
      console.error("Early access notification error (non-fatal):", err.message);
    }
  }
  return notified;
}

export async function getEmployerNativePostings(employerId) {
  const sql = getDb();
  return sql`
    SELECT job_id, title, status, created_date, end_date, public_at,
           district, seniority, min_salary, max_salary, applicant_count,
           (SELECT COUNT(*) FROM introductions i WHERE i.job_id = job_postings.job_id) as interest_count
    FROM job_postings
    WHERE source = 'native' AND employer_id = ${employerId}
    ORDER BY created_date DESC
  `;
}

export async function closeNativePosting(jobId, employerId) {
  const sql = getDb();
  const rows = await sql`
    UPDATE job_postings SET status = 'Closed'
    WHERE job_id = ${jobId} AND source = 'native' AND employer_id = ${employerId}
    RETURNING job_id
  `;
  return rows[0] || null;
}
