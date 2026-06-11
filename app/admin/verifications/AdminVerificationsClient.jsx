"use client";

import { useState } from "react";
import { ShieldCheck, BadgeCheck, Check, X, Clock, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS } from "@/lib/candidate-status";

export default function AdminVerificationsClient({
  initialRequests,
  initialCandidateDocuments = [],
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [candidateDocs, setCandidateDocs] = useState(initialCandidateDocuments);
  const [docProcessing, setDocProcessing] = useState(null);
  const [docNotes, setDocNotes] = useState({});

  const handleDocReview = async (id, action) => {
    setDocProcessing(id);
    try {
      const res = await fetch("/api/admin/verifications/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, action, notes: docNotes[id] || null }),
      });
      if (res.ok) {
        setCandidateDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDocProcessing(null);
    }
  };
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [domainInputs, setDomainInputs] = useState({});
  const [notesInputs, setNotesInputs] = useState({});
  const [agencyFlags, setAgencyFlags] = useState({});

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

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
      if (action === "reject" && agencyFlags[id]) {
        body.blacklistAgency = true;
      }

      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
          )
        );
      }
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending:
        "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30",
      approved:
        "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30",
      rejected:
        "bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400 border-red-300 dark:border-red-500/30",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${styles[status] || "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Candidate status documents */}
      <div className="flex items-center gap-3">
        <BadgeCheck className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-semibold">Candidate Status Documents</h1>
        {candidateDocs.length > 0 && (
          <span className="text-sm text-neutral-500">({candidateDocs.length} pending)</span>
        )}
      </div>

      {candidateDocs.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No candidate documents awaiting review.
        </div>
      ) : (
        <div className="space-y-3">
          {candidateDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="font-medium">{doc.candidate_name || "Unnamed candidate"}</span>
                  <p className="text-sm text-neutral-500">{doc.candidate_email}</p>
                  <p className="text-xs text-neutral-500">
                    Declared status:{" "}
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {STATUS_LABELS[doc.candidate_status] || "Not declared"}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0 text-xs text-neutral-500">
                  <p>{doc.filename}</p>
                  <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                  <a
                    href={`/api/admin/verifications/documents/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary-500 hover:underline mt-1"
                  >
                    View document <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-end gap-3 pt-1">
                <div className="flex-1">
                  <label className="text-xs text-neutral-500 mb-1 block">
                    Rejection notes (optional)
                  </label>
                  <Input
                    value={docNotes[doc.id] || ""}
                    onChange={(e) => setDocNotes((p) => ({ ...p, [doc.id]: e.target.value }))}
                    placeholder="e.g. document unreadable, wrong document type..."
                    className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDocReview(doc.id, "approve")}
                  disabled={docProcessing === doc.id}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  {docProcessing === doc.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Approve &amp; verify
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDocReview(doc.id, "reject")}
                  disabled={docProcessing === doc.id}
                  className="gap-1"
                >
                  {docProcessing === doc.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
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
              filter === f
                ? "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border border-primary-200 dark:border-primary-500/30"
                : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
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
                  {req.work_email && (
                    <p className="text-xs text-emerald-600">
                      Work email verified: {req.work_email}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-sm">{req.employer_name}</p>
                  <p className="text-xs text-neutral-500">
                    {req.employer_domain || req.employer_website || "No domain set"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>
                  Email domain:{" "}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {req.email_domain || "N/A"}
                  </span>
                </span>
                <span>
                  Company domain:{" "}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {req.employer_domain || "Not set"}
                  </span>
                </span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>

              {req.status === "pending" && (
                <div className="flex items-end gap-3 pt-1">
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">
                      Set company domain (optional)
                    </label>
                    <Input
                      value={domainInputs[req.id] || ""}
                      onChange={(e) => setDomainInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                      placeholder="company.com"
                      className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-neutral-500 mb-1 block">
                      Rejection notes (optional)
                    </label>
                    <Input
                      value={notesInputs[req.id] || ""}
                      onChange={(e) => setNotesInputs((p) => ({ ...p, [req.id]: e.target.value }))}
                      placeholder="Reason for rejection..."
                      className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 h-8 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer whitespace-nowrap pb-2">
                    <input
                      type="checkbox"
                      checked={!!agencyFlags[req.id]}
                      onChange={(e) =>
                        setAgencyFlags((p) => ({ ...p, [req.id]: e.target.checked }))
                      }
                      className="rounded"
                    />
                    Agency (blacklist)
                  </label>
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, "approve")}
                    disabled={processing === req.id}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                  >
                    {processing === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={processing === req.id}
                    className="gap-1"
                  >
                    {processing === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
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
