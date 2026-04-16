"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Building2, Users, Shield, TrendingUp, ChevronRight, Loader2 } from "lucide-react";

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function EmployerWaitlistForm({ prefillEmail = "", prefillName = "", prefillCompany = "" }) {
  const [form, setForm] = useState({
    name: prefillName,
    email: prefillEmail,
    company: prefillCompany,
    size: "",
    hiring_for: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.company) {
      setError("Email and company name are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "talent_page" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      if (data.alreadyJoined) setAlreadyJoined(true);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 grid place-items-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          {alreadyJoined ? "You're already on the list!" : "You're on the list!"}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          We've reserved a spot for <strong>{form.company}</strong>.
        </p>
        <p className="text-neutral-500 text-sm mb-8">
          Check your inbox — we've sent a confirmation to <strong>{form.email}</strong> with details on what's included in Pro.
          We'll email you as soon as your access is ready.
        </p>
        <a href="/careers" className="inline-flex items-center gap-2 text-primary-500 hover:underline text-sm font-medium">
          Browse live jobs while you wait <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="grid lg:grid-cols-2 gap-12 items-start">

        {/* Left: value prop */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1 text-sm font-medium">
            <Building2 className="w-3.5 h-3.5" /> careers.ky Pro — Early Access
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Stop paying <span className="text-red-500 line-through">15–25%</span> per hire.
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Search Caymanian talent directly. Send introductions. One flat monthly fee — no recruiters, no per-hire commissions.
          </p>

          <div className="space-y-3">
            {[
              { icon: Users, title: "Search talent directly", desc: "Filter by skills, CISCO code, experience, location & availability" },
              { icon: Shield, title: "Automated compliance records", desc: "Timestamped proof you considered Caymanian candidates" },
              { icon: TrendingUp, title: "CI$299/month flat fee", desc: "Hiring 10 people a year? Save CI$90–150K vs recruiters" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 grid place-items-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/25 text-sm text-primary-700 dark:text-primary-300">
            <strong>Early access:</strong> We're onboarding employers in batches. Join now to secure your spot.
          </div>
        </div>

        {/* Right: form */}
        <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-1">Join the waitlist</h2>
            <p className="text-sm text-neutral-500 mb-6">Free to join. We'll email you when your access is ready.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Your name</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Work email <span className="text-red-400">*</span></label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Company name <span className="text-red-400">*</span></label>
                <Input
                  required
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Ltd."
                  className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Company size</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SIZES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, size: s })}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                        form.size === s
                          ? "bg-primary-50 dark:bg-primary-500/15 text-primary-600 border-primary-300 dark:border-primary-500/40 font-medium"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      {s} employees
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">What are you primarily hiring for? <span className="text-neutral-400">(optional)</span></label>
                <Input
                  value={form.hiring_for}
                  onChange={e => setForm({ ...form, hiring_for: e.target.value })}
                  placeholder="e.g. Finance, Legal, Hospitality..."
                  className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button type="submit" disabled={submitting} className="w-full h-12 text-base gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : <>Join Waitlist <ChevronRight className="w-4 h-4" /></>}
              </Button>

              <p className="text-xs text-neutral-400 text-center">
                No payment required. We'll email you when you're approved.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
