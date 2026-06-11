import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { getVerificationRequests, approveVerification, rejectVerification } from "@/lib/data";
import { getDb } from "@/lib/db";
import { extractDomain } from "@/lib/verification";

export async function GET() {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getVerificationRequests();
  return NextResponse.json({ requests });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action, domain, notes, blacklistAgency } = await request.json();
  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "requestId and action (approve/reject) required" },
      { status: 400 }
    );
  }

  const adminEmail = session.candidateEmail || session.employerEmail;

  if (action === "approve") {
    const result = await approveVerification(requestId, adminEmail, domain || null);
    if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } else {
    const result = await rejectVerification(requestId, adminEmail, notes || null);
    if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // Platform rule 2: rejecting as an agency blacklists the account's
    // email (and its non-freemail domain) from future registrations.
    if (blacklistAgency) {
      try {
        const sql = getDb();
        const rows = await sql`
          SELECT ea.email FROM employer_verification_requests vr
          JOIN employer_accounts ea ON ea.id = vr.employer_account_id
          WHERE vr.id = ${requestId}
        `;
        const email = rows[0]?.email?.toLowerCase();
        if (email) {
          const agencyDomain = extractDomain(email); // null for freemail — never blacklist gmail.com
          await sql`
            INSERT INTO agency_blacklist (email, domain, reason, created_by)
            VALUES (${email}, ${agencyDomain}, ${notes || "Rejected as recruitment agency"}, ${adminEmail})
          `;
        }
      } catch (err) {
        console.error("Agency blacklist error (non-fatal):", err.message);
      }
    }
    return NextResponse.json({ success: true });
  }
}
