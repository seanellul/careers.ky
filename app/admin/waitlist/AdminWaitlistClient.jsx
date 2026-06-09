"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Calendar,
  Mail,
  Users,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const STATUS_COLORS = {
  pending:
    "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30",
  approved:
    "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30",
  rejected:
    "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-300 dark:border-red-500/30",
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function AdminWaitlistClient({ entries: initialEntries }) {
  const [entries, setEntries] = useState(initialEntries);
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState(null);

  const filtered = entries.filter(
    (e) =>
      !query.trim() ||
      e.company?.toLowerCase().includes(query.toLowerCase()) ||
      e.email?.toLowerCase().includes(query.toLowerCase()) ||
      e.name?.toLowerCase().includes(query.toLowerCase())
  );

  const counts = {
    total: entries.length,
    pending: entries.filter((e) => e.status === "pending").length,
    approved: entries.filter((e) => e.status === "approved").length,
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employer Waitlist</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage Pro waitlist signups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-neutral-700 dark:text-neutral-300" },
          {
            label: "Pending",
            value: counts.pending,
            color: "text-yellow-600 dark:text-yellow-400",
          },
          {
            label: "Approved",
            value: counts.approved,
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
          >
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-500 mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company, email or name..."
          className="pl-10 bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
        />
      </div>

      {/* Table */}
      <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Size
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Hiring For
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    No entries found
                  </td>
                </tr>
              )}
              {filtered.map((entry) => {
                const StatusIcon = STATUS_ICONS[entry.status] || Clock;
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <span className="font-medium">{entry.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-700 dark:text-neutral-300">
                        {entry.name || "—"}
                      </div>
                      <div className="text-neutral-500 text-xs flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {entry.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {entry.size ? (
                        <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                          <Users className="w-3 h-3" /> {entry.size}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-[160px] truncate">
                      {entry.hiring_for || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.joined_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${STATUS_COLORS[entry.status] || STATUS_COLORS.pending} text-xs flex items-center gap-1 w-fit`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {entry.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === entry.id}
                            onClick={() => updateStatus(entry.id, "approved")}
                            className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                          >
                            Approve
                          </Button>
                        )}
                        {entry.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === entry.id}
                            onClick={() => updateStatus(entry.id, "rejected")}
                            className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
