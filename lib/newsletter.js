import { Resend } from "resend";
import { getDb } from "@/lib/db";

// The Careers.ky Briefing (spec 8.9): top roles of the week, Mondays.
// Runs inside the daily digest cron (plan cron limits) — only sends on
// Mondays UTC, and never twice in the same week (last_sent_at guard).
export async function runWeeklyBriefing() {
  if (new Date().getUTCDay() !== 1) return { sent: 0, skipped: "not_monday" };
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: "no_resend" };

  const sql = getDb();
  const subscribers = await sql`
    SELECT id, email, unsubscribe_token FROM newsletter_subscribers
    WHERE unsubscribed_at IS NULL
      AND (last_sent_at IS NULL OR last_sent_at < NOW() - INTERVAL '6 days')
    LIMIT 1000
  `;
  if (!subscribers.length) return { sent: 0, skipped: "no_subscribers" };

  const jobs = await sql`
    SELECT job_id, title, employer, mean_salary, source
    FROM job_postings
    WHERE status = 'Active' AND end_date > NOW()
      AND (public_at IS NULL OR public_at <= NOW())
    ORDER BY (source = 'native') DESC, created_date DESC
    LIMIT 10
  `;
  if (!jobs.length) return { sent: 0, skipped: "no_jobs" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const jobRows = jobs
    .map(
      (j) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <a href="${baseUrl}/jobs/${j.job_id}" style="color: #0d9488; text-decoration: none; font-weight: 600;">${j.title}</a>
          <div style="font-size: 13px; color: #666;">${j.employer || ""}${
            j.mean_salary ? ` — ~KYD ${Math.round(Number(j.mean_salary)).toLocaleString()}` : ""
          }${j.source === "native" ? " · direct apply" : ""}</div>
        </td>
      </tr>`
    )
    .join("");

  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;

  for (const sub of subscribers) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
        to: sub.email,
        subject: "The Careers.ky Briefing — this week's top Cayman roles",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #111;">The Careers.ky Briefing</h2>
            <p style="color: #555;">This week's top roles across the Cayman Islands:</p>
            <table style="width: 100%; border-collapse: collapse;">${jobRows}</table>
            <p style="margin-top: 24px;">
              <a href="${baseUrl}/careers" style="color: #0d9488;">Browse all roles →</a>
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 32px;">
              You're receiving this because you subscribed at careers.ky.
              <a href="${baseUrl}/api/newsletter?unsubscribe=${sub.unsubscribe_token}" style="color: #999;">Unsubscribe</a>
            </p>
          </div>`,
      });
      await sql`UPDATE newsletter_subscribers SET last_sent_at = NOW() WHERE id = ${sub.id}`;
      sent++;
    } catch (err) {
      console.error(`[Briefing] Send failed for subscriber ${sub.id}:`, err.message);
    }
  }
  console.log(`[Briefing] Sent to ${sent}/${subscribers.length} subscribers.`);
  return { sent };
}
