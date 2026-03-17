"use client";

import { useSearchParams, useRouter } from "next/navigation";
import LiveSearchClient from "@/app/jobs/LiveSearchClient";
import EmployerListClient from "@/app/employers/EmployerListClient";
import CareerTracksClient from "@/app/career-tracks/CareerTracksClient";
import { Briefcase, Building2, Compass } from "lucide-react";

const TABS = [
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "employers", label: "Employers", icon: Building2 },
  { key: "career-tracks", label: "Career Tracks", icon: Compass },
];

export default function CareersClient({
  jobs,
  employers,
  tree,
  aggregates,
  workTypes,
  eduTypes,
  expTypes,
  locTypes,
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "jobs";

  const setTab = (tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Clear other params when switching tabs
    for (const key of [...params.keys()]) {
      if (key !== "tab") params.delete(key);
    }
    router.replace(`/careers?${params.toString()}`, { scroll: false });
  };

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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-8 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === key
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-300/30"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "jobs" && (
          <LiveSearchClient
            jobs={jobs}
            workTypes={workTypes}
            eduTypes={eduTypes}
            expTypes={expTypes}
            locTypes={locTypes}
            embedded
          />
        )}
        {activeTab === "employers" && (
          <EmployerListClient employers={employers} embedded />
        )}
        {activeTab === "career-tracks" && (
          <CareerTracksClient
            tree={tree}
            aggregates={aggregates}
            workTypes={workTypes}
            eduTypes={eduTypes}
            expTypes={expTypes}
            embedded
          />
        )}
      </div>
    </div>
  );
}
