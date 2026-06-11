"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";

// The Careers.ky Briefing — subscribe without registration (spec 8.9)
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const subscribe = async () => {
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not subscribe");
      } else {
        setDone(true);
        posthog.capture("newsletter_subscribed");
      }
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-emerald-600 flex items-center gap-2">
        <Check className="w-4 h-4" /> You&apos;re in — The Briefing lands every Monday.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary-500" /> The Careers.ky Briefing
      </p>
      <p className="text-xs text-neutral-500 mb-2">
        The week&apos;s top Cayman roles in your inbox, every Monday. No account needed.
      </p>
      <div className="flex gap-2 max-w-sm">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="your@email.com"
          className="h-9 bg-white dark:bg-neutral-800"
        />
        <Button size="sm" onClick={subscribe} disabled={sending || !email.includes("@")}>
          {sending ? "..." : "Subscribe"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
