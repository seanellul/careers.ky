import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchWORCJobs } from "@/lib/worc-client";
import { runMatchAlerts } from "@/lib/match-alerts";

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    const jobs = await fetchWORCJobs();

    let count = 0;
    for (const job of jobs) {
      await sql`
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
      count++;
    }

    // Mark stale jobs
    await sql`
      UPDATE job_postings
      SET status = 'Closed'
      WHERE synced_at < NOW() - INTERVAL '2 days'
      AND status = 'Active'
    `;

    // Upsert new employers (safe — table may not exist pre-migration)
    try {
      await sql`
        INSERT INTO employers (slug, name)
        SELECT DISTINCT
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(employer), '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')),
          TRIM(employer)
        FROM job_postings
        WHERE employer IS NOT NULL AND TRIM(employer) != ''
        ON CONFLICT (slug) DO NOTHING
      `;
    } catch (e) {
      console.error("Employer upsert error (non-fatal):", e.message);
    }

    // Run match alerts for candidates
    let alertsProcessed = 0;
    try {
      alertsProcessed = await runMatchAlerts();
    } catch (alertErr) {
      console.error("Match alerts error (non-fatal):", alertErr.message);
    }

    return NextResponse.json({
      success: true,
      synced: count,
      alertsProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Sync failed", message: error.message },
      { status: 500 }
    );
  }
}
