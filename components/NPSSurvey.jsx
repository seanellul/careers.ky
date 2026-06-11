"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// In-app NPS — the LogFrame's "NPS ≥ 40 from both candidates and employers"
// indicator. Shown on dashboards from the 3rd visit, at most once per 90 days
// (per outcome: submitted or dismissed). Responses land in PostHog as
// nps_submitted { score, role }.
const VISIT_KEY = "ck_nps_visits";
const SHOWN_KEY = "ck_nps_last_outcome";
const MIN_VISITS = 3;
const COOLDOWN_DAYS = 90;

export default function NPSSurvey({ role }) {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(SHOWN_KEY) || 0);
      if (last && Date.now() - last < COOLDOWN_DAYS * 24 * 60 * 60 * 1000) return;
      const visits = Number(localStorage.getItem(VISIT_KEY) || 0) + 1;
      localStorage.setItem(VISIT_KEY, String(visits));
      if (visits >= MIN_VISITS) setVisible(true);
    } catch {}
  }, []);

  const close = (outcome, value = null) => {
    try {
      localStorage.setItem(SHOWN_KEY, String(Date.now()));
      localStorage.setItem(VISIT_KEY, "0");
    } catch {}
    if (outcome === "submitted") {
      posthog.capture("nps_submitted", { score: value, role });
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2500);
    } else {
      posthog.capture("nps_dismissed", { role });
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
      <CardContent className="p-4 sm:p-5">
        {submitted ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Thank you — your feedback helps us build a better platform for Cayman.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-medium">
                How likely are you to recommend careers.ky to a{" "}
                {role === "employer" ? "colleague" : "friend"}?
              </p>
              <button
                onClick={() => close("dismissed")}
                aria-label="Dismiss survey"
                className="text-neutral-400 hover:text-neutral-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={`w-8 h-8 rounded-lg border text-sm transition ${
                    score === i
                      ? "bg-primary-500 text-white border-primary-500"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-primary-300"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-neutral-400">0 = not likely, 10 = very likely</span>
              <Button size="sm" disabled={score === null} onClick={() => close("submitted", score)}>
                Submit
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
