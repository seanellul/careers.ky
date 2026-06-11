"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, X, Loader2, Shield } from "lucide-react";

const DISTRICTS = [
  "George Town",
  "West Bay",
  "Seven Mile Beach",
  "Camana Bay",
  "Bodden Town",
  "North Side",
  "East End",
  "Cayman Brac",
  "Little Cayman",
  "Remote",
];

const SENIORITY = [
  ["entry", "Entry level"],
  ["junior", "Junior (0–3 yrs)"],
  ["mid", "Mid (3–7 yrs)"],
  ["senior", "Senior (7+ yrs)"],
  ["director", "Director"],
  ["executive", "Executive"],
];

const INDUSTRIES = [
  "Financial Services",
  "Legal",
  "Hospitality & Tourism",
  "Construction",
  "Technology",
  "Healthcare",
  "Government & Public Sector",
  "Education",
  "Marine & Yachting",
  "Retail",
  "Other",
];

export default function PostJobClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    minSalary: "",
    maxSalary: "",
    district: "",
    industry: "",
    seniority: "",
    workType: "1",
    numberOfPositions: 1,
    durationDays: 30,
    ciscoCode: "",
  });
  const [qualifications, setQualifications] = useState(["", "", ""]);
  const [ciscoQuery, setCiscoQuery] = useState("");
  const [ciscoSuggestions, setCiscoSuggestions] = useState([]);
  const [ciscoPicked, setCiscoPicked] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // CISCO occupation autocomplete — powers matching + Caymanian early access
  useEffect(() => {
    if (!ciscoQuery.trim() || ciscoPicked) {
      setCiscoSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(ciscoQuery)}&limit=6`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const seen = new Set();
        const unique = [];
        for (const s of d.suggestions || []) {
          const code = s.ciscoUnit?.id;
          if (code && !seen.has(code)) {
            seen.add(code);
            unique.push(s);
          }
        }
        setCiscoSuggestions(unique);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [ciscoQuery, ciscoPicked]);

  const setQual = (i, v) => {
    setQualifications((prev) => prev.map((q, idx) => (idx === i ? v : q)));
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ciscoCode: ciscoPicked?.code || null,
          qualifications: qualifications.filter((q) => q.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create posting");
        return;
      }
      router.push("/employer/jobs");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700";
  const selectCls =
    "w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Briefcase className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-semibold">Post a role</h1>
      </div>
      <p className="text-sm text-neutral-500 mb-6 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary-500" />
        Matching Caymanian candidates get 24-hour early access before the role goes public.
      </p>

      <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Job title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Fund Accountant"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Salary minimum (KYD/yr) *
              </label>
              <Input
                type="number"
                value={form.minSalary}
                onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
                placeholder="60000"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Salary maximum (KYD/yr) *
              </label>
              <Input
                type="number"
                value={form.maxSalary}
                onChange={(e) => setForm({ ...form, maxSalary: e.target.value })}
                placeholder="80000"
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-xs text-neutral-400 -mt-3">
            Salary is required on every careers.ky posting — listings with salary get materially
            more applications.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">District *</label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className={selectCls}
              >
                <option value="">Select district</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Seniority *</label>
              <select
                value={form.seniority}
                onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                className={selectCls}
              >
                <option value="">Select level</option>
                {SENIORITY.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Industry *</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className={selectCls}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Work type</label>
              <select
                value={form.workType}
                onChange={(e) => setForm({ ...form, workType: e.target.value })}
                className={selectCls}
              >
                <option value="1">Full-time</option>
                <option value="2">Part-time</option>
                <option value="3">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">
              Occupation (improves matching &amp; early access)
            </label>
            {ciscoPicked ? (
              <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 gap-1">
                {ciscoPicked.title}
                <button onClick={() => setCiscoPicked(null)} aria-label="Clear occupation">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ) : (
              <div className="relative">
                <Input
                  value={ciscoQuery}
                  onChange={(e) => setCiscoQuery(e.target.value)}
                  placeholder="Search occupations, e.g. accountant..."
                  className={inputCls}
                />
                {ciscoSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {ciscoSuggestions.map((s) => (
                      <button
                        key={s.ciscoUnit.id}
                        onClick={() => {
                          setCiscoPicked({ code: s.ciscoUnit.id, title: s.ciscoUnit.title });
                          setCiscoQuery("");
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      >
                        {s.ciscoUnit.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">
              Job description * (min 100 characters)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={8}
              placeholder="Role responsibilities, team, what success looks like..."
              className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300"
            />
            <div className="text-xs text-neutral-400 mt-1">{form.description.length} chars</div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">
              Required qualifications * (minimum 3)
            </label>
            <div className="space-y-2">
              {qualifications.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={q}
                    onChange={(e) => setQual(i, e.target.value)}
                    placeholder={`Qualification ${i + 1}, e.g. CPA or 5+ years fund accounting`}
                    className={inputCls}
                  />
                  {qualifications.length > 3 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setQualifications((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 mt-2"
              onClick={() => setQualifications((prev) => [...prev, ""])}
            >
              <Plus className="w-3 h-3" /> Add another
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Positions</label>
              <Input
                type="number"
                min={1}
                value={form.numberOfPositions}
                onChange={(e) => setForm({ ...form, numberOfPositions: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Listing duration (days)
              </label>
              <select
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                className={selectCls}
              >
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting ? "Publishing..." : "Publish role"}
          </Button>
          <p className="text-xs text-neutral-400 text-center">
            Goes live immediately for matching Caymanian candidates; public to everyone after 24
            hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
