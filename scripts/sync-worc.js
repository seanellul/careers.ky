import { neon } from "@neondatabase/serverless";
import { fetchWORCJobs } from "../lib/worc-client.js";

async function sync() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("Fetching jobs from WORC...");

  const jobs = await fetchWORCJobs();
  console.log(`Fetched ${jobs.length} jobs from WORC`);

  let inserted = 0;
  let updated = 0;

  for (const job of jobs) {
    const result = await sql`
      INSERT INTO job_postings (
        job_id, title, status, created_date, start_date, end_date,
        work_type, employer, education, experience, location,
        occupation_code, occupation_name, hours_per_week, currency,
        salary_description, min_salary, max_salary, mean_salary,
        industry, synced_at
      ) VALUES (
        ${job.job_id}, ${job.title}, ${job.status}, ${job.created_date},
        ${job.start_date}, ${job.end_date}, ${job.work_type}, ${job.employer},
        ${job.education}, ${job.experience}, ${job.location},
        ${job.occupation_code}, ${job.occupation_name}, ${job.hours_per_week},
        ${job.currency}, ${job.salary_description}, ${job.min_salary},
        ${job.max_salary}, ${job.mean_salary}, ${job.industry}, NOW()
      )
      ON CONFLICT (job_id) DO UPDATE SET
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        work_type = EXCLUDED.work_type,
        employer = EXCLUDED.employer,
        education = EXCLUDED.education,
        experience = EXCLUDED.experience,
        location = EXCLUDED.location,
        occupation_code = EXCLUDED.occupation_code,
        occupation_name = EXCLUDED.occupation_name,
        hours_per_week = EXCLUDED.hours_per_week,
        currency = EXCLUDED.currency,
        salary_description = EXCLUDED.salary_description,
        min_salary = EXCLUDED.min_salary,
        max_salary = EXCLUDED.max_salary,
        mean_salary = EXCLUDED.mean_salary,
        industry = EXCLUDED.industry,
        synced_at = NOW()
    `;
    // neon returns the rows affected context indirectly; count all as upserted
    updated++;
  }

  console.log(`Sync complete: ${jobs.length} jobs upserted`);

  // Mark stale jobs as closed
  const staleResult = await sql`
    UPDATE job_postings
    SET status = 'Closed'
    WHERE synced_at < NOW() - INTERVAL '2 days'
    AND status = 'Active'
  `;
  console.log("Stale jobs marked as closed");
}

sync().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
