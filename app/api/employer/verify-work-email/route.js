import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { extractDomain, domainsMatch } from "@/lib/verification";
import { rateLimit } from "@/lib/rate-limit";

// Work-email verification: login identity (any OAuth account) is decoupled
// from domain proof. A one-time link sent to the corporate address proves
// control; a domain match against the claimed employer auto-approves the
// pending verification request.

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const check = rateLimit(`work-email:${session.employerAccountId}`, 3, 60 * 60 * 1000);
  if (check.limited) {
    return NextResponse.json({ error: "Too many attempts — try again later" }, { status: 429 });
  }

  const { workEmail } = await request.json();
  const email = String(workEmail || "")
    .trim()
    .toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!extractDomain(email)) {
    return NextResponse.json(
      { error: "Use your company email — personal email providers can't verify a company domain" },
      { status: 400 }
    );
  }

  const sql = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await sql`
    INSERT INTO auth_tokens (email, token, token_type, expires_at, account_id)
    VALUES (${email}, ${token}, 'work_email', ${expiresAt}, ${session.employerAccountId})
  `;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email sending is not configured" }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const verifyUrl = `${baseUrl}/api/employer/verify-work-email/confirm?token=${token}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
    to: email,
    subject: "Verify your work email — careers.ky",
    html: `<p>Click the link below to verify this work email for your careers.ky employer account. The link expires in 1 hour.</p><p><a href="${verifyUrl}">Verify my work email</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });

  return NextResponse.json({ success: true, sentTo: email });
}
