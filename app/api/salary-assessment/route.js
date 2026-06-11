import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCandidateById, getCandidateInterests } from "@/lib/data";
import { getSalaryBand, assessSalary } from "@/lib/salary-bands";

export async function GET() {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [candidate, interests] = await Promise.all([
    getCandidateById(session.candidateId),
    getCandidateInterests(session.candidateId),
  ]);

  if (!interests.length) {
    return NextResponse.json({ needsInterests: true });
  }

  // Primary interest drives the band; widen later with per-interest views
  const primary = interests[0];
  const band = await getSalaryBand(primary.cisco_code);
  if (!band) {
    return NextResponse.json({ insufficientData: true, field: primary.title });
  }

  const currentSalary = candidate.current_salary ? Number(candidate.current_salary) : null;
  return NextResponse.json({
    field: primary.title,
    band,
    currentSalary,
    verdict: assessSalary(currentSalary, band),
  });
}

// Save current salary (anonymous market-data contribution, spec SA-05)
export async function POST(request) {
  const session = await getSession();
  if (!session?.candidateId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { currentSalary } = await request.json();
  const value = Number(currentSalary);
  if (!value || value < 1000 || value > 2000000) {
    return NextResponse.json({ error: "Enter a valid annual salary" }, { status: 400 });
  }
  const sql = getDb();
  await sql`UPDATE candidates SET current_salary = ${value}, updated_at = NOW() WHERE id = ${session.candidateId}`;
  return NextResponse.json({ success: true });
}
