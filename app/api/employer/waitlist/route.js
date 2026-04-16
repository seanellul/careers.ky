import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Admin: list all waitlist entries
export async function GET(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sql = getDb();
  const entries = await sql`
    SELECT * FROM employer_waitlist ORDER BY joined_at DESC
  `;
  return NextResponse.json({ entries });
}

// Public: join waitlist
export async function POST(request) {
  const ip = getClientIp(request);
  const check = rateLimit(`waitlist:ip:${ip}`, 3, 10 * 60 * 1000);
  if (check.limited) return rateLimitResponse(600);

  const body = await request.json().catch(() => ({}));
  const { name, email, company, size, hiring_for, source } = body;

  if (!email || !company) {
    return NextResponse.json({ error: "Email and company name are required." }, { status: 400 });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const sql = getDb();

  // Upsert — if already on waitlist, return success without re-sending
  const existing = await sql`SELECT id, status FROM employer_waitlist WHERE email = ${email.toLowerCase().trim()}`;
  if (existing.length > 0) {
    return NextResponse.json({ success: true, alreadyJoined: true, status: existing[0].status });
  }

  await sql`
    INSERT INTO employer_waitlist (name, email, company, size, hiring_for, source)
    VALUES (
      ${name?.trim() || null},
      ${email.toLowerCase().trim()},
      ${company.trim()},
      ${size || null},
      ${hiring_for?.trim() || null},
      ${source || "direct"}
    )
  `;

  // Send confirmation email
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
    const firstName = name?.split(" ")[0] || "there";

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "careers.ky <hello@careers.ky>",
      to: email.toLowerCase().trim(),
      subject: "You're on the careers.ky Pro waitlist",
      html: waitlistEmailHtml({ firstName, company: company.trim(), baseUrl }),
    });

    // Notify admin
    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "careers.ky <hello@careers.ky>",
        to: process.env.ADMIN_EMAIL,
        subject: `New Pro waitlist signup: ${company.trim()}`,
        html: `<p><strong>${name || "Someone"}</strong> (${email}) from <strong>${company}</strong>${size ? ` (${size} employees)` : ""} joined the waitlist.</p>${hiring_for ? `<p>Hiring for: ${hiring_for}</p>` : ""}<p><a href="${baseUrl}/admin/waitlist">View waitlist →</a></p>`,
      });
    }
  } catch (err) {
    console.error("[Waitlist] Email send failed:", err.message);
    // Don't fail the request — they're on the list, email is best-effort
  }

  return NextResponse.json({ success: true });
}

function waitlistEmailHtml({ firstName, company, baseUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0891b2 0%,#0e7490 100%);padding:36px 40px;">
      <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">careers<span style="color:#67e8f9;">.ky</span></div>
      <div style="color:#cffafe;font-size:13px;margin-top:4px;">A Caymanian-First Careers Platform</div>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0e0e0e;letter-spacing:-0.3px;">You're on the list, ${firstName}.</h1>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
        Thanks for registering <strong>${company}</strong> for careers.ky Pro early access.
        We're building the Cayman Islands' first direct-hire platform — no recruiters, no per-hire fees.
      </p>

      <!-- What you get -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#15803d;margin-bottom:14px;">What's included in Pro</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[
            ["Search Caymanian talent directly", "Filter by skills, education, experience & location"],
            ["Send direct introductions", "Connect with candidates without a recruiter middleman"],
            ["Automated compliance reports", "Timestamped records for every candidate interaction"],
            ["Shortlists & saved searches", "Build pipelines and get notified when new talent matches"],
            ["One flat monthly fee", "CI$299/mo — replaces 15–25% per-hire recruiter costs"],
          ].map(([title, desc]) => `
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="width:20px;height:20px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
              <span style="color:#16a34a;font-size:12px;font-weight:700;">✓</span>
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:#0e0e0e;">${title}</div>
              <div style="font-size:13px;color:#666;margin-top:1px;">${desc}</div>
            </div>
          </div>`).join("")}
        </div>
      </div>

      <!-- Savings callout -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
        <div style="font-size:13px;color:#c2410c;margin-bottom:4px;">Hiring 10 people a year?</div>
        <div style="font-size:22px;font-weight:700;color:#9a3412;">Save CI$90,000–150,000</div>
        <div style="font-size:13px;color:#c2410c;margin-top:4px;">compared to traditional recruiter fees</div>
      </div>

      <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
        We're onboarding employers in batches to ensure every company gets a great experience.
        We'll email you as soon as your spot is ready — usually within a few days.
      </p>

      <a href="${baseUrl}/careers" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:-0.1px;">
        Browse Live Job Market →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #f0f0f0;padding:24px 40px;background:#fafaf9;">
      <p style="margin:0;color:#999;font-size:12px;line-height:1.6;">
        You're receiving this because you joined the careers.ky Pro waitlist.
        Questions? Reply to this email or visit <a href="${baseUrl}" style="color:#0891b2;">${baseUrl.replace("https://","")}</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}
