"use client";

import { useState } from "react";
import { Copy, ExternalLink, Search, Check } from "lucide-react";

export default function AdminPitchesClient({ initialEmployers, initialTotal }) {
  const [employers, setEmployers] = useState(initialEmployers);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);
  const [sortField, setSortField] = useState("job_count");
  const [sortDir, setSortDir] = useState("desc");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleSearch(q) {
    setSearch(q);
    if (q.length === 0 || q.length >= 2) {
      const res = await fetch(`/api/admin/pitches?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setEmployers(data.employers);
      }
    }
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${baseUrl}/pitch/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  const sorted = [...employers].sort((a, b) => {
    const av = a[sortField] ?? 0;
    const bv = b[sortField] ?? 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const statusColors = {
    not_contacted: "text-neutral-500",
    contacted: "text-yellow-400",
    responded: "text-blue-400",
    onboarded: "text-green-400",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pitch Decks</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search employers..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Employer</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("job_count")}>
                  Jobs {sortField === "job_count" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("active_jobs")}>
                  Active {sortField === "active_jobs" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Industry</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium cursor-pointer" onClick={() => toggleSort("view_count")}>
                  Views {sortField === "view_count" && (sortDir === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Outreach</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((emp) => (
                <tr key={emp.id} className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900 dark:text-white">{emp.name}</div>
                    {emp.claimed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">claimed</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{Number(emp.job_count)}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{Number(emp.active_jobs)}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{emp.industry || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-neutral-600 dark:text-neutral-400">{Number(emp.view_count)}</span>
                    {emp.last_viewed && (
                      <span className="text-neutral-600 text-xs ml-1">
                        ({new Date(emp.last_viewed).toLocaleDateString()})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${statusColors[emp.outreach_status] || "text-neutral-500"}`}>
                      {(emp.outreach_status || "not_contacted").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLink(emp.slug)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
                        title="Copy pitch link"
                      >
                        {copied === emp.slug ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`/pitch/${emp.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
                        title="Preview pitch"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
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
