"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, User, BookOpen, MapPin, Shield, Eye, Star, Briefcase, Search, X, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const STEPS = ["Welcome", "About You", "Background", "Career Interests", "Skills", "Preferences"];

export default function ProfileSetupClient({ candidate, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
  const router = useRouter();
  const eduTypes = useMemo(() => Object.entries(etObj), [etObj]);
  const expTypes = useMemo(() => Object.entries(exObj), [exObj]);
  const locTypes = useMemo(() => Object.entries(ltObj), [ltObj]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: candidate.name || "",
    isCaymanian: candidate.is_caymanian || false,
    bio: candidate.bio || "",
    educationCode: candidate.education_code || "",
    experienceCode: candidate.experience_code || "",
    locationCode: candidate.location_code || "",
    availability: candidate.availability || "actively_looking",
    isDiscoverable: false,
  });

  // CISCO interests
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestQuery, setInterestQuery] = useState("");
  const [interestSuggestions, setInterestSuggestions] = useState([]);

  // Skills
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [suggestedSkills, setSuggestedSkills] = useState([]);

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

  // Search skills
  useEffect(() => {
    if (!skillQuery.trim()) { setSkillSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/skills/search?q=${encodeURIComponent(skillQuery)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        const existing = new Set(selectedSkills.map(s => s.id));
        setSkillSuggestions((d.skills || []).filter(s => !existing.has(s.id)));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [skillQuery]);

  // Suggest skills from selected interests
  useEffect(() => {
    if (selectedInterests.length === 0) { setSuggestedSkills([]); return; }
    const existingIds = new Set(selectedSkills.map(s => s.id));
    Promise.all(selectedInterests.map(i =>
      fetch(`/api/skills/search?ciscoCode=${i.ciscoCode}`).then(r => r.json()).catch(() => ({ skills: [] }))
    )).then(results => {
      const seen = new Set();
      const suggested = [];
      for (const r of results) {
        for (const s of (r.skills || [])) {
          if (!seen.has(s.id) && !existingIds.has(s.id)) {
            seen.add(s.id);
            suggested.push(s);
          }
        }
      }
      setSuggestedSkills(suggested.slice(0, 15));
    });
  }, [selectedInterests]);

  const addInterest = (suggestion) => {
    const code = suggestion.ciscoUnit?.id;
    if (!code || selectedInterests.some(i => i.ciscoCode === code)) return;
    if (selectedInterests.length >= 5) return;
    setSelectedInterests([...selectedInterests, { ciscoCode: code, title: suggestion.ciscoUnit.title }]);
    setInterestQuery("");
    setInterestSuggestions([]);
  };

  const addSkill = (skill) => {
    if (selectedSkills.some(s => s.id === skill.id)) return;
    setSelectedSkills([...selectedSkills, { id: skill.id, name: skill.name }]);
    setSkillQuery("");
    setSkillSuggestions([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ciscoCodes: selectedInterests.map(i => i.ciscoCode),
          skillIds: selectedSkills.map(s => s.id),
        }),
      });
      if (res.ok) router.push("/profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-xl px-4 sm:px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-medium ${i <= step ? "bg-cyan-500 text-white" : "bg-white/10 text-neutral-400"}`}>{i + 1}</div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-cyan-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 grid place-items-center mx-auto"><User className="w-8 h-8 text-cyan-300" /></div>
              <h2 className="text-2xl font-semibold">Welcome to careers.ky</h2>
              <p className="text-neutral-300 max-w-sm mx-auto">Let's set up your talent profile. This helps match you with Cayman employers looking for local talent.</p>
              <Button onClick={() => setStep(1)} className="gap-2">Get Started <ChevronRight className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: About You */}
        {step === 1 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">About You</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" className="bg-white/5 border-white/10" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Brief Bio (optional)</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="A few words about yourself..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200" />
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input type="checkbox" checked={form.isCaymanian} onChange={(e) => setForm({ ...form, isCaymanian: e.target.checked })} className="rounded" />
                <div>
                  <div className="flex items-center gap-2 font-medium"><Shield className="w-4 h-4 text-cyan-300" /> I am Caymanian</div>
                  <div className="text-xs text-neutral-400 mt-1">This helps employers meet local hiring requirements</div>
                </div>
              </label>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setStep(0)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={!form.name} className="gap-2 flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Your Background</h2>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2"><BookOpen className="w-4 h-4" /> Education Level</label>
                <select value={form.educationCode} onChange={(e) => setForm({ ...form, educationCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                  <option value="">Select education level...</option>
                  {eduTypes.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Experience Level</label>
                <select value={form.experienceCode} onChange={(e) => setForm({ ...form, experienceCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                  <option value="">Select experience level...</option>
                  {expTypes.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</label>
                <select value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                  <option value="">Select location...</option>
                  {locTypes.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(3)} className="gap-2 flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Career Interests */}
        {step === 3 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2"><Star className="w-6 h-6 text-cyan-300" /> Career Interests</h2>
              <p className="text-neutral-300 text-sm">Search for job titles to find matching career categories. Select 1-5 interests.</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={interestQuery}
                  onChange={(e) => setInterestQuery(e.target.value)}
                  placeholder="Search job titles (e.g. Accountant, Nurse, Developer)"
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>

              {interestSuggestions.length > 0 && (
                <div className="grid gap-2">
                  {interestSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addInterest(s)}
                      className="text-left rounded-xl px-3 py-2 border border-white/10 bg-white/5 hover:border-cyan-300/40 transition"
                    >
                      <div className="font-medium text-sm">{s.ciscoUnit?.title}</div>
                      <div className="text-xs text-neutral-400">{s.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedInterests.length > 0 && (
                <div>
                  <div className="text-sm text-neutral-400 mb-2">Selected ({selectedInterests.length}/5)</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(i => (
                      <Badge key={i.ciscoCode} className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30 pr-1 flex items-center gap-1">
                        {i.title}
                        <button onClick={() => setSelectedInterests(selectedInterests.filter(x => x.ciscoCode !== i.ciscoCode))} className="ml-1 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setStep(2)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(4)} className="gap-2 flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Skills */}
        {step === 4 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2"><Briefcase className="w-6 h-6 text-purple-300" /> Skills</h2>
              <p className="text-neutral-300 text-sm">Add skills from suggestions or search for specific ones.</p>

              {suggestedSkills.length > 0 && (
                <div>
                  <div className="text-sm text-neutral-400 mb-2">Suggested based on your interests</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map(s => (
                      <button key={s.id} onClick={() => addSkill(s)}>
                        <Badge className="bg-emerald-500/10 border-emerald-300/20 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer">
                          <Plus className="w-3 h-3 mr-1" /> {s.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  placeholder="Search for more skills..."
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>

              {skillSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.map(s => (
                    <button key={s.id} onClick={() => addSkill(s)}>
                      <Badge className="bg-white/5 border-white/10 text-neutral-300 hover:border-purple-300/40 cursor-pointer">
                        <Plus className="w-3 h-3 mr-1" /> {s.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {selectedSkills.length > 0 && (
                <div>
                  <div className="text-sm text-neutral-400 mb-2">Your skills ({selectedSkills.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(s => (
                      <Badge key={s.id} className="bg-purple-500/20 text-purple-300 border-purple-300/30 pr-1 flex items-center gap-1">
                        {s.name}
                        <button onClick={() => setSelectedSkills(selectedSkills.filter(x => x.id !== s.id))} className="ml-1 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setStep(3)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(5)} className="gap-2 flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Preferences */}
        {step === 5 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold">Your Preferences</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                  <option value="actively_looking">Actively Looking</option>
                  <option value="open_to_offers">Open to Offers</option>
                  <option value="not_looking">Not Looking</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input type="checkbox" checked={form.isDiscoverable} onChange={(e) => setForm({ ...form, isDiscoverable: e.target.checked })} className="rounded" />
                <div>
                  <div className="flex items-center gap-2 font-medium"><Eye className="w-4 h-4 text-emerald-300" /> Make me discoverable</div>
                  <div className="text-xs text-neutral-400 mt-1">Employers can see an anonymized profile and request an introduction. Your name and email stay hidden until you accept.</div>
                </div>
              </label>
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setStep(4)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">{saving ? "Saving..." : "Complete Setup"}</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
