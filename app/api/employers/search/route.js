import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchEmployersByName } from "@/lib/data";

// Employer name autocomplete — used by the candidate block-list picker.
export async function GET(request) {
  const session = await getSession();
  if (!session?.candidateId && !session?.employerAccountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ employers: [] });
  }

  const employers = await searchEmployersByName(q);
  return NextResponse.json({ employers });
}
