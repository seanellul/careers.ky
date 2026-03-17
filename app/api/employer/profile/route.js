import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId || !session?.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM employers WHERE id = ${session.employerId}`;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ employer: rows[0] });
  } catch (error) {
    console.error("Employer profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getSession();
  if (!session?.employerAccountId || !session?.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      website, description, logoUrl, coverUrl, tagline,
      companySize, yearFounded, headquarters, industry,
      socialLinks, benefits, profileSections,
    } = body;
    const sql = getDb();

    // Verify ownership
    const accounts = await sql`
      SELECT employer_id FROM employer_accounts WHERE id = ${session.employerAccountId}
    `;
    if (!accounts.length || accounts[0].employer_id !== session.employerId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Validate company_size if provided
    const validSizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
    if (companySize && !validSizes.includes(companySize)) {
      return NextResponse.json({ error: "Invalid company size" }, { status: 400 });
    }

    // Validate tagline length
    if (tagline && tagline.length > 200) {
      return NextResponse.json({ error: "Tagline too long (max 200 chars)" }, { status: 400 });
    }

    await sql`
      UPDATE employers SET
        website = COALESCE(${website !== undefined ? (website || null) : null}, website),
        description = COALESCE(${description !== undefined ? (description || null) : null}, description),
        logo_url = COALESCE(${logoUrl !== undefined ? (logoUrl || null) : null}, logo_url),
        cover_url = ${coverUrl !== undefined ? (coverUrl || null) : sql`cover_url`},
        tagline = ${tagline !== undefined ? (tagline || null) : sql`tagline`},
        company_size = ${companySize !== undefined ? (companySize || null) : sql`company_size`},
        year_founded = ${yearFounded !== undefined ? (yearFounded || null) : sql`year_founded`},
        headquarters = ${headquarters !== undefined ? (headquarters || null) : sql`headquarters`},
        industry = ${industry !== undefined ? (industry || null) : sql`industry`},
        social_links = ${socialLinks !== undefined ? JSON.stringify(socialLinks || {}) : sql`social_links`},
        benefits = ${benefits !== undefined ? JSON.stringify(benefits || []) : sql`benefits`},
        profile_sections = ${profileSections !== undefined ? JSON.stringify(profileSections || {}) : sql`profile_sections`}
      WHERE id = ${session.employerId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employer profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
