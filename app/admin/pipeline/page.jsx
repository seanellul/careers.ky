"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Download,
  Filter,
  Loader,
  Search,
  TrendingUp,
} from "lucide-react";

const STATUS_COLORS = {
  not_contacted: "bg-slate-600 text-slate-100",
  contacted: "bg-amber-600 text-amber-50",
  demo_scheduled: "bg-yellow-600 text-yellow-50",
  trial_active: "bg-blue-600 text-blue-50",
  paying: "bg-emerald-600 text-emerald-50",
  rejected: "bg-red-600 text-red-50",
};

const STATUS_LABELS = {
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  demo_scheduled: "Demo Scheduled",
  trial_active: "Trial Active",
  paying: "Paying",
  rejected: "Rejected",
};

export default function PipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);

  // Filter state
  const [scoreMin, setScoreMin] = useState(
    parseInt(searchParams.get("score_min")) || 0
  );
  const [scoreMax, setScoreMax] = useState(
    parseInt(searchParams.get("score_max")) || 100
  );
  const [segment, setSegment] = useState(searchParams.get("segment") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "score");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sort_order") || "DESC"
  );
  const [offset, setOffset] = useState(0);

  const [segments, setSegments] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [scoreMin, scoreMax, segment, status, search, sortBy, sortOrder, offset]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/pipeline/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        // Extract unique segments and statuses
        if (data.breakdown?.bySegment) {
          setSegments(data.breakdown.bySegment.map((s) => s.segment));
        }
        if (data.breakdown?.byStatus) {
          setStatuses(data.breakdown.byStatus.map((s) => s.status));
        }
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        score_min: scoreMin,
        score_max: scoreMax,
        limit: 50,
        offset: offset,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (segment) params.append("segment", segment);
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      // Update URL
      router.push(`?${params.toString()}`);

      const res = await fetch(`/api/admin/pipeline?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRecords(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(recordId, newStatus) {
    // Optimistic update
    setRecords(
      records.map((r) =>
        r.id === recordId ? { ...r, status: newStatus } : r
      )
    );

    // API call
    fetch(`/api/admin/pipeline/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch((error) => {
      console.error("Failed to update status:", error);
      loadData(); // Reload on error
    });
  }

  async function handleExport() {
    const params = new URLSearchParams({
      score_min: scoreMin,
      score_max: scoreMax,
    });

    if (segment) params.append("segment", segment);
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    window.location.href = `/api/admin/pipeline/export?${params.toString()}`;
  }

  const lead_score = Math.round(stats?.avg_score || 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium mb-1">
              Hot Leads (70+)
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {stats.hot_leads}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              of {stats.total} total
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium mb-1">
              Warm Leads (50-69)
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {stats.warm_leads}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {Math.round((stats.warm_leads / stats.total) * 100)}% of total
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium mb-1">
              Demo Scheduled
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {stats.demo_scheduled}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              next stage leads
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium mb-1">
              Trial Active
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {stats.trial_active}
            </div>
            <div className="text-xs text-slate-500 mt-2">evaluating</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm font-medium mb-1">
              Paying
            </div>
            <div className="text-3xl font-bold text-green-400">
              {stats.paying}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {stats.total > 0
                ? `${Math.round((stats.paying / stats.total) * 100)}%`
                : "0%"}{" "}
              conversion
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h3 className="font-semibold text-white">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Search by name
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Employer name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Score Range */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Min Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={scoreMin}
              onChange={(e) => {
                setScoreMin(parseInt(e.target.value) || 0);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Max Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={scoreMax}
              onChange={(e) => {
                setScoreMax(parseInt(e.target.value) || 100);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Segment */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) => {
                setSegment(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Segments</option>
              {segments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st] || st}
                </option>
              ))}
            </select>
          </div>

          {/* Export */}
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-white font-medium transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                  Employer
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSortBy("score");
                      setSortOrder(
                        sortBy === "score" && sortOrder === "DESC"
                          ? "ASC"
                          : "DESC"
                      );
                      setOffset(0);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Score{" "}
                    {sortBy === "score" && (
                      <span>{sortOrder === "DESC" ? "↓" : "↑"}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                  Segment
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-300 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSortBy("last_contacted");
                      setSortOrder(
                        sortBy === "last_contacted" && sortOrder === "DESC"
                          ? "ASC"
                          : "DESC"
                      );
                      setOffset(0);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Last Contacted{" "}
                    {sortBy === "last_contacted" && (
                      <span>{sortOrder === "DESC" ? "↓" : "↑"}</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <Loader size={20} className="mx-auto animate-spin text-slate-500" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pipeline/${record.id}`}
                        className="text-white hover:text-cyan-400 transition-colors font-medium"
                      >
                        {record.employer_name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">
                        {record.industry}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp size={16} className="text-cyan-400" />
                        <span className="font-semibold text-white">
                          {record.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {record.segment}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={record.status}
                        onChange={(e) =>
                          handleStatusChange(record.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
                          STATUS_COLORS[record.status]
                        }`}
                      >
                        <option value="not_contacted">Not Contacted</option>
                        <option value="contacted">Contacted</option>
                        <option value="demo_scheduled">Demo Scheduled</option>
                        <option value="trial_active">Trial Active</option>
                        <option value="paying">Paying</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                      {record.last_contacted
                        ? new Date(record.last_contacted).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pipeline/${record.id}`}
                        className="inline-flex items-center justify-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span className="text-sm">View</span>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between bg-slate-700/30">
            <div className="text-sm text-slate-400">
              Showing{" "}
              <span className="font-semibold">
                {offset + 1}-{Math.min(offset + 50, pagination.total)}
              </span>{" "}
              of <span className="font-semibold">{pagination.total}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - 50))}
                disabled={offset === 0}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + 50)}
                disabled={!pagination.hasMore}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
