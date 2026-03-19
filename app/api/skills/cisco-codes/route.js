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
      return NextResponse.json({ ciscoCodes: [], titleKeywords: [] });
    }

    const [occRows, skillRows] = await Promise.all([
      // Map skill → 4-digit CISCO codes → WORC occupation codes (which jobs use)
      sql`
        SELECT DISTINCT oc.occupation_code
        FROM cisco_skills cs
        JOIN occupation_cisco oc ON oc.cisco_code = cs.cisco_code
        WHERE cs.skill_id = ANY(${ids})
        ORDER BY oc.occupation_code
      `,
      // Get skill names to derive title keywords (catches misclassified jobs)
      sql`
        SELECT name FROM skills WHERE id = ANY(${ids})
      `,
    ]);

    // Build title keyword groups per skill for fallback title matching.
    // Each group is a set of words that ALL must appear in a job title.
    // For compound names like "Software Development", we use the qualifier
    // word(s) — the part that makes it specific (e.g. "software").
    const genericWords = new Set([
      "and", "the", "for", "with", "management", "skills", "development",
      "engineering", "service", "services", "support", "administration",
      "general", "assistant", "officer", "specialist", "coordinator",
    ]);

    const titleGroups = [];
    for (const { name } of skillRows) {
      const words = name.split(/[\s\/&]+/)
        .map(w => w.toLowerCase().replace(/[^a-z]/g, ""))
        .filter(w => w.length >= 3);

      // Use only the specific/qualifier words (filter out generic suffixes)
      const specific = words.filter(w => !genericWords.has(w));
      // If all words are generic, use the full name as-is
      const group = specific.length > 0 ? specific : words;
      if (group.length > 0) titleGroups.push(group);
    }

    return NextResponse.json({
      ciscoCodes: occRows.map((r) => r.occupation_code),
      titleGroups,
    });
  } catch (error) {
    console.error("Skill cisco-codes error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
