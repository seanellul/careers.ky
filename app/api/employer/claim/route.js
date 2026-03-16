import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const { employerId } = await request.json();
    if (!employerId) {
      return NextResponse.json({ error: "Employer ID required" }, { status: 400 });
    }

    const sql = getDb();

    // Verify employer exists
    const employers = await sql`SELECT id, name FROM employers WHERE id = ${employerId}`;
    if (!employers.length) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    // Link employer account to employer
    await sql`UPDATE employer_accounts SET employer_id = ${employerId} WHERE id = ${session.employerAccountId}`;
    await sql`UPDATE employers SET claimed = TRUE WHERE id = ${employerId}`;

    return NextResponse.json({ success: true, employer: employers[0] });
  } catch (error) {
    console.error("Employer claim error:", error);
    return NextResponse.json({ error: "Failed to claim employer" }, { status: 500 });
  }
}
