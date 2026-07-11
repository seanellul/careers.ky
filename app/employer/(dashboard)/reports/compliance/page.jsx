export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getComplianceRollup } from "@/lib/compliance";
import { getEmployerTier, hasFeature } from "@/lib/entitlements";
import { getWorkforceAnalytics } from "@/lib/workforce-analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ArrowLeft } from "lucide-react";
import WorcReportClient from "./WorcReportClient";

export const metadata = {
  title: "WORC Workforce Report — careers.ky",
  description: "Print-ready Caymanian-first workforce report for WORC submissions",
};

export default async function WorcReportPage() {
  const session = await getSession();

  // Same paid entitlement as the audit-trail export (D3 / CEO spec §24)
  const tier = await getEmployerTier(session.employerId);
  if (!hasFeature(tier, "audit_export")) {
    return (
      <div>
        <Link
          href="/employer/reports"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to reports
        </Link>
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-12 text-center">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50 text-neutral-500" />
            <h1 className="text-lg font-medium mb-2">
              The WORC workforce report is a paid feature
            </h1>
            <p className="text-neutral-500 max-w-md mx-auto">
              12-month trends, platform benchmarking, and a print-ready WORC report are available
              on Pro and Enterprise plans. Contact us to upgrade your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sql = getDb();
  const [employers, rollup, analytics] = await Promise.all([
    sql`SELECT name FROM employers WHERE id = ${session.employerId}`,
    getComplianceRollup(session.employerAccountId, session.employerId),
    getWorkforceAnalytics(session.employerAccountId, session.employerId),
  ]);

  return (
    <WorcReportClient
      employerName={employers[0]?.name || "Your company"}
      rollup={rollup}
      analytics={analytics}
    />
  );
}
