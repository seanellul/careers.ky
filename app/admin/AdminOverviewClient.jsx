"use client";

import {
  Building2, UserCheck, Briefcase, Activity,
  Users, Heart, Send, CheckCircle, Eye,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? "text-primary-500" : "text-neutral-400"}`} />
      </div>
      <div className="text-2xl font-bold text-neutral-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

export default function AdminOverviewClient({ stats }) {
  const cards = [
    { label: "Total Employers", value: stats.totalEmployers, icon: Building2 },
    { label: "On Platform", value: stats.claimedEmployers, icon: UserCheck, accent: true },
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase },
    { label: "Active Jobs", value: stats.activeJobs, icon: Activity, accent: true },
    { label: "Candidates", value: stats.totalCandidates, icon: Users },
    { label: "Interests Expressed", value: stats.totalInterests, icon: Heart, accent: true },
    { label: "Introductions", value: stats.totalIntros, icon: Send },
    { label: "Intros Accepted", value: stats.acceptedIntros, icon: CheckCircle, accent: true },
    { label: "Pitch Views (30d)", value: stats.pitchViews30d, icon: Eye },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}
