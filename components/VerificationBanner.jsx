"use client";

import { useState } from "react";
import { Clock, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function VerificationBanner({ verificationStatus }) {
  const [workEmail, setWorkEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  if (verificationStatus !== "pending") return null;

  const sendLink = async () => {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/employer/verify-work-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send the link");
      } else {
        setSentTo(data.sentTo);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          Your account is pending verification. Speed it up by verifying your work email — if it
          matches your company&apos;s domain, you&apos;re approved instantly.
        </p>
      </div>
      {sentTo ? (
        <p className="text-sm text-emerald-700 flex items-center gap-2 mt-2 ml-8">
          <CheckCircle className="w-4 h-4" /> Verification link sent to {sentTo} — check your work
          inbox (link valid for 1 hour).
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 mt-2 ml-8">
          <Input
            type="email"
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
            placeholder="you@yourcompany.ky"
            className="bg-white border-amber-200 h-9 max-w-xs"
          />
          <Button
            size="sm"
            onClick={sendLink}
            disabled={sending || !workEmail.includes("@")}
            className="gap-1"
          >
            <Mail className="w-3.5 h-3.5" /> {sending ? "Sending..." : "Send verification link"}
          </Button>
          {error && <span className="text-xs text-red-600 self-center">{error}</span>}
        </div>
      )}
    </div>
  );
}
