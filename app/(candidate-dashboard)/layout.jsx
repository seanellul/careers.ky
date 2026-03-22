export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CandidateDashboardSidebar from "@/components/CandidateDashboardSidebar";
import DashboardTransition from "@/components/DashboardTransition";
import t from "@/lib/theme";

export default async function CandidateDashboardLayout({ children }) {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

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
          <CandidateDashboardSidebar />
          <main className="flex-1 min-w-0 py-8 md:py-12">
            <DashboardTransition>
              {children}
            </DashboardTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
