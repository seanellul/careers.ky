"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";

export default function OnboardingFlow({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("unemployed");
  const [authSession, setAuthSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pickedMajor, setPickedMajor] = useState("");
  const [pickedUnit, setPickedUnit] = useState(null);
  const [query, setQuery] = useState("");
  const [persisted, setPersisted] = useState(false);
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [everEmployed, setEverEmployed] = useState(undefined);
  const [selectedTitle, setSelectedTitle] = useState(null);

  const [tree, setTree] = useState({ id: "root", title: "Occupations", children: [] });
  const [agg, setAgg] = useState(new Map());
  const [eduTypes, setEduTypes] = useState(new Map());
  const [expTypes, setExpTypes] = useState(new Map());
  const [workTypeMap, setWorkTypeMap] = useState(new Map());
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => { setAuthSession(d.authenticated ? d : null); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((data) => {
        if (data.tree) setTree(data.tree);
        if (data.aggregates) setAgg(new Map(Object.entries(data.aggregates)));
        if (data.eduTypes) setEduTypes(new Map(Object.entries(data.eduTypes)));
        if (data.expTypes) setExpTypes(new Map(Object.entries(data.expTypes)));
        if (data.workTypes) setWorkTypeMap(new Map(Object.entries(data.workTypes)));
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !open) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {});
    return () => controller.abort();
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setPersona("unemployed");
      setPickedMajor("");
      setPickedUnit(null);
      setQuery("");
      setEducation("");
      setExperience("");
      setEverEmployed(undefined);
      setSelectedTitle(null);
    }
  }, [open]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ck_onboarding");
      if (raw) {
        const data = JSON.parse(raw);
        setPersona(data.persona || "unemployed");
        setPickedMajor(data.pickedMajor || "");
        setPickedUnit(data.pickedUnit || null);
        setQuery(data.query || "");
        setPersisted(true);
        setEducation(data.education || "");
        setExperience(data.experience || "");
        setEverEmployed(data.everEmployed);
        setSelectedTitle(data.selectedTitle || null);
      }
    } catch {}
  }, []);

  const saveState = () => {
    try {
      localStorage.setItem(
        "ck_onboarding",
        JSON.stringify({ persona, pickedMajor, pickedUnit, query, education, experience, everEmployed, selectedTitle })
      );
    } catch {}
  };

  // Save to profile when authenticated
  const saveToProfile = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.authenticated || !session?.candidateId) return;

      const payload = {};
      if (education) payload.educationCode = education;
      if (experience) payload.experienceCode = experience;

      const ciscoCode = pickedUnit?.id || selectedTitle?.ciscoUnit?.id;
      if (ciscoCode) payload.ciscoCodes = [ciscoCode];

      if (Object.keys(payload).length > 0) {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch {}
  };

  const navigateToCareerTracksWithUnit = (unit) => {
    saveState();
    saveToProfile();
    onClose?.();
    onComplete?.({
      persona,
      cisco: unit,
      title: unit?.title || "",
      education,
      experience,
      targetPage: "career-tracks",
      ciscoCode: unit?.id,
      searchQuery: unit?.title,
    });
  };

  const navigateToLiveSearchWithQuery = (q) => {
    saveState();
    saveToProfile();
    onClose?.();
    onComplete?.({
      persona,
      cisco: pickedUnit,
      title: q,
      education,
      experience,
      targetPage: "live-search",
      searchQuery: q,
    });
  };

  if (!open) return null;

  const majors = tree.children || [];
  const majorChildren = pickedMajor
    ? majors.find((m) => m.id === pickedMajor)?.children || []
    : [];

  const sequence = (() => {
    if (persona === "employed") {
      return [
        { id: "persona", label: "You are" },
        { id: "education", label: "Education" },
        { id: "currentJob", label: "Your job" },
        { id: "experience", label: "Experience" },
        { id: "insights", label: "Insights" },
      ];
    }
    if (persona === "unemployed") {
      if (everEmployed) {
        return [
          { id: "persona", label: "You are" },
          { id: "education", label: "Education" },
          { id: "lastJob", label: "Last job" },
          { id: "experience", label: "Experience" },
          { id: "insights", label: "Insights" },
        ];
      }
      return [
        { id: "persona", label: "You are" },
        { id: "education", label: "Education" },
        { id: "ever", label: "History" },
        { id: "search", label: "Search titles" },
        { id: "tax", label: "Explore fields" },
        { id: "insights", label: "Insights" },
      ];
    }
    return [
      { id: "persona", label: "You are" },
      { id: "education", label: "Education" },
      { id: "search", label: "Search titles" },
      { id: "tax", label: "Explore fields" },
      { id: "insights", label: "Insights" },
    ];
  })();

  const safeStep = Math.min(step, sequence.length - 1);
  const next = () => setStep((s) => Math.min(sequence.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const title = selectedTitle?.label || pickedUnit?.title || "";
    saveState();
    navigateToLiveSearchWithQuery(title);
  };

  const currentStepId = sequence[safeStep]?.id;

  const Steps = () => (
    <div
      className="grid gap-2 mb-6"
      style={{ gridTemplateColumns: `repeat(${Math.min(sequence.length, 6)}, 1fr)` }}
    >
      {sequence.map((l, i) => (
        <div
          key={i}
          className={`h-2 rounded-full ${i <= safeStep ? "bg-cyan-400" : "bg-white/10"}`}
          title={l.label}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={{
          backgroundImage:
            "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)",
          backgroundPosition: "0% 50%",
        }}
      />

      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-semibold tracking-tight">
            Build your <span className="text-cyan-300">career plan</span>
          </span>
          <div className="flex items-center gap-3">
            {persisted && (
              <button
                onClick={() => {
                  localStorage.removeItem("ck_onboarding");
                  setPersisted(false);
                  setStep(0);
                  setPersona("unemployed");
                  setPickedMajor("");
                  setPickedUnit(null);
                  setQuery("");
                  setEducation("");
                  setExperience("");
                  setEverEmployed(undefined);
                  setSelectedTitle(null);
                }}
                className="text-neutral-400 hover:text-white text-sm"
              >
                Start again
              </button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Back to home
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <Steps />

            {currentStepId === "persona" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Where are you right now?</h3>
                <p className="text-neutral-400 mb-4">Pick a starting point to tune recommendations.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { id: "unemployed", title: "Unemployed", desc: "Explore broadly across industries" },
                    { id: "student", title: "Student", desc: "See study paths and future roles" },
                    { id: "employed", title: "Employed", desc: "Focus on adjacent roles in your field" },
                  ].map((o) => (
                    <Card
                      key={o.id}
                      onClick={() => {
                        setPersona(o.id);
                        setStep(0);
                        if (o.id === "employed") setEverEmployed(true);
                        else if (o.id === "unemployed") setEverEmployed(undefined);
                      }}
                      className={`cursor-pointer bg-white/5 border ${persona === o.id ? "border-cyan-400/60" : "border-white/10"}`}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium mb-1">{o.title}</div>
                        <p className="text-sm text-neutral-400">{o.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={next} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === "education" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Your highest education</h3>
                <p className="text-neutral-400 mb-4">Pick the closest match.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Array.from(eduTypes.entries()).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setEducation(k)}
                      className={`text-left rounded-xl px-3 py-2 border ${education === k ? "border-cyan-400/60 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={!education} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === "experience" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Your experience level</h3>
                <p className="text-neutral-400 mb-4">For your current or most recent role.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Array.from(expTypes.entries()).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setExperience(k)}
                      className={`text-left rounded-xl px-3 py-2 border ${experience === k ? "border-cyan-400/60 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={!experience} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === "ever" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Have you been employed before?</h3>
                <div className="flex gap-3">
                  <Button variant={everEmployed === true ? "default" : "secondary"} onClick={() => setEverEmployed(true)}>
                    Yes
                  </Button>
                  <Button variant={everEmployed === false ? "default" : "secondary"} onClick={() => setEverEmployed(false)}>
                    No
                  </Button>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={everEmployed === undefined} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {(currentStepId === "search" || currentStepId === "currentJob" || currentStepId === "lastJob") && (
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {currentStepId === "currentJob"
                    ? "Search your current job"
                    : currentStepId === "lastJob"
                    ? "Search your last main job"
                    : "Search related job titles"}
                </h3>
                <p className="text-neutral-400 mb-4">Start typing; we'll suggest titles and link them to CISCO.</p>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Psychiatrist, Compliance Analyst"
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTitle(s);
                        setPickedUnit(s?.ciscoUnit || null);
                        setQuery(s?.label || query);
                      }}
                      className={`text-left rounded-xl px-3 py-2 border ${selectedTitle?.label === s.label ? "border-emerald-400/60 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}
                    >
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-neutral-400">{s.ciscoUnit?.title}</div>
                    </button>
                  ))}
                </div>
                {selectedTitle?.ciscoUnit && (
                  <Card className="bg-white/5 border-white/10 mt-4">
                    <CardContent className="p-4">
                      <div className="text-sm text-neutral-400">Matched CISCO</div>
                      <div className="font-medium">{selectedTitle.ciscoUnit.title}</div>
                      <p className="text-sm text-neutral-300 whitespace-pre-line">{selectedTitle.ciscoUnit.description}</p>
                    </CardContent>
                  </Card>
                )}
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={!selectedTitle} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === "tax" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose a field</h3>
                <p className="text-neutral-400 mb-4">Drill into the CISCO taxonomy.</p>
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 space-y-2 max-h-[240px] md:max-h-[360px] overflow-auto pr-2">
                    {majors.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPickedMajor(m.id)}
                        className={`w-full text-left rounded-xl px-3 py-2 text-sm ${pickedMajor === m.id ? "bg-cyan-400/15 text-cyan-200" : "bg-white/5 text-neutral-200"}`}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                  <div className="md:col-span-7">
                    <div className="grid sm:grid-cols-2 gap-3 max-h-[360px] overflow-auto">
                      {majorChildren
                        .flatMap((sub) => sub.children || [])
                        .flatMap((min) => min.children || [])
                        .map((u) => (
                          <Card
                            key={u.id}
                            onClick={() => {
                              setPickedUnit(u);
                              setSelectedTitle(null);
                            }}
                            className={`cursor-pointer bg-white/5 border ${pickedUnit?.id === u.id ? "border-emerald-400/60" : "border-white/10"}`}
                          >
                            <CardContent className="p-4">
                              <div className="font-medium mb-1">{u.title}</div>
                              <p className="text-xs text-neutral-400 line-clamp-3">{u.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={!pickedUnit} className="gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStepId === "insights" && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Your match</h3>
                <p className="text-neutral-400 mb-4">Review details, then see live jobs.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 space-y-2">
                      <div className="text-sm text-neutral-400">CISCO unit</div>
                      <div className="font-medium text-lg">{pickedUnit?.title || "—"}</div>
                      <p className="text-sm text-neutral-300 whitespace-pre-line">{pickedUnit?.description}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="text-sm text-neutral-400 mb-2">Historic opportunity snapshot</div>
                      {pickedUnit && agg.get(String(pickedUnit.id)) ? (
                        <div className="space-y-1 text-sm">
                          <div><Badge className="bg-neutral-800 border-white/10 mr-2">Posts</Badge>{agg.get(String(pickedUnit.id)).count}</div>
                          <div><Badge className="bg-neutral-800 border-white/10 mr-2">Min</Badge>CI$ {Math.round(agg.get(String(pickedUnit.id)).min).toLocaleString()}</div>
                          <div><Badge className="bg-neutral-800 border-white/10 mr-2">Mean</Badge>CI$ {Math.round(agg.get(String(pickedUnit.id)).mean).toLocaleString()}</div>
                          <div><Badge className="bg-neutral-800 border-white/10 mr-2">Max</Badge>CI$ {Math.round(agg.get(String(pickedUnit.id)).max).toLocaleString()}</div>
                        </div>
                      ) : (
                        <div className="text-neutral-400 text-sm">No historic data for this unit.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Auth prompt for unauthenticated users */}
                {authChecked && !authSession && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-300/20">
                    <div className="text-sm font-medium mb-1">Save your interests and get matched?</div>
                    <p className="text-xs text-neutral-400 mb-3">Sign in free to create your profile and get introduced to employers looking for {pickedUnit?.title || "your skills"}.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href="/api/auth/google?type=candidate"
                        onClick={saveState}
                        className="flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-white text-neutral-900 text-xs font-medium hover:bg-neutral-100 transition flex-1"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Sign in with Google
                      </a>
                      <a
                        href="/api/auth/linkedin?type=candidate"
                        onClick={saveState}
                        className="flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-white text-xs font-medium hover:opacity-90 transition flex-1"
                        style={{ backgroundColor: "#0A66C2" }}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        Sign in with LinkedIn
                      </a>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={prev} className="gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                  <div className="flex gap-2">
                    {pickedUnit && (
                      <Button variant="secondary" onClick={() => navigateToCareerTracksWithUnit(pickedUnit)} className="gap-2">
                        Explore fields
                      </Button>
                    )}
                    <Button onClick={finish} className="gap-2">
                      See live jobs <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
