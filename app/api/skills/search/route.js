import { NextResponse } from "next/server";
import { searchSkills, getSkillsForCisco } from "@/lib/data";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const ciscoCode = searchParams.get("ciscoCode");

  try {
    if (ciscoCode) {
      const skills = await getSkillsForCisco(ciscoCode);
      return NextResponse.json({ skills });
    }

    if (q) {
      const skills = await searchSkills(q);
      return NextResponse.json({ skills });
    }

    return NextResponse.json({ skills: [] });
  } catch (error) {
    console.error("Skills search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
