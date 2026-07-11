import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Phase 2 of the two-phase employer claim: called when the setup wizard
// completes. Promotes pending_employer_id -> employer_id and marks the
// company claimed. verification_status stays 'pending' for admin review
// (domain-matched accounts were already finalized at claim time).
export async function POST() {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const sql = getDb();
    const accounts = await sql`
      SELECT id, employer_id, pending_employer_id
      FROM employer_accounts WHERE id = ${session.employerAccountId}
    `;
    if (!accounts.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    const account = accounts[0];

    // Already finalized (domain match or a previous finalize) — idempotent.
    if (account.employer_id) {
      return NextResponse.json({ success: true, employerId: account.employer_id });
    }

    if (!account.pending_employer_id) {
      return NextResponse.json({ error: "No pending company selection" }, { status: 400 });
    }

    const employerId = account.pending_employer_id;

    // First account linked to the employer becomes owner, later ones members.
    const existingAccounts = await sql`
      SELECT id FROM employer_accounts
      WHERE employer_id = ${employerId} AND id != ${session.employerAccountId}
    `;
    const role = existingAccounts.length > 0 ? "member" : "owner";

    await sql`
      UPDATE employer_accounts
      SET employer_id = ${employerId}, role = ${role},
          pending_employer_id = NULL, pending_claimed_at = NULL
      WHERE id = ${session.employerAccountId}
    `;
    await sql`UPDATE employers SET claimed = TRUE WHERE id = ${employerId}`;

    return NextResponse.json({ success: true, employerId });
  } catch (error) {
    console.error("Employer claim finalize error:", error);
    return NextResponse.json({ error: "Failed to finalize claim" }, { status: 500 });
  }
}
