import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractDomain, domainsMatch } from "@/lib/verification";

// Landing for the one-time work-email link. Works without a session —
// the user may open it in their corporate mail client on another device.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
  }

  const sql = getDb();
  const rows = await sql`
    SELECT email, account_id FROM auth_tokens
    WHERE token = ${token} AND token_type = 'work_email'
      AND used = FALSE AND expires_at > NOW()
  `;
  if (!rows.length || !rows[0].account_id) {
    return NextResponse.redirect(new URL("/?error=expired_token", request.url));
  }

  const { email, account_id: accountId } = rows[0];
  await sql`UPDATE auth_tokens SET used = TRUE WHERE token = ${token}`;

  await sql`
    UPDATE employer_accounts
    SET work_email = ${email}, work_email_verified_at = NOW()
    WHERE id = ${accountId}
  `;

  // Auto-approve a pending verification request when the proven domain
  // matches the claimed employer's domain or website.
  let autoApproved = false;
  try {
    const pending = await sql`
      SELECT vr.id, vr.employer_id, e.domain, e.website
      FROM employer_verification_requests vr
      JOIN employers e ON e.id = vr.employer_id
      WHERE vr.employer_account_id = ${accountId} AND vr.status = 'pending'
    `;
    const workDomain = extractDomain(email);
    for (const req of pending) {
      const companyDomain = req.domain || req.website;
      if (workDomain && companyDomain && domainsMatch(workDomain, companyDomain)) {
        await sql`
          UPDATE employer_verification_requests
          SET status = 'approved', reviewed_by = 'work-email-verification', reviewed_at = NOW()
          WHERE id = ${req.id}
        `;
        await sql`
          UPDATE employer_accounts
          SET verification_status = 'verified', verified_at = NOW(), verified_by = 'work_email_domain_match'
          WHERE id = ${accountId}
        `;
        autoApproved = true;
      }
    }
  } catch (err) {
    console.error("Work-email auto-approve error (non-fatal):", err.message);
  }

  return NextResponse.redirect(
    new URL(
      `/employer/dashboard?work_email=${autoApproved ? "verified" : "confirmed"}`,
      request.url
    )
  );
}
