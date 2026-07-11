"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import t from "@/lib/theme";

// Shared "danger zone" card for self-serve account deletion (Cayman DPA right
// to erasure). Requires typing DELETE before the destructive call is enabled.
export default function DeleteAccountCard({
  endpoint = "/api/profile",
  description = "Permanently delete your profile, documents, introductions, alerts, and sign-in data. This cannot be undone.",
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (confirmText !== "DELETE" || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong — please try again.");
      setDeleting(false);
    } catch {
      setError("Something went wrong — please try again.");
      setDeleting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-red-200 dark:border-red-500/30">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5" /> Delete account
        </h3>
        <p className={`text-sm ${t.textMuted} mb-4`}>{description}</p>

        {!open ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(true)}
            className="gap-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <label className={`block text-sm ${t.text}`} htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className={`${t.input} w-full max-w-xs px-3 py-2 text-sm`}
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Permanently delete
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
