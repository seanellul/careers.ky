import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// DELETE /api/employer/account — self-serve employer USER account deletion
// (Cayman DPA right to erasure). Deletes the employer_accounts row (sessions,
// introductions + messages, shortlists, saved searches, templates, activity
// log, and match alerts cascade via FK) plus rows that do NOT cascade:
// verification requests, notifications, auth tokens, invitation rows holding
// the email, newsletter subscription, and job_postings.posted_by_account_id
// back-references (postings are kept, unlinked).
//
// Deliberately does NOT delete the employers (company) row — it is shared
// WORC/public data and may have other team accounts attached.
export async function DELETE(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const check = rateLimit(`account-delete:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (check.limited) return rateLimitResponse(3600);

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion" }, { status: 400 });
  }

  const accountId = session.employerAccountId;
  const email = session.employerEmail;

  try {
    const sql = getDb();

    // job_postings.posted_by_account_id has no ON DELETE action — unlink so
    // the delete succeeds. Native postings stay up for the company.
    await sql`
      UPDATE job_postings SET posted_by_account_id = NULL WHERE posted_by_account_id = ${accountId}
    `;
    // No FK on these — clean up explicitly.
    await sql`
      DELETE FROM employer_verification_requests WHERE employer_account_id = ${accountId}
    `;
    await sql`
      DELETE FROM notifications
      WHERE recipient_type = 'employer_account' AND recipient_id = ${accountId}
    `;
    if (email) {
      await sql`
        DELETE FROM auth_tokens WHERE account_id = ${accountId} OR LOWER(email) = LOWER(${email})
      `;
      await sql`DELETE FROM employer_invitations WHERE LOWER(email) = LOWER(${email})`;
      await sql`DELETE FROM newsletter_subscribers WHERE LOWER(email) = LOWER(${email})`;
    } else {
      await sql`DELETE FROM auth_tokens WHERE account_id = ${accountId}`;
    }

    // Cascades: sessions, introductions (+ introduction_messages), shortlists
    // (+ shortlist_candidates), intro_templates, saved_searches, activity_log,
    // match_alerts.
    await sql`DELETE FROM employer_accounts WHERE id = ${accountId}`;

    const cookieStore = await cookies();
    cookieStore.delete("ck_session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employer account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
