export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTransition from "@/components/DashboardTransition";
import VerificationBanner from "@/components/VerificationBanner";
import t from "@/lib/theme";

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  if (!session?.employerAccountId) redirect("/");
  if (!session.employerId) redirect("/employer/setup");

  const verificationStatus = session.employerVerificationStatus || "verified";
  const accountRole = session.employerRole || "member";

  // Rejected accounts can't access dashboard
  if (verificationStatus === "rejected") {
    redirect("/employer/setup?rejected=true");
  }

  const sql = getDb();
  const employers = await sql`SELECT slug FROM employers WHERE id = ${session.employerId}`;
  const employerSlug = employers[0]?.slug;

  return (
    <div className={t.page}>
      <div
        id="bg-gradient"
        aria-hidden
        className={t.pageGradient}
        style={t.pageGradientStyle}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex">
          <DashboardSidebar employerSlug={employerSlug} accountRole={accountRole} />
          <main className="flex-1 min-w-0 py-8 md:py-12">
            <VerificationBanner verificationStatus={verificationStatus} />
            <DashboardTransition>
              {children}
            </DashboardTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
