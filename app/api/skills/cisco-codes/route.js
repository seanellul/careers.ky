import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get("skillId");
  const skillIds = searchParams.get("skillIds");

  try {
    const sql = getDb();
    let ids = [];

    if (skillIds) {
      ids = skillIds.split(",").map(Number).filter(Boolean);
    } else if (skillId) {
      ids = [Number(skillId)];
    }

    if (!ids.length) {
      return NextResponse.json({ ciscoCodes: [] });
    }

    const rows = await sql`
      SELECT DISTINCT oc.occupation_code
      FROM cisco_skills cs
      JOIN occupation_cisco oc ON oc.cisco_code = cs.cisco_code
      WHERE cs.skill_id = ANY(${ids})
      ORDER BY oc.occupation_code
    `;

    return NextResponse.json({ ciscoCodes: rows.map((r) => r.occupation_code) });
  } catch (error) {
    console.error("Skill cisco-codes error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
