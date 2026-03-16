"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  User, BookOpen, Clock, MapPin, Eye, EyeOff, Bell, Shield,
  CheckCircle, Edit3, LogOut, Briefcase, Star, ChevronRight,
  X, Plus, Search,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const AVAILABILITY_OPTIONS = [
  { value: "actively_looking", label: "Actively Looking", color: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30" },
  { value: "open_to_offers", label: "Open to Offers", color: "bg-cyan-500/20 text-cyan-300 border-cyan-300/30" },
  { value: "not_looking", label: "Not Looking", color: "bg-neutral-500/20 text-neutral-300 border-neutral-300/30" },
];

export default function ProfileClient({ candidate, interests, skills, notifications, unreadCount, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
  const router = useRouter();
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: candidate.name || "",
    isCaymanian: candidate.is_caymanian || false,
    availability: candidate.availability || "actively_looking",
    isDiscoverable: candidate.is_discoverable || false,
    bio: candidate.bio || "",
    educationCode: candidate.education_code || "",
    experienceCode: candidate.experience_code || "",
    locationCode: candidate.location_code || "",
  });

  // Editable interests
  const [editInterests, setEditInterests] = useState(interests.map(i => ({ ciscoCode: i.cisco_code, title: i.title || i.cisco_code })));
  const [showInterestSearch, setShowInterestSearch] = useState(false);
  const [interestQuery, setInterestQuery] = useState("");
  const [interestSuggestions, setInterestSuggestions] = useState([]);

  // Editable skills
  const [editSkills, setEditSkills] = useState(skills.map(s => ({ id: s.id, name: s.name })));
  const [showSkillSearch, setShowSkillSearch] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [suggestedSkills, setSuggestedSkills] = useState([]);

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsLoaded, setAlertsLoaded] = useState(false);

  const availOption = AVAILABILITY_OPTIONS.find(o => o.value === (editing ? form.availability : candidate.availability));

  // Search interests
  useEffect(() => {
    if (!interestQuery.trim()) { setInterestSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(interestQuery)}&limit=8`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        const seen = new Set(editInterests.map(i => i.ciscoCode));
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
        const existing = new Set(editSkills.map(s => s.id));
        setSkillSuggestions((d.skills || []).filter(s => !existing.has(s.id)));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [skillQuery]);

  // Load suggested skills based on interests
  useEffect(() => {
    if (editInterests.length === 0) { setSuggestedSkills([]); return; }
    const existingIds = new Set(editSkills.map(s => s.id));
    Promise.all(editInterests.map(i =>
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
      setSuggestedSkills(suggested.slice(0, 12));
    });
  }, [editInterests]);

  // Load alerts
  useEffect(() => {
    fetch("/api/alerts").then(r => r.json()).then(d => {
      setAlerts(d.alerts || []);
      setAlertsLoaded(true);
    }).catch(() => setAlertsLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ciscoCodes: editInterests.map(i => i.ciscoCode),
          skillIds: editSkills.map(s => s.id),
        }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const addInterest = (suggestion) => {
    const code = suggestion.ciscoUnit?.id;
    if (!code || editInterests.some(i => i.ciscoCode === code)) return;
    setEditInterests([...editInterests, { ciscoCode: code, title: suggestion.ciscoUnit.title }]);
    setInterestQuery("");
    setInterestSuggestions([]);
  };

  const removeInterest = (code) => {
    setEditInterests(editInterests.filter(i => i.ciscoCode !== code));
  };

  const addSkill = (skill) => {
    if (editSkills.some(s => s.id === skill.id)) return;
    setEditSkills([...editSkills, { id: skill.id, name: skill.name }]);
    setSkillQuery("");
    setSkillSuggestions([]);
  };

  const removeSkill = (id) => {
    setEditSkills(editSkills.filter(s => s.id !== id));
  };

  const handleCreateAlert = async () => {
    const filters = {
      ciscoCodes: editInterests.map(i => i.ciscoCode),
      educationCode: candidate.education_code,
      locationCode: candidate.location_code,
    };
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters, frequency: "daily" }),
    });
    if (res.ok) {
      const d = await res.json();
      setAlerts([...alerts, d.alert]);
    }
  };

  const handleDeleteAlert = async (id) => {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleToggleFrequency = async (alert) => {
    const newFreq = alert.frequency === "daily" ? "weekly" : "daily";
    // Delete and recreate with new frequency
    await handleDeleteAlert(alert.id);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: alert.filters, frequency: newFreq }),
    });
    if (res.ok) {
      const d = await res.json();
      setAlerts(prev => [...prev.filter(a => a.id !== alert.id), d.alert]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", backgroundPosition: "0% 50%" }} />

      <Navigation />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">My Profile</h1>
            <p className="text-neutral-400">{candidate.email}</p>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <Button variant="secondary" onClick={() => setEditing(true)} className="gap-2"><Edit3 className="w-4 h-4" /> Edit</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2"><CheckCircle className="w-4 h-4" /> {saving ? "Saving..." : "Save"}</Button>
              </>
            )}
            <Link href="/notifications">
              <Button variant="secondary" className="gap-2 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-xs grid place-items-center">{unreadCount}</span>}
              </Button>
            </Link>
            <Button variant="secondary" onClick={handleLogout} className="gap-2"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5" /> Basic Information</h2>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Full Name</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bio</label>
                      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200" placeholder="Brief intro about yourself..." />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isCaymanian} onChange={(e) => setForm({ ...form, isCaymanian: e.target.checked })} className="rounded" />
                      <span className="text-sm">I am Caymanian</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 grid place-items-center"><User className="w-6 h-6 text-neutral-400" /></div>
                      <div>
                        <div className="font-medium text-lg">{candidate.name || "Name not set"}</div>
                        <div className="flex gap-2">
                          {candidate.is_caymanian && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                        </div>
                      </div>
                    </div>
                    {candidate.bio && <p className="text-neutral-300 text-sm">{candidate.bio}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5" /> Professional Details</h2>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Education</label>
                      <select value={form.educationCode} onChange={(e) => setForm({ ...form, educationCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Select...</option>
                        {Array.from(eduTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Experience</label>
                      <select value={form.experienceCode} onChange={(e) => setForm({ ...form, experienceCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Select...</option>
                        {Array.from(expTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <select value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        <option value="">Select...</option>
                        {Array.from(locTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-300" /><span className="text-sm">{eduTypes.get(candidate.education_code) || "Not set"}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-300" /><span className="text-sm">{expTypes.get(candidate.experience_code) || "Not set"}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-pink-300" /><span className="text-sm">{locTypes.get(candidate.location_code) || "Not set"}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Career Interests */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2"><Star className="w-5 h-5" /> Career Interests</h2>
                  {editing && (
                    <Button variant="secondary" size="sm" onClick={() => setShowInterestSearch(!showInterestSearch)} className="gap-1">
                      <Plus className="w-3 h-3" /> Add Interest
                    </Button>
                  )}
                </div>

                {editing && showInterestSearch && (
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        value={interestQuery}
                        onChange={(e) => setInterestQuery(e.target.value)}
                        placeholder="Search job titles to find CISCO codes..."
                        className="pl-10 bg-white/5 border-white/10"
                        autoFocus
                      />
                    </div>
                    {interestSuggestions.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2">
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
                  </div>
                )}

                {editInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editInterests.map((i) => (
                      <div key={i.ciscoCode} className="flex items-center gap-1">
                        <Link href={`/job/${i.ciscoCode}`}>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30 cursor-pointer hover:bg-cyan-500/30">
                            {i.title || i.ciscoCode}
                          </Badge>
                        </Link>
                        {editing && (
                          <button onClick={() => removeInterest(i.ciscoCode)} className="text-neutral-400 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm">No career interests set. {editing ? "Click 'Add Interest' above to search." : <Link href="/career-tracks" className="text-cyan-300 hover:underline">Explore Career Tracks</Link>}</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5" /> Skills</h2>
                  {editing && (
                    <Button variant="secondary" size="sm" onClick={() => setShowSkillSearch(!showSkillSearch)} className="gap-1">
                      <Plus className="w-3 h-3" /> Add Skill
                    </Button>
                  )}
                </div>

                {editing && showSkillSearch && (
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search skills..."
                        className="pl-10 bg-white/5 border-white/10"
                        autoFocus
                      />
                    </div>
                    {skillSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skillSuggestions.map((s) => (
                          <button key={s.id} onClick={() => addSkill(s)}>
                            <Badge className="bg-white/5 border-white/10 text-neutral-300 hover:border-purple-300/40 cursor-pointer">
                              <Plus className="w-3 h-3 mr-1" /> {s.name}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {editing && suggestedSkills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-neutral-400 mb-2">Suggested based on your interests</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((s) => (
                        <button key={s.id} onClick={() => addSkill(s)}>
                          <Badge className="bg-emerald-500/10 border-emerald-300/20 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer">
                            <Plus className="w-3 h-3 mr-1" /> {s.name}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editSkills.map((s) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">{s.name}</Badge>
                        {editing && (
                          <button onClick={() => removeSkill(s.id)} className="text-neutral-400 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm">No skills added yet. {editing ? "Click 'Add Skill' above or pick from suggestions." : "Skills will be suggested based on your career interests."}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability & Visibility */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Availability</label>
                      <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-neutral-200">
                        {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isDiscoverable} onChange={(e) => setForm({ ...form, isDiscoverable: e.target.checked })} className="rounded" />
                      <span className="text-sm">Visible to employers</span>
                    </label>
                    <p className="text-xs text-neutral-500">When discoverable, employers can see an anonymized version of your profile and request an introduction.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Badge className={availOption?.color}>{availOption?.label || "Not set"}</Badge>
                    <div className="flex items-center gap-2 text-sm">
                      {candidate.is_discoverable ? (
                        <><Eye className="w-4 h-4 text-emerald-300" /><span className="text-emerald-300">Visible to employers</span></>
                      ) : (
                        <><EyeOff className="w-4 h-4 text-neutral-400" /><span className="text-neutral-400">Hidden from employers</span></>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Alerts */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5" /> Job Alerts</h3>
                </div>
                {alertsLoaded && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map(a => (
                      <div key={a.id} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30 text-xs">{a.frequency}</Badge>
                          <button onClick={() => handleDeleteAlert(a.id)} className="text-neutral-400 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {a.filters?.ciscoCodes?.length ? `${a.filters.ciscoCodes.length} interest(s)` : "All interests"}
                        </div>
                        <button
                          onClick={() => handleToggleFrequency(a)}
                          className="text-xs text-cyan-300 hover:underline"
                        >
                          Switch to {a.frequency === "daily" ? "weekly" : "daily"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : alertsLoaded ? (
                  <p className="text-neutral-400 text-sm mb-3">No active alerts.</p>
                ) : null}
                <Button variant="secondary" size="sm" onClick={handleCreateAlert} className="gap-1 w-full mt-3">
                  <Plus className="w-3 h-3" /> Create Alert
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  {unreadCount > 0 && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30">{unreadCount} new</Badge>}
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? "bg-white/5 border-white/10" : "bg-cyan-500/10 border-cyan-300/20"}`}>
                        <div className="text-sm font-medium">{n.title}</div>
                        {n.body && <div className="text-xs text-neutral-400 mt-1">{n.body}</div>}
                      </div>
                    ))}
                    <Link href="/notifications" className="text-sm text-cyan-300 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm">No notifications yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
