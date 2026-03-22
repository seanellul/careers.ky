"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, ChevronLeft, User, Shield, Eye, Star, Search, X, CheckCircle2, Sparkles,
} from "lucide-react";
import t from "@/lib/theme";

const STEPS = ["About You", "Career Interests", "You're All Set!"];

export default function ProfileSetupClient({ candidate }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: candidate.name || "",
    isCaymanian: candidate.is_caymanian || false,
    headline: candidate.headline || "",
    isDiscoverable: true,
  });

  // CISCO interests
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestQuery, setInterestQuery] = useState("");
  const [interestSuggestions, setInterestSuggestions] = useState([]);

  // Search interests
  useEffect(() => {
    if (!interestQuery.trim()) { setInterestSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(interestQuery)}&limit=8`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        const seen = new Set(selectedInterests.map(i => i.ciscoCode));
        const unique = [];
        for (const s of (d.suggestions || [])) {
          const code = s.ciscoUnit?.id;
          if (code && !seen.has(code)) { seen.add(code); unique.push(s); }
        }
        setInterestSuggestions(unique);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [interestQuery]);

  const addInterest = (suggestion) => {
    const code = suggestion.ciscoUnit?.id;
    if (!code || selectedInterests.some(i => i.ciscoCode === code)) return;
    if (selectedInterests.length >= 3) return;
    setSelectedInterests([...selectedInterests, { ciscoCode: code, title: suggestion.ciscoUnit.title }]);
    setInterestQuery("");
    setInterestSuggestions([]);
  };

  // Restore onboarding data from localStorage if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ck_onboarding");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.pickedUnit?.id && data.pickedUnit?.title) {
          setSelectedInterests([{ ciscoCode: data.pickedUnit.id, title: data.pickedUnit.title }]);
        }
      }
    } catch {}
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          isCaymanian: form.isCaymanian,
          headline: form.headline,
          isDiscoverable: form.isDiscoverable,
          ciscoCodes: selectedInterests.map(i => i.ciscoCode),
        }),
      });
      if (res.ok) {
        try { localStorage.removeItem("ck_onboarding"); } catch {}
        // Check for stored redirect from auth flow
        try {
          const redirect = localStorage.getItem("ck_auth_redirect");
          if (redirect && redirect !== "/profile/setup") {
            localStorage.removeItem("ck_auth_redirect");
            router.push(redirect);
            return;
          }
          localStorage.removeItem("ck_auth_redirect");
        } catch {}
        router.push("/dashboard");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

      <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-medium flex-shrink-0 ${i <= step ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-500"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-primary-500" : "bg-neutral-100"}`} />}
            </div>
          ))}
        </div>
        <div className="text-xs text-neutral-500 mb-6">Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>

        {/* Step 0: About You */}
        {step === 0 && (
          <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-50 grid place-items-center">
                  <User className="w-5 h-5 text-primary-500" />
                </div>
                <h2 className="text-2xl font-semibold">About You</h2>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name <span className="text-red-500">*</span></label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="bg-neutral-50 border-neutral-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Headline <span className="text-neutral-500 font-normal">(optional)</span></label>
                <Input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value.slice(0, 200) })}
                  placeholder="e.g. Experienced accountant seeking opportunities in Cayman"
                  className="bg-neutral-50 border-neutral-200"
                  maxLength={200}
                />
                <div className="text-xs text-neutral-500 mt-1">A short tagline visible on your profile</div>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200 cursor-pointer hover:border-primary-200 transition">
                <input
                  type="checkbox"
                  checked={form.isCaymanian}
                  onChange={(e) => setForm({ ...form, isCaymanian: e.target.checked })}
                  className="rounded w-4 h-4 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium"><Shield className="w-4 h-4 text-primary-500" /> I am Caymanian</div>
                  <div className="text-xs text-neutral-500 mt-1">Helps employers meet local hiring requirements</div>
                </div>
              </label>
              <Button onClick={() => setStep(1)} disabled={!form.name.trim()} className="gap-2 w-full">
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Career Interests */}
        {step === 1 && (
          <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-50 grid place-items-center">
                  <Star className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">What are you looking for?</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Pick 1–3 career interests</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  value={interestQuery}
                  onChange={(e) => setInterestQuery(e.target.value)}
                  placeholder="Search job titles (e.g. Accountant, Nurse, Developer)"
                  className="pl-10 bg-neutral-50 border-neutral-200"
                  autoFocus
                />
              </div>

              {interestSuggestions.length > 0 && (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {interestSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addInterest(s)}
                      className="text-left rounded-xl px-3 py-2.5 border border-neutral-200 bg-neutral-50 hover:border-primary-300 hover:bg-neutral-100 transition"
                    >
                      <div className="font-medium text-sm">{s.ciscoUnit?.title}</div>
                      <div className="text-xs text-neutral-500">{s.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedInterests.length > 0 && (
                <div>
                  <div className="text-sm text-neutral-500 mb-2">Selected ({selectedInterests.length}/3)</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(i => (
                      <Badge key={i.ciscoCode} className="bg-primary-50 text-primary-500 border-primary-200 pr-1 flex items-center gap-1 py-1">
                        {i.title}
                        <button
                          onClick={() => setSelectedInterests(selectedInterests.filter(x => x.ciscoCode !== i.ciscoCode))}
                          className="ml-1 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep(0)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={() => setStep(2)} className="gap-2 flex-1">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: All Set */}
        {step === 2 && (
          <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 grid place-items-center mx-auto">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">You're all set!</h2>
                <p className="text-neutral-600 text-sm max-w-sm mx-auto">
                  Your profile is ready. Employers can now find you when searching for local talent.
                  You can add more details — education, experience, skills — from your dashboard anytime.
                </p>
              </div>

              {selectedInterests.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left">
                  <div className="text-sm text-neutral-500 mb-2">Your career interests</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(i => (
                      <Badge key={i.ciscoCode} className="bg-primary-50 text-primary-500 border-primary-200">
                        {i.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer hover:border-emerald-300 transition text-left">
                <input
                  type="checkbox"
                  checked={form.isDiscoverable}
                  onChange={(e) => setForm({ ...form, isDiscoverable: e.target.checked })}
                  className="rounded w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-emerald-600"><Eye className="w-4 h-4" /> Make me discoverable</div>
                  <div className="text-xs text-neutral-500 mt-1">Employers can find your anonymised profile and request an introduction. Your name and contact details stay hidden until you accept.</div>
                </div>
              </label>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="gap-2 flex-1">
                  {saving ? "Saving..." : "Go to Dashboard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
