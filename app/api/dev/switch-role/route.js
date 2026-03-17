import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

// DEV ONLY — quick role switching without OAuth
export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { role } = await request.json(); // "employer" or "candidate"
  const sql = getDb();

  // Use the first employer account or first candidate
  let candidateId = null;
  let employerAccountId = null;

  if (role === "employer") {
    const rows = await sql`SELECT id FROM employer_accounts ORDER BY id LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "No employer accounts exist" }, { status: 400 });
    employerAccountId = rows[0].id;
  } else {
    // Use a dev candidate (not the real user)
    const rows = await sql`SELECT id FROM candidates WHERE email LIKE 'dev-candidate-%' ORDER BY id LIMIT 1`;
    if (!rows.length) {
      // Fallback to any candidate
      const fallback = await sql`SELECT id FROM candidates ORDER BY id LIMIT 1`;
      if (!fallback.length) return NextResponse.json({ error: "No candidates exist" }, { status: 400 });
      candidateId = fallback[0].id;
    } else {
      candidateId = rows[0].id;
    }
  }

  // Create a session directly
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

  await sql`
    INSERT INTO sessions (session_id, candidate_id, employer_account_id, expires_at)
    VALUES (${sessionId}, ${candidateId}, ${employerAccountId}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set("ck_session", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return NextResponse.json({ success: true, role, candidateId, employerAccountId });
}
