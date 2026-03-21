import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  let unreadCount = 0;
  let pendingIntroCount = 0;
  try {
    if (session.candidateId) {
      unreadCount = await getUnreadCount("candidate", session.candidateId);
      const sql = getDb();
      const rows = await sql`
        SELECT COUNT(*) as count FROM introductions
        WHERE candidate_id = ${session.candidateId} AND status = 'pending'
      `;
      pendingIntroCount = Number(rows[0].count);
    } else if (session.employerAccountId) {
      unreadCount = await getUnreadCount("employer_account", session.employerAccountId);
    }
  } catch {}

  // Omit emails from the browser-visible payload (PII minimization).
  return NextResponse.json({
    authenticated: true,
    candidateId: session.candidateId,
    employerAccountId: session.employerAccountId,
    employerId: session.employerId,
    candidateName: session.candidateName,
    employerName: session.employerName,
    employerCompanyName: session.employerCompanyName,
    unreadCount,
    pendingIntroCount,
  });
}
