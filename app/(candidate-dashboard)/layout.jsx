export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CandidateDashboardSidebar from "@/components/CandidateDashboardSidebar";
import DashboardTransition from "@/components/DashboardTransition";

export default async function CandidateDashboardLayout({ children }) {
  const session = await getSession();
  if (!session?.candidateId) redirect("/");

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)",
          backgroundPosition: "0% 50%",
        }}
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
