import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PUT(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session?.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const { website, description, logoUrl } = await request.json();
    const sql = getDb();

    // Verify ownership
    const accounts = await sql`
      SELECT employer_id FROM employer_accounts WHERE id = ${session.employerAccountId}
    `;
    if (!accounts.length || accounts[0].employer_id !== session.employerId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await sql`
      UPDATE employers SET
        website = COALESCE(${website || null}, website),
        description = COALESCE(${description || null}, description),
        logo_url = COALESCE(${logoUrl || null}, logo_url)
      WHERE id = ${session.employerId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employer profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
