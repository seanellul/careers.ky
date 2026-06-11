"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, FileUp, Clock, XCircle, Shield } from "lucide-react";

const REVIEW_BADGES = {
  pending: { label: "Under review", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  approved: { label: "Approved", cls: "bg-green-50 text-green-600 border-green-200" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200" },
};

export default function VerificationCard({ statusVerified }) {
  const fileRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/profile/documents")
      .then((r) => r.json())
      .then((d) => {
        setDocuments(d.documents || []);
        setConfigured(d.uploadsConfigured !== false);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", "status_proof");
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
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const statusDocs = documents.filter((d) => d.doc_type === "status_proof");
  const hasPending = statusDocs.some((d) => d.review_status === "pending");

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-medium">
            <BadgeCheck className="w-4 h-4 text-primary-500" /> Status verification
          </div>
          {statusVerified && (
            <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">
              <Shield className="w-3 h-3 mr-1" /> WORC Verified
            </Badge>
          )}
        </div>

        {statusVerified ? (
          <p className="text-sm text-neutral-500">
            Your status is verified. Employers see the verified badge on your profile, and you
            receive full priority ranking in search results.
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-3">
              Upload proof of your status (Caymanian certificate, PR, RERC or permit scan). Our team
              reviews it and your profile gets the verified badge with full priority ranking.
            </p>
            {!configured ? (
              <p className="text-xs text-amber-600">
                Document uploads are coming soon — check back shortly.
              </p>
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
                  disabled={uploading || hasPending}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="w-4 h-4" />
                  {uploading
                    ? "Uploading..."
                    : hasPending
                      ? "Document under review"
                      : "Upload proof of status"}
                </Button>
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              </>
            )}
          </>
        )}

        {statusDocs.length > 0 && (
          <ul className="mt-4 space-y-2">
            {statusDocs.map((doc) => {
              const badge = REVIEW_BADGES[doc.review_status] || REVIEW_BADGES.pending;
              return (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    {doc.review_status === "pending" && (
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    {doc.review_status === "approved" && (
                      <BadgeCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                    {doc.review_status === "rejected" && (
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{doc.filename}</span>
                  </span>
                  <Badge className={badge.cls}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
