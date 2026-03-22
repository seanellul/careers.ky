"use client";

import { useState, useMemo } from "react";
import { Search, Users, Shield, Eye, Zap, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? "text-primary-500" : "text-neutral-600"}`} />
      </div>
      <div className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

export default function AdminCandidatesClient({ candidates, stats }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.headline || "").toLowerCase().includes(q) ||
      (c.skills || []).some(s => s && s.toLowerCase().includes(q))
    );
  }, [candidates, search]);

  const statCards = [
    { label: "Total Candidates", value: stats.total, icon: Users },
    { label: "Caymanian", value: stats.caymanian, icon: Shield, accent: true },
    { label: "Discoverable", value: stats.discoverable, icon: Eye, accent: true },
    { label: "Actively Looking", value: stats.activelyLooking, icon: Zap, accent: true },
    { label: "New This Week", value: stats.newThisWeek, icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Candidates</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by name, email, headline, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Caymanian</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Education</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Experience</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Skills</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Availability</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Discoverable</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Interests</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Intros</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const skills = (c.skills || []).filter(Boolean);
                const shownSkills = skills.slice(0, 3);
                const extraCount = skills.length - 3;

                return (
                  <tr key={c.id} className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-4 py-3 text-white font-medium">{c.name || "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">{c.email}</td>
                    <td className="px-4 py-3">
                      {c.is_caymanian ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">Yes</span>
                      ) : (
                        <span className="text-xs text-neutral-500">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{c.education_label || "—"}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{c.experience_label || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {shownSkills.map(s => (
                          <span key={s} className="text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 shadow-sm text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                            {s}
                          </span>
                        ))}
                        {extraCount > 0 && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-500/15 text-primary-500 border border-primary-200 dark:border-primary-500/30">
                            +{extraCount}
                          </span>
                        )}
                        {skills.length === 0 && <span className="text-neutral-600 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs capitalize">
                      {(c.availability || "—").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_discoverable ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{Number(c.interest_count)}</td>
                    <td className="px-4 py-3 text-neutral-300">{Number(c.intro_count)}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(c.created_at).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-neutral-500">No candidates found</div>
        )}
      </div>
    </div>
  );
}
