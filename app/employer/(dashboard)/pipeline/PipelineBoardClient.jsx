"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanSquare, Shield, GripVertical, X, Loader2 } from "lucide-react";
import { STATUS_BADGES } from "@/lib/candidate-status";

// Board columns in pipeline order. Rejected is a drop target (requires a
// reason); archived stays out of the board view.
const COLUMNS = [
  ["outreach", "Outreach"],
  ["responded", "Responded"],
  ["shortlisted", "Shortlisted"],
  ["interviewing", "Interviewing"],
  ["offered", "Offer"],
  ["hired", "Hired"],
  ["rejected", "Closed"],
];

const REJECTION_REASONS = [
  ["position_filled", "Position filled"],
  ["qualifications_mismatch", "Qualifications don't match"],
  ["salary_mismatch", "Salary expectations misaligned"],
  ["candidate_unresponsive", "Candidate unresponsive"],
  ["candidate_withdrew", "Candidate withdrew"],
  ["insufficient_experience", "Insufficient experience"],
  ["location_mismatch", "Location mismatch"],
  ["other", "Other"],
];

function CandidateCard({ intro, onDragStart }) {
  const statusKey = intro.candidate_status || null;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, intro)}
      className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary-200 dark:hover:border-primary-500/30 transition"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-neutral-300 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {intro.candidate_name || "Anonymous candidate"}
          </div>
          {intro.job_title && (
            <div className="text-xs text-neutral-500 truncate">{intro.job_title}</div>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {statusKey && (
              <Badge
                className={`text-[10px] px-1.5 py-0 ${
                  statusKey === "caymanian"
                    ? "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700"
                }`}
              >
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                {STATUS_BADGES[statusKey]}
                {intro.status_verified ? " ✓" : ""}
              </Badge>
            )}
            {intro.status === "pending" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200">
                awaiting consent
              </Badge>
            )}
            {intro.match_score != null && (
              <span className="text-[10px] text-neutral-400">
                {Math.round(Number(intro.match_score))}% match
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PipelineBoardClient({ initialIntroductions }) {
  const [intros, setIntros] = useState(initialIntroductions);
  const [jobFilter, setJobFilter] = useState("");
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  // { intro, toStage } pending a rejection reason
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

  const jobs = useMemo(() => {
    const map = new Map();
    for (const i of intros) {
      if (i.job_id && !map.has(i.job_id)) map.set(i.job_id, i.job_title || i.job_id);
    }
    return [...map.entries()];
  }, [intros]);

  const visible = jobFilter ? intros.filter((i) => i.job_id === jobFilter) : intros;

  const byStage = useMemo(() => {
    const cols = Object.fromEntries(COLUMNS.map(([k]) => [k, []]));
    for (const i of visible) {
      const stage = i.stage === "archived" ? "rejected" : i.stage || "outreach";
      (cols[stage] || cols.outreach).push(i);
    }
    return cols;
  }, [visible]);

  const applyStage = async (intro, toStage, reason = null, notes = null) => {
    const fromStage = intro.stage;
    setSaving(true);
    // Optimistic move
    setIntros((prev) => prev.map((i) => (i.id === intro.id ? { ...i, stage: toStage } : i)));
    try {
      const body = { stage: toStage };
      if (reason) {
        body.rejectionReason = reason;
        body.rejectionNotes = notes || null;
      }
      const res = await fetch(`/api/introductions/${intro.id}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Revert on failure
        setIntros((prev) => prev.map((i) => (i.id === intro.id ? { ...i, stage: fromStage } : i)));
      }
    } catch {
      setIntros((prev) => prev.map((i) => (i.id === intro.id ? { ...i, stage: fromStage } : i)));
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (stage) => {
    setDropTarget(null);
    if (!dragging || dragging.stage === stage) return;
    if (stage === "rejected") {
      setRejectModal({ intro: dragging, toStage: stage });
      setRejectReason("");
      setRejectNotes("");
    } else {
      applyStage(dragging, stage);
    }
    setDragging(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
        </div>
        {jobs.length > 0 && (
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300 max-w-xs"
          >
            <option value="">All roles</option>
            {jobs.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        Drag candidates between stages — they&apos;re notified automatically at each step.
      </p>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(([stage, label]) => (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget(stage);
            }}
            onDragLeave={() => setDropTarget((t) => (t === stage ? null : t))}
            onDrop={() => handleDrop(stage)}
            className={`flex-shrink-0 w-60 rounded-xl border p-2 transition ${
              dropTarget === stage
                ? "border-primary-400 bg-primary-50/50 dark:bg-primary-500/10"
                : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between px-1 py-1.5 mb-1">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-xs text-neutral-400">{byStage[stage].length}</span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {byStage[stage].map((intro) => (
                <CandidateCard
                  key={intro.id}
                  intro={intro}
                  onDragStart={(e, i) => setDragging(i)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Rejection reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Close this introduction</h3>
              <button onClick={() => setRejectModal(null)} aria-label="Cancel">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-3">
              A reason is required — it powers your compliance reporting and the candidate gets a
              respectful notification.
            </p>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm mb-2"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <Input
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Internal notes (optional)"
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!rejectReason}
                onClick={() => {
                  applyStage(rejectModal.intro, "rejected", rejectReason, rejectNotes);
                  setRejectModal(null);
                }}
              >
                Close introduction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
