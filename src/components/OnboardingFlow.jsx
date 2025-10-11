import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { buildCiscoTree, loadAggregates, searchTitles, loadWorkTypes, loadEducationTypes, loadExperienceTypes, titleSuggestions, clearCache } from "@/lib/data";

export default function OnboardingFlow({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState("unemployed"); // unemployed | student | employed
  const [pickedMajor, setPickedMajor] = useState("");
  const [pickedUnit, setPickedUnit] = useState(null); // CISCO unit node
  const [query, setQuery] = useState("");
  const [persisted, setPersisted] = useState(false);
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [everEmployed, setEverEmployed] = useState(undefined); // undefined | true | false
  const [selectedTitle, setSelectedTitle] = useState(null); // {label, sCISCO, ciscoUnit}

  const tree = useMemo(() => buildCiscoTree(), []);
  const agg = useMemo(() => loadAggregates(), []);

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
    } else {
      // Clear cache when opening to ensure fresh data
      clearCache();
    }
  }, [open]);

  // Load from localStorage once
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
      const data = { persona, pickedMajor, pickedUnit, query, education, experience, everEmployed, selectedTitle };
      localStorage.setItem("ck_onboarding", JSON.stringify(data));
    } catch {}
  };

  if (!open) return null;

  const majors = tree.children || [];
  const majorChildren = pickedMajor ? majors.find((m) => m.id === pickedMajor)?.children || [] : [];
  const flattenedUnits = useMemo(() => {
    const out = [];
    for (const maj of majors) for (const sub of maj.children || []) for (const min of sub.children || []) for (const u of min.children || []) out.push(u);
    return out;
  }, [majors]);

  const titleResults = useMemo(() => searchTitles(query, 10), [query]);
  const titleSuggests = useMemo(() => titleSuggestions(query, 10), [query]);

  const sequence = useMemo(() => {
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
    // student track
    return [
      { id: "persona", label: "You are" },
      { id: "education", label: "Education" },
      { id: "search", label: "Search titles" },
      { id: "tax", label: "Explore fields" },
      { id: "insights", label: "Insights" },
    ];
  }, [persona, everEmployed]);

  // Reset step when sequence changes to prevent out-of-bounds
  useEffect(() => {
    if (step >= sequence.length) {
      setStep(Math.max(0, sequence.length - 1));
    }
  }, [sequence, step]);

  const next = () => setStep((s) => Math.min(sequence.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const title = selectedTitle?.label || pickedUnit?.title || titleResults?.[0]?.cTitle || "";
    const payload = {
      persona,
      cisco: pickedUnit,
      title,
      education,
      experience,
    };
    saveState();
    onComplete?.(payload);
    onClose?.();
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Dynamic background - same as main page */}
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight">Build your <span className="text-cyan-300">career plan</span></span>
          </div>
          <div className="flex items-center gap-3">
            {persisted && (
              <button onClick={() => { localStorage.removeItem("ck_onboarding"); setPersisted(false); setStep(0); setPersona("unemployed"); setPickedMajor(""); setPickedUnit(null); setQuery(""); }} className="text-neutral-400 hover:text-white text-sm">Start again</button>
            )}
            <Button variant="secondary" onClick={onClose}>Back to home</Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <Steps step={step} labels={sequence.map((s) => s.label)} />

            {sequence[step]?.id === "persona" && (
              <PersonaStep value={persona} onChange={(v) => { 
                setPersona(v); 
                setStep(0); // Reset to first step when persona changes
                if (v === "employed") {
                  setEverEmployed(true);
                } else if (v === "unemployed") {
                  setEverEmployed(undefined); // Reset for unemployed flow
                }
              }} onNext={next} />
            )}

            {sequence[step]?.id === "education" && (
              <EducationStep value={education} onChange={setEducation} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "experience" && (
              <ExperienceStep value={experience} onChange={setExperience} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "ever" && (
              <EverEmployedStep value={everEmployed} onChange={(v) => {
                setEverEmployed(v);
                // Reset to step 0 when everEmployed changes to ensure proper flow
                setTimeout(() => setStep(0), 0);
              }} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "tax" && (
              <TaxonomyStep majors={majors} pickedMajor={pickedMajor} onPickMajor={setPickedMajor} units={majorChildren} onPickUnit={(u) => { setPickedUnit(u); setSelectedTitle(null); }} pickedUnit={pickedUnit} onNext={next} onBack={prev} />
            )}

            {sequence[step]?.id === "search" && (
              <SearchStep query={query} onQuery={setQuery} titleResults={titleResults} onPickTitle={(t) => { setQuery(t.cTitle); setSelectedTitle(null); }} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "currentJob" && (
              <CurrentJobStep query={query} onQuery={setQuery} suggestions={titleSuggests} selected={selectedTitle} onSelect={(s) => { setSelectedTitle(s); setPickedUnit(s?.ciscoUnit || null); }} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "lastJob" && (
              <CurrentJobStep heading="Search your last main job" query={query} onQuery={setQuery} suggestions={titleSuggests} selected={selectedTitle} onSelect={(s) => { setSelectedTitle(s); setPickedUnit(s?.ciscoUnit || null); }} onBack={prev} onNext={next} />
            )}

            {sequence[step]?.id === "insights" && (
              <InsightsStep pickedUnit={pickedUnit} aggregates={agg} allUnits={flattenedUnits} query={query} onBack={prev} onFinish={finish} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Steps({ step, labels }) {
  const items = labels?.length ? labels : ["You are", "Explore fields", "Search titles", "Insights"];
  const cols = Math.min(items.length, 6); // Max 6 columns for readability
  return (
    <div className={`grid gap-2 mb-6`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map((l, i) => (
        <div key={i} className={`h-2 rounded-full ${i <= step ? "bg-cyan-400" : "bg-white/10"}`} title={l} />
      ))}
    </div>
  );
}

function PersonaStep({ value, onChange, onNext }) {
  const options = [
    { id: "unemployed", title: "Unemployed", desc: "Explore broadly across industries" },
    { id: "student", title: "Student", desc: "See study paths and future roles" },
    { id: "employed", title: "Employed", desc: "Focus on adjacent roles in your field" },
  ];
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Where are you right now?</h3>
      <p className="text-neutral-400 mb-4">Pick a starting point to tune recommendations.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <Card key={o.id} onClick={() => onChange(o.id)} className={`cursor-pointer bg-white/5 border ${value === o.id ? "border-cyan-400/60" : "border-white/10"}`}>
            <CardContent className="p-4">
              <div className="font-medium mb-1">{o.title}</div>
              <p className="text-sm text-neutral-400">{o.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function EducationStep({ value, onChange, onBack, onNext }) {
  const eduMap = loadEducationTypes();
  const options = Array.from(eduMap.entries());
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Your highest education</h3>
      <p className="text-neutral-400 mb-4">Pick the closest match.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map(([k, v]) => (
          <button key={k} onClick={() => onChange(k)} className={`text-left rounded-xl px-3 py-2 border ${value === k ? "border-cyan-400/60 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}>{v}</button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!value} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function ExperienceStep({ value, onChange, onBack, onNext }) {
  const expMap = loadExperienceTypes();
  const options = Array.from(expMap.entries());
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Your experience level</h3>
      <p className="text-neutral-400 mb-4">For your current or most recent role.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map(([k, v]) => (
          <button key={k} onClick={() => onChange(k)} className={`text-left rounded-xl px-3 py-2 border ${value === k ? "border-cyan-400/60 bg-cyan-300/10" : "border-white/10 bg-white/5"}`}>{v}</button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!value} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function EverEmployedStep({ value, onChange, onBack, onNext }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Have you been employed before?</h3>
      <div className="flex gap-3">
        <Button variant={value === true ? "default" : "secondary"} onClick={() => onChange(true)}>Yes</Button>
        <Button variant={value === false ? "default" : "secondary"} onClick={() => onChange(false)}>No</Button>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={value === undefined} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function CurrentJobStep({ heading = "Search your current job", query, onQuery, suggestions, selected, onSelect, onBack, onNext }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">{heading}</h3>
      <p className="text-neutral-400 mb-4">Start typing; we'll suggest titles and link them to CISCO.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="e.g. Keyboard Operator, General Clerk" className="pl-10 bg-white/5 border-white/10" />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => onSelect(s)} className={`text-left rounded-xl px-3 py-2 border ${selected?.label === s.label ? "border-emerald-400/60 bg-emerald-300/10" : "border-white/10 bg-white/5"}`}>
            <div className="font-medium">{s.label}</div>
            <div className="text-xs text-neutral-400">{s.ciscoUnit?.title}</div>
          </button>
        ))}
      </div>
      {selected?.ciscoUnit && (
        <Card className="bg-white/5 border-white/10 mt-4">
          <CardContent className="p-4">
            <div className="text-sm text-neutral-400">Matched CISCO</div>
            <div className="font-medium">{selected.ciscoUnit.title}</div>
            <p className="text-sm text-neutral-300 whitespace-pre-line">{selected.ciscoUnit.description}</p>
            {selected.ciscoUnit.tasks && <details className="text-sm text-neutral-400"><summary className="cursor-pointer">Tasks</summary><div className="mt-1 whitespace-pre-line">{selected.ciscoUnit.tasks}</div></details>}
          </CardContent>
        </Card>
      )}
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!selected} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function TaxonomyStep({ majors, pickedMajor, onPickMajor, units, pickedUnit, onPickUnit, onBack, onNext }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Choose a field</h3>
      <p className="text-neutral-400 mb-4">Drill into the CISCO taxonomy.</p>
      <div className="grid md:grid-cols-12 gap-4">
        <div className="md:col-span-5 space-y-2 max-h-[360px] overflow-auto pr-2">
          {majors.map((m) => (
            <button key={m.id} onClick={() => onPickMajor(m.id)} className={`w-full text-left rounded-xl px-3 py-2 text-sm ${pickedMajor === m.id ? "bg-cyan-400/15 text-cyan-200" : "bg-white/5 text-neutral-200"}`}>{m.title}</button>
          ))}
        </div>
        <div className="md:col-span-7">
          <div className="grid sm:grid-cols-2 gap-3 max-h-[360px] overflow-auto">
            {units.flatMap((sub) => sub.children || []).flatMap((min) => min.children || []).map((u) => (
              <Card key={u.id} onClick={() => onPickUnit(u)} className={`cursor-pointer bg-white/5 border ${pickedUnit?.id === u.id ? "border-emerald-400/60" : "border-white/10"}`}>
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
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!pickedUnit} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function SearchStep({ query, onQuery, titleResults, onPickTitle, onBack, onNext }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Search related job titles</h3>
      <p className="text-neutral-400 mb-4">We’ll auto-suggest titles mapped to occupations.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="e.g. Psychiatrist, Compliance Analyst" className="pl-10 bg-white/5 border-white/10" />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {titleResults.map((t, i) => (
          <button key={i} onClick={() => onPickTitle(t)} className="text-left rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-neutral-200 hover:bg-white/10">{t.cTitle}</button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} className="gap-2">Next <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function InsightsStep({ pickedUnit, aggregates, allUnits, query, onBack, onFinish }) {
  const stats = pickedUnit ? aggregates.get(String(pickedUnit.id)) : null;
  const workTypes = loadWorkTypes();
  const eduTypes = loadEducationTypes();
  const expTypes = loadExperienceTypes();
  const Bar = ({ label, value, total }) => (
    <div className="flex items-center gap-2">
      <div className="w-40 text-xs text-neutral-300 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-cyan-400" style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-10 text-xs text-neutral-400 text-right">{Math.round((value / Math.max(1, total)) * 100)}%</div>
    </div>
  );
  const Bars = ({ entries }) => {
    const total = entries.reduce((a, [, v]) => a + v, 0);
    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <Bar key={k} label={k} value={v} total={total} />
        ))}
      </div>
    );
  };
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Your match</h3>
      <p className="text-neutral-400 mb-4">Review details, then see live jobs.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 space-y-2">
            <div className="text-sm text-neutral-400">CISCO unit</div>
            <div className="font-medium text-lg">{pickedUnit?.title || "—"}</div>
            <p className="text-sm text-neutral-300 whitespace-pre-line">{pickedUnit?.description}</p>
            {pickedUnit?.tasks && <details className="text-sm text-neutral-400"><summary className="cursor-pointer">Tasks</summary><div className="mt-1 whitespace-pre-line">{pickedUnit.tasks}</div></details>}
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-neutral-400 mb-2">Historic opportunity snapshot</div>
            {stats ? (
              <div className="space-y-1 text-sm">
                <div><Badge className="bg-neutral-800 border-white/10 mr-2">Posts</Badge>{stats.count}</div>
                <div><Badge className="bg-neutral-800 border-white/10 mr-2">Min</Badge>CI$ {Math.round(stats.min).toLocaleString()}</div>
                <div><Badge className="bg-neutral-800 border-white/10 mr-2">Mean</Badge>CI$ {Math.round(stats.mean).toLocaleString()}</div>
                <div><Badge className="bg-neutral-800 border-white/10 mr-2">Max</Badge>CI$ {Math.round(stats.max).toLocaleString()}</div>
                {stats?.dist && (
                  <div className="pt-3 space-y-2">
                    <div className="text-xs text-neutral-400">Work type mix</div>
                    <Bars entries={Object.entries(stats.dist.work).map(([k, v]) => [workTypes.get(String(k)) || k, v])} />
                    <div className="text-xs text-neutral-400">Education level</div>
                    <Bars entries={Object.entries(stats.dist.edu).map(([k, v]) => [eduTypes.get(String(k)) || k, v])} />
                    <div className="text-xs text-neutral-400">Experience level</div>
                    <Bars entries={Object.entries(stats.dist.exp).map(([k, v]) => [expTypes.get(String(k)) || k, v])} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">No historic data for this unit.</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onFinish} className="gap-2">See live jobs <ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}


