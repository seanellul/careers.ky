"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, FileUp, Clock, Sparkles } from "lucide-react";

// Free CV review (CEO spec §19). Feature-detects via GET /api/profile/cv-review:
// if the backing table hasn't been migrated yet ({ enabled: false }) or the
// fetch fails, the card renders nothing.
export default function CvReviewCard() {
  const fileRef = useRef(null);
  const [state, setState] = useState(null); // null = loading / hidden
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/profile/cv-review")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.enabled) setState(d);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  if (!state) return null;

  const pending = state.reviews.find((r) => r.status === "pending");
  const latestCompleted = state.reviews.find((r) => r.status === "completed");

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", "cv");
      const res = await fetch("/api/profile/documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        load();
      }
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRequest = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/profile/cv-review", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
      } else {
        load();
      }
    } catch {
      setError("Request failed — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-primary-500" /> Free CV review
          </div>
          {pending && (
            <Badge className="bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="w-3 h-3 mr-1" /> In review
            </Badge>
          )}
        </div>

        {pending ? (
          <p className="text-sm text-neutral-500">
            Our team is reviewing your CV. Expect written feedback within 48 hours — we&apos;ll
            notify you here and by email.
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-3">
              Get free, personal feedback on your CV from our team — strengths, gaps and how to
              stand out to Cayman employers. Typical turnaround is 48 hours.
            </p>
            {state.cv ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={busy}
                onClick={handleRequest}
              >
                <FileText className="w-4 h-4" />
                {busy ? "Sending..." : "Request free review"}
              </Button>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="w-4 h-4" />
                  {busy ? "Uploading..." : "Upload your CV to get started"}
                </Button>
              </>
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </>
        )}

        {state.cv && (
          <p className="text-xs text-neutral-400 mt-3 truncate">CV on file: {state.cv.filename}</p>
        )}

        {latestCompleted && (
          <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 p-3">
            <p className="text-xs font-medium text-neutral-500 mb-1">
              Feedback from our team —{" "}
              {latestCompleted.reviewed_at
                ? new Date(latestCompleted.reviewed_at).toLocaleDateString()
                : ""}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
              {latestCompleted.feedback}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
