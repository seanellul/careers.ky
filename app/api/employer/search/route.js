import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchEmployersByName } from "@/lib/data";

export async function GET(request) {
  const session = await getSession();
  if (!session?.employerAccountId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  try {
    const employers = await searchEmployersByName(q);
    return NextResponse.json({ employers });
  } catch (error) {
    console.error("Employer search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
