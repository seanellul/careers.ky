import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();

  try {
    // 1. Get un-notified interests grouped by employer
    const interests = await sql`
      SELECT ji.id, ji.job_id, ji.employer_name, ji.job_title, ji.message, ji.created_at,
             c.name as candidate_name, c.email as candidate_email,
             c.is_caymanian, c.education_code, c.experience_code
      FROM job_interests ji
      JOIN candidates c ON ji.candidate_id = c.id
      WHERE ji.notified_at IS NULL
      ORDER BY ji.employer_name, ji.created_at DESC
    `;

    if (interests.length === 0) {
      console.log("[Interest Digest] No new interests to report.");
      return NextResponse.json({ success: true, sent: false, count: 0 });
    }

    // 2. Group by employer
    const byEmployer = {};
    for (const row of interests) {
      const key = row.employer_name || "Unknown Employer";
      if (!byEmployer[key]) byEmployer[key] = [];
      byEmployer[key].push(row);
    }

    const employerCount = Object.keys(byEmployer).length;

    // 3. Build email HTML
    const employerSections = Object.entries(byEmployer)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([employer, rows]) => {
        const candidateRows = rows.map(r => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.candidate_name || "Anonymous"}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.candidate_email}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.is_caymanian ? "<strong>Yes</strong>" : "No"}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.job_title || r.job_id}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.message || "--"}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
          </tr>
        `).join("");

        return `
          <div style="margin-bottom: 32px;">
            <h2 style="color: #0e0e0e; font-size: 18px; margin-bottom: 4px;">${employer}</h2>
            <p style="color: #888; font-size: 13px; margin-bottom: 12px;">${rows.length} candidate${rows.length > 1 ? "s" : ""} interested &middot; Employer NOT on platform</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f8f8f8;">
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Name</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Email</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Caymanian</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Position</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Message</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555;">Date</th>
                </tr>
              </thead>
              <tbody>${candidateRows}</tbody>
            </table>
          </div>
        `;
      }).join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <div style="border-bottom: 3px solid #06b6d4; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #0e0e0e; font-size: 24px; margin-bottom: 4px;">New Interest Digest</h1>
          <p style="color: #555; font-size: 14px;">
            ${interests.length} new expression${interests.length > 1 ? "s" : ""} of interest across ${employerCount} employer${employerCount > 1 ? "s" : ""} not yet on the platform.
          </p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <strong style="color: #166534;">Outreach opportunity:</strong>
          <span style="color: #15803d;"> These employers have real candidate demand. Reach out with: &ldquo;X candidates are interested in your positions on Careers.ky &mdash; claim your profile to connect with them.&rdquo;</span>
        </div>

        ${employerSections}

        <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #999; text-align: center;">
          Generated by careers.ky on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>
    `;

    // 4. Send email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error("[Interest Digest] ADMIN_EMAIL not set, skipping send.");
      return NextResponse.json({ success: false, error: "ADMIN_EMAIL not configured" }, { status: 500 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
      to: adminEmail,
      subject: `[Careers.ky] ${interests.length} new interest${interests.length > 1 ? "s" : ""} — ${employerCount} employer${employerCount > 1 ? "s" : ""} to reach out to`,
      html,
    });

    // 5. Mark as notified
    const ids = interests.map(i => i.id);
    await sql`UPDATE job_interests SET notified_at = NOW() WHERE id = ANY(${ids})`;

    console.log(`[Interest Digest] Sent digest: ${interests.length} interests across ${employerCount} employers.`);

    return NextResponse.json({
      success: true,
      sent: true,
      interestCount: interests.length,
      employerCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Interest Digest] Error:", error.message);
    return NextResponse.json({ error: "Digest failed", message: error.message }, { status: 500 });
  }
}
