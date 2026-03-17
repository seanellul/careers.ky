"use client";

import { useState, useMemo } from "react";
import { Search, Building2, UserCheck, Users, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? "text-cyan-400" : "text-neutral-600"}`} />
      </div>
      <div className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

export default function AdminEmployersClient({ employers, stats }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("job_count");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    if (!search) return employers;
    const q = search.toLowerCase();
    return employers.filter(e =>
      (e.name || "").toLowerCase().includes(q) ||
      (e.admin_emails || []).some(email => email && email.toLowerCase().includes(q)) ||
      (e.industry || "").toLowerCase().includes(q)
    );
  }, [employers, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortField]) || 0;
      const bv = Number(b[sortField]) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const statCards = [
    { label: "Total Employers", value: stats.total, icon: Building2 },
    { label: "On Platform", value: stats.claimed, icon: UserCheck, accent: true },
    { label: "With Admin Accounts", value: stats.withAdmins, icon: Users, accent: true },
    { label: "New This Month", value: stats.newThisMonth, icon: TrendingUp },
  ];

  const sortIndicator = (field) =>
    sortField === field ? (sortDir === "desc" ? " \u2193" : " \u2191") : "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Employers</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by company, admin email, or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Admin Email(s)</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Industry</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("job_count")}>
                  Jobs{sortIndicator("job_count")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("active_jobs")}>
                  Active{sortIndicator("active_jobs")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("interest_count")}>
                  Interests{sortIndicator("interest_count")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("intro_count")}>
                  Intros{sortIndicator("intro_count")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const emails = (e.admin_emails || []).filter(Boolean);
                return (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{e.name}</div>
                      {e.claimed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                          claimed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {emails.length > 0 ? (
                        <span className="text-neutral-300 text-xs">{emails.join(", ")}</span>
                      ) : (
                        <span className="text-neutral-600 text-xs">No account</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{e.industry || "—"}</td>
                    <td className="px-4 py-3 text-neutral-300">{Number(e.job_count)}</td>
                    <td className="px-4 py-3 text-neutral-300">{Number(e.active_jobs)}</td>
                    <td className="px-4 py-3 text-neutral-300">{Number(e.interest_count)}</td>
                    <td className="px-4 py-3 text-neutral-300">{Number(e.intro_count)}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-8 text-neutral-500">No employers found</div>
        )}
      </div>
    </div>
  );
}
