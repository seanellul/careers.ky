"use client";

import { useState } from "react";
import { Copy, ExternalLink, Check, Save } from "lucide-react";

const STATUSES = ["not_contacted", "contacted", "responded", "onboarded"];

export default function AdminOutreachClient({ initialEmployers }) {
  const [employers, setEmployers] = useState(initialEmployers);
  const [saving, setSaving] = useState(null);
  const [copied, setCopied] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function updateStatus(slug, status) {
    setSaving(slug);
    const notes = editingNotes[slug] ?? employers.find(e => e.slug === slug)?.notes;
    const res = await fetch("/api/admin/outreach", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, status, notes }),
    });
    if (res.ok) {
      setEmployers(prev => prev.map(e =>
        e.slug === slug ? { ...e, outreach_status: status } : e
      ));
    }
    setSaving(null);
  }

  async function saveNotes(slug) {
    setSaving(slug);
    const emp = employers.find(e => e.slug === slug);
    const res = await fetch("/api/admin/outreach", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        status: emp?.outreach_status || "not_contacted",
        notes: editingNotes[slug] || "",
      }),
    });
    if (res.ok) {
      setEmployers(prev => prev.map(e =>
        e.slug === slug ? { ...e, notes: editingNotes[slug] } : e
      ));
    }
    setSaving(null);
  }

  function copyLink(slug) {
    navigator.clipboard.writeText(`${baseUrl}/pitch/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  const statusColors = {
    not_contacted: "border-neutral-300 dark:border-neutral-700 text-neutral-500",
    contacted: "border-yellow-400 text-yellow-600",
    responded: "border-blue-400 text-blue-600",
    onboarded: "border-green-400 text-green-600",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Employer Outreach</h1>
      <p className="text-sm text-neutral-500 mb-6">Employers not yet on platform, sorted by priority score (interests x3 + active jobs)</p>

      <div className="space-y-3">
        {employers.map((emp) => {
          const status = emp.outreach_status || "not_contacted";
          const notes = editingNotes[emp.slug] ?? emp.notes ?? "";

          return (
            <div key={emp.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{emp.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/15 text-primary-500 border border-primary-200 dark:border-primary-500/30">
                      priority: {Number(emp.priority_score)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                    <span>{Number(emp.active_jobs)} active jobs</span>
                    <span>{Number(emp.interest_count)} interests</span>
                    <span>{Number(emp.view_count)} pitch views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(emp.slug)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-100 transition"
                    title="Copy pitch link"
                  >
                    {copied === emp.slug ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`/pitch/${emp.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-100 transition"
                    title="Preview pitch"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <select
                  value={status}
                  onChange={(e) => updateStatus(emp.slug, e.target.value)}
                  disabled={saving === emp.slug}
                  className={`text-xs px-2 py-1.5 rounded-lg bg-transparent border ${statusColors[status]} focus:outline-none focus:border-primary-500/50`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                {emp.contacted_at && (
                  <span className="text-xs text-neutral-500">
                    contacted {new Date(emp.contacted_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2">
                <textarea
                  value={notes}
                  onChange={(e) => setEditingNotes(prev => ({ ...prev, [emp.slug]: e.target.value }))}
                  placeholder="Add notes..."
                  rows={1}
                  className="flex-1 text-sm px-3 py-2 bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 placeholder-neutral-400 focus:outline-none focus:border-primary-300 resize-none"
                />
                {editingNotes[emp.slug] !== undefined && editingNotes[emp.slug] !== emp.notes && (
                  <button
                    onClick={() => saveNotes(emp.slug)}
                    disabled={saving === emp.slug}
                    className="p-2 rounded-lg bg-primary-50 dark:bg-primary-500/15 text-primary-500 hover:bg-primary-100 transition"
                    title="Save notes"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {employers.length === 0 && (
          <div className="text-center py-8 text-neutral-500">All employers are on the platform</div>
        )}
      </div>
    </div>
  );
}
