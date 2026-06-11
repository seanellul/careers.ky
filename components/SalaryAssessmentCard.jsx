"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, ArrowRight } from "lucide-react";

const fmt = (n) => `CI$${Number(n).toLocaleString()}`;

const VERDICTS = {
  below: {
    title: "You may be underpaid",
    cls: "text-amber-600",
    body: (band, field) =>
      `Candidates in ${field} typically earn ${fmt(band.p25)}–${fmt(band.p75)}. Your salary is below that range.`,
  },
  market: {
    title: "You're paid at market rate",
    cls: "text-emerald-600",
    body: (band, field) =>
      `Your salary sits within the typical ${fmt(band.p25)}–${fmt(band.p75)} range for ${field} in Cayman.`,
  },
  above: {
    title: "You're paid above market rate",
    cls: "text-primary-500",
    body: (band, field) =>
      `Your salary is above the typical ${fmt(band.p25)}–${fmt(band.p75)} range for ${field}. Nice position to negotiate from.`,
  },
};

// The spec's "core acquisition moment" (MVP #9) — powered by real WORC
// posting data rather than hardcoded bands.
export default function SalaryAssessmentCard() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/salary-assessment")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoaded(true);
        if (d?.verdict) posthog.capture("salary_assessment_viewed", { verdict: d.verdict });
      })
      .catch(() => setLoaded(true));
  };

  useEffect(load, []);

  const saveSalary = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/salary-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSalary: Number(salaryInput) }),
      });
      if (res.ok) load();
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !data || data.needsInterests || data.insufficientData) return null;

  const verdict = data.verdict ? VERDICTS[data.verdict] : null;

  return (
    <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 font-medium mb-2">
          <TrendingUp className="w-4 h-4 text-primary-500" /> Salary check — {data.field}
        </div>

        {verdict ? (
          <>
            <div className={`text-lg font-semibold ${verdict.cls}`}>{verdict.title}</div>
            <p className="text-sm text-neutral-500 mt-1">{verdict.body(data.band, data.field)}</p>
            <p className="text-xs text-neutral-400 mt-2">
              Based on {data.band.count} real Cayman job postings. Median: {fmt(data.band.median)}.
            </p>
            {data.verdict === "below" && (
              <Link href="/careers">
                <Button size="sm" className="gap-1 mt-3">
                  See roles that pay what you&apos;re worth <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-1">
              The market range for {data.field} in Cayman is {fmt(data.band.p25)}–
              {fmt(data.band.p75)} (median {fmt(data.band.median)}, {data.band.count} postings).
            </p>
            <p className="text-xs text-neutral-400 mb-3">
              Add your current salary to see where you stand — it&apos;s anonymous and helps
              benchmark the market for every Caymanian.
            </p>
            <div className="flex gap-2 max-w-xs">
              <Input
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="Current salary (CI$/yr)"
                className="h-9"
              />
              <Button size="sm" onClick={saveSalary} disabled={saving || !salaryInput}>
                {saving ? "..." : "Check"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
