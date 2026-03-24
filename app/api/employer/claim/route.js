import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { extractDomain, domainsMatch, getCompanyDomain, sendVerificationNotificationToTeam } from "@/lib/verification";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  // 5 claim attempts per user per hour
  const check = rateLimit(`claim:user:${session.employerAccountId}`, 5, 60 * 60 * 1000);
  if (check.limited) return rateLimitResponse(3600);

  try {
    const { employerId } = await request.json();
    if (!employerId) {
      return NextResponse.json({ error: "Employer ID required" }, { status: 400 });
    }

    const sql = getDb();

    // Fetch employer with domain info
    const employers = await sql`SELECT id, name, domain, website FROM employers WHERE id = ${employerId}`;
    if (!employers.length) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }
    const employer = employers[0];

    // Fetch the claiming account's email
    const accounts = await sql`SELECT id, email, name FROM employer_accounts WHERE id = ${session.employerAccountId}`;
    if (!accounts.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const account = accounts[0];

    // Check if other accounts are already linked (determines role)
    const existingAccounts = await sql`
      SELECT id FROM employer_accounts WHERE employer_id = ${employerId} AND id != ${session.employerAccountId}
    `;

    // If employer already has a verified owner, require verification for new claims
    const verifiedOwners = await sql`
      SELECT id FROM employer_accounts
      WHERE employer_id = ${employerId} AND verification_status = 'verified' AND id != ${session.employerAccountId}
    `;
    const hasVerifiedOwner = verifiedOwners.length > 0;

    const role = existingAccounts.length > 0 ? "member" : "owner";

    // Domain verification logic
    const emailDomain = extractDomain(account.email);
    const companyDomain = getCompanyDomain(employer);
    const isDomainMatch = emailDomain && companyDomain && domainsMatch(emailDomain, companyDomain);

    let verificationStatus;
    let verifiedBy = null;

    if (isDomainMatch && !hasVerifiedOwner) {
      // Auto-verify only if domain matches AND no one else already owns this employer
      verificationStatus = "verified";
      verifiedBy = "domain_match";
    } else {
      // Require manual verification if domain doesn't match OR employer already has a verified owner
      verificationStatus = "pending";
    }

    // Link employer account to employer
    await sql`
      UPDATE employer_accounts
      SET employer_id = ${employerId}, role = ${role},
          verification_status = ${verificationStatus},
          verified_at = ${isDomainMatch ? new Date() : null},
          verified_by = ${verifiedBy}
      WHERE id = ${session.employerAccountId}
    `;
    await sql`UPDATE employers SET claimed = TRUE WHERE id = ${employerId}`;

    // If pending, create verification request and notify team
    if (verificationStatus === "pending") {
      await sql`
        INSERT INTO employer_verification_requests (employer_account_id, employer_id, email_domain, status)
        VALUES (${session.employerAccountId}, ${employerId}, ${emailDomain || account.email.split("@")[1]}, 'pending')
      `;

      // Send notification email (fire and forget)
      sendVerificationNotificationToTeam(account, employer, emailDomain).catch((err) => {
        console.error("Failed to send verification notification:", err);
      });
    }

    return NextResponse.json({
      success: true,
      employer,
      verificationStatus,
    });
  } catch (error) {
    console.error("Employer claim error:", error);
    return NextResponse.json({ error: "Failed to claim employer" }, { status: 500 });
  }
}
