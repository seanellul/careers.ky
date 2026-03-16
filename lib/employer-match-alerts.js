import { getDb } from "@/lib/db";
import { searchTalentRanked } from "@/lib/scoring";
import { createNotification } from "@/lib/data";

/**
 * Run employer auto-match alerts.
 * For each active employer alert, run ranked search with alert filters.
 * If new high-scoring candidates (>=60) found since last_sent_at, notify employer.
 */
export async function runEmployerAutoMatch() {
  const sql = getDb();

  const alerts = await sql`
    SELECT ma.*, ea.email as employer_email, ea.name as employer_name
    FROM match_alerts ma
    JOIN employer_accounts ea ON ma.employer_account_id = ea.id
    WHERE ma.employer_account_id IS NOT NULL
      AND ma.is_active = TRUE
      AND (
        ma.last_sent_at IS NULL
        OR (ma.frequency = 'daily' AND ma.last_sent_at < NOW() - INTERVAL '1 day')
        OR (ma.frequency = 'weekly' AND ma.last_sent_at < NOW() - INTERVAL '7 days')
      )
  `;

  let totalNotified = 0;

  for (const alert of alerts) {
    try {
      const filters = alert.filters || {};
      const result = await searchTalentRanked({
        ciscoCode: filters.ciscoCode || null,
        educationCode: filters.educationCode || null,
        experienceCode: filters.experienceCode || null,
        locationCode: filters.locationCode || null,
        availability: filters.availability || null,
        isCaymanian: filters.isCaymanian || false,
        page: 1,
        pageSize: 10,
      });

      // Filter for high scorers (>=60)
      const highScorers = result.candidates.filter(c => c.scores.total >= 60);

      // Filter out candidates seen before last_sent_at
      const newCandidates = alert.last_sent_at
        ? highScorers.filter(c => new Date(c.created_at) > new Date(alert.last_sent_at))
        : highScorers;

      if (newCandidates.length > 0) {
        await createNotification(
          "employer_account",
          alert.employer_account_id,
          `${newCandidates.length} new matching candidate${newCandidates.length > 1 ? "s" : ""}`,
          `Found ${newCandidates.length} high-quality match${newCandidates.length > 1 ? "es" : ""} based on your saved alert.`,
          "/talent"
        );

        // Try sending email digest
        try {
          const { Resend } = await import("resend");
          if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
              to: alert.employer_email,
              subject: `${newCandidates.length} new matching candidate${newCandidates.length > 1 ? "s" : ""} on careers.ky`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                  <h2 style="color: #0e0e0e;">New Matching Candidates</h2>
                  <p style="color: #555;">We found <strong>${newCandidates.length}</strong> new candidate${newCandidates.length > 1 ? "s" : ""} matching your saved search criteria.</p>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky"}/talent" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 24px 0;">
                    View Candidates
                  </a>
                </div>
              `,
            });
          }
        } catch (emailErr) {
          console.error("Employer alert email error (non-fatal):", emailErr);
        }

        totalNotified++;
      }

      // Update last_sent_at
      await sql`UPDATE match_alerts SET last_sent_at = NOW() WHERE id = ${alert.id}`;
    } catch (err) {
      console.error(`Error processing employer alert ${alert.id}:`, err);
    }
  }

  return totalNotified;
}
