"use client";

import { useState } from "react";
import { ShieldCheck, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminVerificationsClient({ initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [domainInputs, setDomainInputs] = useState({});
  const [notesInputs, setNotesInputs] = useState({});

  const filtered = filter === "all"
    ? requests
    : requests.filter((r) => r.status === filter);

  const handleAction = async (id, action) => {
    setProcessing(id);
    try {
      const body = { requestId: id, action };
      if (action === "approve" && domainInputs[id]) {
        body.domain = domainInputs[id];
      }
      if (action === "reject" && notesInputs[id]) {
        body.notes = notesInputs[id];
      }

      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r))
        );
      }
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: "bg-amber-50 text-amber-600 border-amber-300",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-300",
      rejected: "bg-red-50 text-red-500 border-red-300",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-semibold">Employer Verifications</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filter === f ? "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border border-primary-200 dark:border-primary-500/30" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && (
              <span className="ml-1.5 text-xs">
                ({requests.filter((r) => r.status === "pending").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No {filter === "all" ? "" : filter} verification requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{req.account_name || "Unnamed"}</span>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-sm text-neutral-500">{req.account_email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-sm">{req.employer_name}</p>
                  <p className="text-xs text-neutral-500">
                    {req.employer_domain || req.employer_website || "No domain set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>Email domain: <span className="text-neutral-600 dark:text-neutral-400">{req.email_domain || "N/A"}</span></span>
                <span>Company domain: <span className="text-neutral-600 dark:text-neutral-400">{req.employer_domain || "Not set"}</span></span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>

              {req.status === "pending" && (
                <div className="flex items-end gap-3 pt-1">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">Set company domain (optional)</label>
                    <Input
                      value={domainInputs[req.id] || ""}
                      onChange={(e) => setDomainInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                      placeholder="company.com"
                      className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">Rejection notes (optional)</label>
                    <Input
                      value={notesInputs[req.id] || ""}
                      onChange={(e) => setNotesInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                      placeholder="Reason for rejection..."
                      className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, "approve")}
                    disabled={processing === req.id}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                  >
                    {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={processing === req.id}
                    className="gap-1"
                  >
                    {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
