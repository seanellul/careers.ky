import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getEmployerTier, hasFeature } from "@/lib/entitlements";
import { getWorkforceAnalytics } from "@/lib/workforce-analytics";

// Workforce analytics (trend + platform benchmark) — CEO spec §24.
// Gated behind the same paid entitlement as the audit-trail export (D3).
export async function GET() {
  const session = await getSession();
  if (!session?.employerAccountId || !session.employerId) {
    return NextResponse.json({ error: "Employer access required" }, { status: 401 });
  }

  const tier = await getEmployerTier(session.employerId);
  if (!hasFeature(tier, "audit_export")) {
    return NextResponse.json(
      { error: "Workforce analytics are available on paid plans", upgrade: true },
      { status: 403 }
    );
  }

  try {
    const analytics = await getWorkforceAnalytics(session.employerAccountId, session.employerId);
    return NextResponse.json({ tier, ...analytics });
  } catch (error) {
    console.error("Workforce analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
