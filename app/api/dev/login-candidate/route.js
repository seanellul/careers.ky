import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { upsertCandidate } from "@/lib/data";

// DEV ONLY — sign in as a synthetic candidate (no OAuth). For testing onboarding without OAuth emails.
export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { fresh } = body;

  const sql = getDb();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let candidateId;

  if (fresh === true) {
    const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const email = `dev-onboarding-${suffix}@test.careers.ky`;
    const row = await upsertCandidate(email, {
      name: "",
      isDiscoverable: false,
    });
    candidateId = row.id;
  } else {
    const stable = "dev-candidate-stable@test.careers.ky";
    const existing = await sql`SELECT id FROM candidates WHERE email = ${stable}`;
    if (existing.length) {
      candidateId = existing[0].id;
    } else {
      const row = await upsertCandidate(stable, {
        name: "Dev Stable",
        isDiscoverable: false,
      });
      candidateId = row.id;
    }
  }

  await sql`
    INSERT INTO sessions (session_id, candidate_id, employer_account_id, expires_at)
    VALUES (${sessionId}, ${candidateId}, NULL, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set("ck_session", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return NextResponse.json({
    success: true,
    candidateId,
    defaultNext: fresh ? "/profile/setup" : "/dashboard",
  });
}
