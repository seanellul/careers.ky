import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import crypto from "crypto";

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const role = session.employerRole;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can invite members" }, { status: 403 });
  }

  const { email, role: inviteRole } = await request.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const normalizedRole = ["admin", "member"].includes(inviteRole) ? inviteRole : "member";

  const sql = getDb();

  // Check if already a team member
  const existing = await sql`
    SELECT id FROM employer_accounts WHERE email = ${email.toLowerCase()} AND employer_id = ${session.employerId}
  `;
  if (existing.length) {
    return NextResponse.json({ error: "This person is already a team member" }, { status: 400 });
  }

  // Check if invitation already pending
  const pendingInvite = await sql`
    SELECT id FROM employer_invitations
    WHERE email = ${email.toLowerCase()} AND employer_id = ${session.employerId}
      AND accepted_at IS NULL AND expires_at > NOW()
  `;
  if (pendingInvite.length) {
    return NextResponse.json({ error: "An invitation is already pending for this email" }, { status: 400 });
  }

  // Create invitation
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  const rows = await sql`
    INSERT INTO employer_invitations (employer_id, invited_by, email, role, token, expires_at)
    VALUES (${session.employerId}, ${session.employerAccountId}, ${email.toLowerCase()}, ${normalizedRole}, ${token}, ${expiresAt})
    RETURNING *
  `;

  const invitation = rows[0];

  // Get employer name for the email
  const employers = await sql`SELECT name FROM employers WHERE id = ${session.employerId}`;
  const employerName = employers[0]?.name || "your company";
  const inviterName = session.employerName || session.employerEmail;

  // Send invitation email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  const joinUrl = `${baseUrl}/employer/join?token=${token}`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "careers.ky <noreply@careers.ky>",
      to: email.toLowerCase(),
      subject: `You've been invited to join ${employerName} on careers.ky`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #0e0e0e; margin-bottom: 16px;">You're invited to join ${employerName}</h2>
          <p style="color: #555; line-height: 1.6;">${inviterName} has invited you to join the ${employerName} team on careers.ky as a <strong>${normalizedRole}</strong>.</p>
          <a href="${joinUrl}" style="display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; margin: 24px 0;">
            Accept Invitation
          </a>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">This invitation expires in 72 hours. If you didn't expect this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send invitation email:", err);
  }

  return NextResponse.json({ success: true, invitation });
}
