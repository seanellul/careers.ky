"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check } from "lucide-react";

// Recommend-a-friend (MVP #23) — "primary organic growth lever in Year 1".
export default function ReferralCard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => d.link && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      posthog.capture("referral_link_copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 font-medium mb-1">
          <Gift className="w-4 h-4 text-primary-500" /> Recommend a friend
        </div>
        <p className="text-sm text-neutral-500 mb-3">
          Know someone job-hunting in Cayman? Share your link — you&apos;ll see who joins through
          you.
          {data.completed > 0 && (
            <span className="text-emerald-600 font-medium">
              {" "}
              {data.completed} friend{data.completed === 1 ? "" : "s"} joined so far.
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <code className="flex-1 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 truncate">
            {data.link}
          </code>
          <Button size="sm" variant="secondary" onClick={copy} className="gap-1 shrink-0">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
