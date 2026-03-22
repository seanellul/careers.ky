"use client";

import { useState, useMemo } from "react";
import { Search, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminInterestsClient({ interests }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return interests;
    const q = search.toLowerCase();
    return interests.filter(i =>
      (i.candidate_name || "").toLowerCase().includes(q) ||
      (i.employer_name || "").toLowerCase().includes(q) ||
      (i.job_title || "").toLowerCase().includes(q)
    );
  }, [interests, search]);

  // Group by employer
  const grouped = useMemo(() => {
    const map = new Map();
    for (const i of filtered) {
      const key = (i.employer_name || "Unknown").trim();
      if (!map.has(key)) map.set(key, { name: key, onPlatform: i.employer_on_platform, items: [] });
      map.get(key).items.push(i);
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [filtered]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Interest Pipeline</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by candidate, employer, or job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.name} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{group.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-500 border border-primary-200 dark:border-primary-500/30">
                  {group.items.length} interest{group.items.length !== 1 && "s"}
                </span>
              </div>
              {group.onPlatform ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" /> On platform
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertCircle className="w-3 h-3" /> Not on platform
                </span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Candidate</th>
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Email</th>
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Caymanian</th>
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Job Title</th>
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Date</th>
                  <th className="text-left px-4 py-2 text-neutral-500 font-medium text-xs">Notified</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/[0.03] hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-4 py-2 text-white">{item.candidate_name || "—"}</td>
                    <td className="px-4 py-2 text-neutral-500">{item.candidate_email}</td>
                    <td className="px-4 py-2">
                      {item.is_caymanian ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{item.job_title || "—"}</td>
                    <td className="px-4 py-2 text-neutral-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {item.notified ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-8 text-neutral-500">No interests found</div>
        )}
      </div>
    </div>
  );
}
