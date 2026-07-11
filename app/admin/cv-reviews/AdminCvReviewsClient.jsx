"use client";

import { useState } from "react";
import { FileText, Check, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminCvReviewsClient({ initialReviews = [], migrated = true }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [feedback, setFeedback] = useState({});
  const [processing, setProcessing] = useState(null);
  const [errors, setErrors] = useState({});

  const handleAction = async (id, action) => {
    setProcessing(id);
    setErrors((p) => ({ ...p, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/cv-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: feedback[id] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrors((p) => ({ ...p, [id]: data.error || "Failed to update review" }));
      }
    } catch {
      setErrors((p) => ({ ...p, [id]: "Network error — try again" }));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-semibold">CV Reviews</h1>
        {reviews.length > 0 && (
          <span className="text-sm text-neutral-500">({reviews.length} pending)</span>
        )}
      </div>

      {!migrated ? (
        <div className="text-center py-8 text-amber-600 text-sm">
          The cv_review_requests migration has not been applied yet — run
          migrations/20260711_190000_add_cv_reviews.sql to enable this queue.
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No CV reviews awaiting feedback.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="font-medium">
                    {review.candidate_name || "Unnamed candidate"}
                  </span>
                  <p className="text-sm text-neutral-500">{review.candidate_email}</p>
                  <p className="text-xs text-neutral-500">
                    Requested {new Date(review.requested_at).toLocaleDateString()} — 48h turnaround
                    promised
                  </p>
                </div>
                <div className="text-right shrink-0 text-xs text-neutral-500">
                  <p>{review.filename}</p>
                  <a
                    href={`/api/admin/verifications/documents/${review.document_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary-500 hover:underline mt-1"
                  >
                    View CV <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">
                  Feedback (sent to the candidate on complete)
                </label>
                <textarea
                  value={feedback[review.id] || ""}
                  onChange={(e) => setFeedback((p) => ({ ...p, [review.id]: e.target.value }))}
                  placeholder="Strengths, gaps, formatting suggestions, next steps..."
                  rows={4}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                {errors[review.id] && (
                  <p className="text-xs text-red-500 mr-auto">{errors[review.id]}</p>
                )}
                <Button
                  size="sm"
                  onClick={() => handleAction(review.id, "complete")}
                  disabled={processing === review.id || !(feedback[review.id] || "").trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  {processing === review.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Complete &amp; send feedback
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(review.id, "decline")}
                  disabled={processing === review.id}
                  className="gap-1"
                >
                  {processing === review.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
