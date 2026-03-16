import { getDb } from "@/lib/db";

/**
 * Run match alerts after WORC sync.
 * For each active alert, find new jobs posted in the last 24h that match the candidate's profile.
 * Create in-app notifications for matches.
 * Send email digests for candidates with daily frequency.
 */
export async function runMatchAlerts() {
  const sql = getDb();

  // Get all active alerts with candidate data
  const alerts = await sql`
    SELECT ma.*, c.email, c.name, c.education_code, c.experience_code, c.location_code
    FROM match_alerts ma
    JOIN candidates c ON ma.candidate_id = c.id
    WHERE ma.is_active = TRUE
      AND ma.candidate_id IS NOT NULL
      AND (ma.last_sent_at IS NULL OR ma.last_sent_at < NOW() - INTERVAL '1 day')
  `;

  let processed = 0;

  for (const alert of alerts) {
    const filters = alert.filters || {};

    // Get candidate's CISCO interests
    const interests = await sql`
      SELECT cisco_code FROM candidate_interests WHERE candidate_id = ${alert.candidate_id}
    `;
    const ciscoCodes = interests.map(i => i.cisco_code);

    // Find new active jobs from last 24h matching the candidate's profile
    let matchingJobs;
    if (ciscoCodes.length > 0) {
      matchingJobs = await sql`
        SELECT jp.job_id, jp.title, jp.employer, jp.location, jp.mean_salary
        FROM job_postings jp
        INNER JOIN occupation_cisco oc ON jp.occupation_code = oc.occupation_code
        WHERE jp.status = 'Active'
          AND jp.synced_at > NOW() - INTERVAL '1 day'
          AND oc.cisco_code = ANY(${ciscoCodes})
          AND (${alert.location_code}::text IS NULL OR jp.location = ${alert.location_code})
          AND (${alert.education_code}::text IS NULL OR jp.education = ${alert.education_code})
        LIMIT 20
      `;
    } else {
      // No CISCO interests — match on location/education only if set
      matchingJobs = await sql`
        SELECT jp.job_id, jp.title, jp.employer, jp.location, jp.mean_salary
        FROM job_postings jp
        WHERE jp.status = 'Active'
          AND jp.synced_at > NOW() - INTERVAL '1 day'
          AND (${alert.location_code}::text IS NULL OR jp.location = ${alert.location_code})
          AND (${alert.education_code}::text IS NULL OR jp.education = ${alert.education_code})
        LIMIT 20
      `;
    }

    if (matchingJobs.length > 0) {
      // Create in-app notification
      const jobTitles = matchingJobs.slice(0, 3).map(j => j.title).join(", ");
      const moreCount = matchingJobs.length > 3 ? ` and ${matchingJobs.length - 3} more` : "";

      await sql`
        INSERT INTO notifications (recipient_type, recipient_id, title, body, link)
        VALUES (
          'candidate',
          ${alert.candidate_id},
          ${`${matchingJobs.length} new job${matchingJobs.length !== 1 ? "s" : ""} match your profile`},
          ${`${jobTitles}${moreCount}`},
          '/jobs'
        )
      `;

      // Send email digest if Resend is configured
      if (process.env.RESEND_API_KEY && alert.email) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";

          const jobList = matchingJobs.map(j =>
            `<li style="margin-bottom:8px;"><strong>${j.title}</strong> at ${j.employer || "Undisclosed"}${j.mean_salary ? ` — CI$ ${Math.round(j.mean_salary).toLocaleString()}` : ""}</li>`
          ).join("");

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
            to: alert.email,
            subject: `${matchingJobs.length} new job${matchingJobs.length !== 1 ? "s" : ""} match your profile — careers.ky`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <h2 style="color: #0e0e0e; margin-bottom: 8px;">New Job Matches</h2>
                <p style="color: #555; margin-bottom: 16px;">Hi ${alert.name || "there"}, we found ${matchingJobs.length} new job${matchingJobs.length !== 1 ? "s" : ""} matching your profile:</p>
                <ul style="color: #333; line-height: 1.8; padding-left: 20px;">${jobList}</ul>
                <a href="${baseUrl}/jobs" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 24px 0;">
                  View All Matches
                </a>
                <p style="color: #888; font-size: 13px; margin-top: 24px;">You're receiving this because you set up job alerts on careers.ky. <a href="${baseUrl}/profile" style="color: #06b6d4;">Manage preferences</a></p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error(`Failed to send alert email to ${alert.email}:`, emailErr.message);
        }
      }

      // Update last_sent_at
      await sql`UPDATE match_alerts SET last_sent_at = NOW() WHERE id = ${alert.id}`;
      processed++;
    }
  }

  return processed;
}
