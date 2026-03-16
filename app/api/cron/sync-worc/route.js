import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchWORCJobs } from "@/lib/worc-client";
import { runMatchAlerts } from "@/lib/match-alerts";
import { runEmployerAutoMatch } from "@/lib/employer-match-alerts";

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    console.log("[WORC Sync] Starting sync...");
    const jobs = await fetchWORCJobs();
    console.log(`[WORC Sync] Fetched ${jobs.length} jobs from WORC API`);

    let count = 0;
    for (const job of jobs) {
      await sql`
        INSERT INTO job_postings (
          job_id, title, status, created_date, start_date, end_date,
          work_type, employer, education, experience, location,
          occupation_code, occupation_name, hours_per_week, currency,
          salary_description, min_salary, max_salary, mean_salary,
          industry, job_description, salary_long, number_of_positions,
          medical_check, police_check, driving_license, cover_letter_required,
          applicant_count, synced_at
        ) VALUES (
          ${job.job_id}, ${job.title}, ${job.status}, ${job.created_date},
          ${job.start_date}, ${job.end_date}, ${job.work_type}, ${job.employer},
          ${job.education}, ${job.experience}, ${job.location},
          ${job.occupation_code}, ${job.occupation_name}, ${job.hours_per_week},
          ${job.currency}, ${job.salary_description}, ${job.min_salary},
          ${job.max_salary}, ${job.mean_salary}, ${job.industry},
          ${job.job_description}, ${job.salary_long}, ${job.number_of_positions},
          ${job.medical_check}, ${job.police_check}, ${job.driving_license},
          ${job.cover_letter_required}, ${job.applicant_count}, NOW()
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
          job_description = EXCLUDED.job_description,
          salary_long = EXCLUDED.salary_long,
          number_of_positions = EXCLUDED.number_of_positions,
          medical_check = EXCLUDED.medical_check,
          police_check = EXCLUDED.police_check,
          driving_license = EXCLUDED.driving_license,
          cover_letter_required = EXCLUDED.cover_letter_required,
          applicant_count = EXCLUDED.applicant_count,
          synced_at = NOW()
      `;
      count++;
    }
    console.log(`[WORC Sync] Upserted ${count} jobs`);

    // Mark stale jobs (7-day window to account for WORC weekend/holiday gaps)
    const staleResult = await sql`
      UPDATE job_postings
      SET status = 'Closed'
      WHERE synced_at < NOW() - INTERVAL '7 days'
      AND status = 'Active'
      RETURNING job_id
    `;
    console.log(`[WORC Sync] Marked ${staleResult.length} stale jobs as closed`);

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
      console.log(`[WORC Sync] Processed ${alertsProcessed} match alerts`);
    } catch (alertErr) {
      console.error("[WORC Sync] Match alerts error (non-fatal):", alertErr.message);
    }

    // Run employer match alerts
    let employerAlertsProcessed = 0;
    try {
      employerAlertsProcessed = await runEmployerAutoMatch();
      console.log(`[WORC Sync] Processed ${employerAlertsProcessed} employer match alerts`);
    } catch (empAlertErr) {
      console.error("[WORC Sync] Employer match alerts error (non-fatal):", empAlertErr.message);
    }

    console.log(`[WORC Sync] Complete. Synced: ${count}, Stale: ${staleResult.length}, Alerts: ${alertsProcessed}, EmployerAlerts: ${employerAlertsProcessed}`);

    return NextResponse.json({
      success: true,
      synced: count,
      staleMarked: staleResult.length,
      alertsProcessed,
      employerAlertsProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[WORC Sync] Fatal error:", error.message);
    return NextResponse.json(
      { error: "Sync failed", message: error.message },
      { status: 500 }
    );
  }
}
