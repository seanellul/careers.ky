import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

// Candidate's own referral link + stats. Codes generated lazily.
export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  let rows = await sql`SELECT referral_code FROM candidates WHERE id = ${session.candidateId}`;
  let code = rows[0]?.referral_code;

  if (!code) {
    code = crypto.randomBytes(4).toString("hex");
    const updated = await sql`
      UPDATE candidates SET referral_code = ${code}
      WHERE id = ${session.candidateId} AND referral_code IS NULL
      RETURNING referral_code
    `;
    code = updated[0]?.referral_code || code;
  }

  const counts = await sql`
    SELECT COUNT(*) as total,
           COUNT(*) FILTER (WHERE name IS NOT NULL AND name != '') as completed
    FROM candidates WHERE referred_by = ${session.candidateId}
  `;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://careers.ky";
  return NextResponse.json({
    code,
    link: `${baseUrl}/?ref=${code}`,
    referred: Number(counts[0].total),
    completed: Number(counts[0].completed),
  });
}
