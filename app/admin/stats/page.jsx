"use client";

import { useEffect, useState } from "react";
import { Loader, TrendingUp, PieChart } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/pipeline/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={32} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-neutral-400">Failed to load stats</div>;
  }

  const s = stats.stats;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Sales Pipeline Statistics</h1>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm uppercase font-semibold mb-2">
            Total Leads
          </div>
          <div className="text-4xl font-bold text-neutral-900 dark:text-white">{s.total}</div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm uppercase font-semibold mb-2">
            Average Score
          </div>
          <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">
            {Math.round(s.avg_score)}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Min: {s.min_score} | Max: {s.max_score}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm uppercase font-semibold mb-2">
            Conversion Rate
          </div>
          <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            {s.total > 0 ? ((s.paying / s.total) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-xs text-neutral-500 mt-2">{s.paying} paying customers</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart size={20} />
          Status Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.breakdown.byStatus.map((status) => (
            <div key={status.status} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase font-semibold mb-2">
                {status.status.replace(/_/g, " ")}
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{status.count}</div>
              <div className="text-xs text-neutral-500 mt-2">
                {((status.count / s.total) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segment Breakdown */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Segments ({stats.breakdown.bySegment.length} total)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-300">
                  Segment
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-300">
                  Count
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-300">
                  Avg Score
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-600 dark:text-neutral-300">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {stats.breakdown.bySegment.map((segment) => (
                <tr key={segment.segment} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="px-4 py-3 text-neutral-900 dark:text-white">{segment.segment}</td>
                  <td className="px-4 py-3 text-center font-semibold text-neutral-900 dark:text-white">
                    {segment.count}
                  </td>
                  <td className="px-4 py-3 text-center text-cyan-600 dark:text-cyan-400">
                    {Math.round(segment.avg_score)}
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">
                    {((segment.count / s.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Leads */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Top 10 Leads</h2>
        <div className="space-y-2">
          {stats.topLeads.map((lead, index) => (
            <div
              key={lead.id}
              className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-neutral-400 font-semibold w-6">#{index + 1}</div>
                  <div>
                    <div className="text-neutral-900 dark:text-white font-medium">{lead.employer_name}</div>
                    <div className="text-xs text-neutral-500">{lead.segment}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{lead.score}</div>
                  <div className="text-xs text-neutral-500">score</div>
                </div>
                <div className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  {lead.status.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
