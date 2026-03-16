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
                  <div className="md:col-span-5 space-y-2 max-h-[360px] overflow-auto pr-2">
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
