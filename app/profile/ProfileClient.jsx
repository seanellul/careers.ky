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
  X, Plus, Search, Send, Loader2, Globe, Phone, Linkedin,
  ArrowUpRight, Hash, Building2,
} from "lucide-react";

const AVAILABILITY_OPTIONS = [
  { value: "actively_looking", label: "Actively Looking", color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" },
  { value: "open_to_offers", label: "Open to Offers", color: "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30" },
  { value: "not_looking", label: "Not Looking", color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700" },
];

const INDUSTRY_OPTIONS = [
  "Accounting & Finance", "Banking", "Construction", "Education", "Government",
  "Healthcare", "Hospitality & Tourism", "Insurance", "IT & Technology", "Legal",
  "Maritime", "Real Estate", "Retail", "Telecommunications", "Other",
];

import { calcProfileStrength } from "@/lib/profileStrength";
import t from "@/lib/theme";

function ProfilePicture({ url, name, size = "lg", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.[0]?.toUpperCase() || "?";
  const sizeClasses = size === "lg" ? "w-24 h-24 text-3xl" : size === "md" ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm";

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name || "Profile"}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 ${className}`}
      />
    );
  }
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-primary-200 to-purple-200 dark:from-primary-500/30 dark:to-purple-500/30 grid place-items-center font-semibold text-primary-600 dark:text-primary-300 border-2 border-neutral-200 dark:border-neutral-700 ${className}`}>
      {initial}
    </div>
  );
}

export default function ProfileClient({ candidate, interests, skills, notifications, unreadCount, pendingIntroCount = 0, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
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
    salaryMin: candidate.salary_min || "",
    workTypePreferences: candidate.work_type_preferences || [],
    linkedinUrl: candidate.linkedin_url || "",
    resumeSummary: candidate.resume_summary || "",
    headline: candidate.headline || "",
    phone: candidate.phone || "",
    portfolioUrl: candidate.portfolio_url || "",
    yearsOfExperience: candidate.years_of_experience || "",
    preferredIndustries: candidate.preferred_industries || [],
    willingToRelocate: candidate.willing_to_relocate || false,
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

  const [showPreview, setShowPreview] = useState(false);
  const profileStrength = calcProfileStrength(candidate, interests, skills);
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
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
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

  const toggleIndustry = (industry) => {
    const current = form.preferredIndustries || [];
    if (current.includes(industry)) {
      setForm({ ...form, preferredIndustries: current.filter(i => i !== industry) });
    } else {
      setForm({ ...form, preferredIndustries: [...current, industry] });
    }
  };

  return (
    <div className={`${t.page} w-full`}>
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={t.pageGradientStyle} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Section */}
        <div className="relative mb-8">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm backdrop-blur overflow-hidden">
            {/* Top bar with actions */}
            <div className="flex items-center justify-end gap-2 px-6 pt-4">
              {!editing ? (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="gap-2"><Edit3 className="w-3.5 h-3.5" /> Edit Profile</Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} {saving ? "Saving..." : "Save"}</Button>
                </>
              )}
              <Link href="/notifications">
                <Button variant="secondary" size="sm" className="relative">
                  <Bell className="w-3.5 h-3.5" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full text-[10px] grid place-items-center font-semibold text-white ring-2 ring-white dark:ring-neutral-800">{unreadCount}</span>}
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}><LogOut className="w-3.5 h-3.5" /></Button>
            </div>

            {/* Profile info */}
            <div className="px-6 pb-6 pt-2">
              {editing ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <ProfilePicture url={candidate.profile_picture_url} name={form.name} size="lg" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Full Name</label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Headline</label>
                        <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value.slice(0, 200) })} placeholder="e.g. Experienced accountant seeking opportunities in Cayman" className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" maxLength={200} />
                        <div className="text-xs text-neutral-500 mt-1">{form.headline.length}/200</div>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isCaymanian} onChange={(e) => setForm({ ...form, isCaymanian: e.target.checked })} className="rounded" />
                    <span className="text-sm">I am Caymanian</span>
                  </label>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <ProfilePicture url={candidate.profile_picture_url} name={candidate.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{candidate.name || "Name not set"}</h1>
                    {candidate.headline && <p className="text-neutral-600 dark:text-neutral-400 mt-1">{candidate.headline}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge className={availOption?.color}>{availOption?.label || "Not set"}</Badge>
                      {candidate.is_caymanian && <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-neutral-500">
                      {candidate.location_code && (
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-pink-600" /> {locTypes.get(candidate.location_code)}</span>
                      )}
                      {candidate.education_code && (
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-purple-600" /> {eduTypes.get(candidate.education_code)}</span>
                      )}
                      {candidate.experience_code && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-600" /> {expTypes.get(candidate.experience_code)}</span>
                      )}
                      {candidate.years_of_experience && (
                        <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-emerald-600" /> {candidate.years_of_experience} years</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Strength */}
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Profile Strength</h3>
              <span className="text-sm font-semibold text-primary-500">{profileStrength.score}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  profileStrength.score >= 80 ? "bg-emerald-400" : profileStrength.score >= 50 ? "bg-cyan-400" : "bg-yellow-400"
                }`}
                style={{ width: `${profileStrength.score}%` }}
              />
            </div>
            {profileStrength.missing.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profileStrength.missing.map((item) => (
                  <span key={item} className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 text-neutral-500">{item}</span>
                ))}
              </div>
            )}
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => setShowPreview(true)} className="gap-2">
                <Eye className="w-3 h-3" /> Preview how employers see you
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employer Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Employer View</h3>
                  <button onClick={() => setShowPreview(false)} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-xs text-neutral-500 mb-4">This is what employers see in talent search (your name and email are hidden).</p>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 grid place-items-center"><User className="w-5 h-5 text-neutral-500" /></div>
                    <div>
                      <div className="font-medium">Anonymous Candidate</div>
                      {candidate.headline && <div className="text-xs text-neutral-500">{candidate.headline}</div>}
                      <div className="flex gap-2 mt-1">
                        <Badge className={availOption?.color}>{availOption?.label || "Not set"}</Badge>
                        {candidate.is_caymanian && <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-purple-600" /> {eduTypes.get(candidate.education_code) || "Not set"}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-600" /> {expTypes.get(candidate.experience_code) || "Not set"}</div>
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-pink-600" /> {locTypes.get(candidate.location_code) || "Not set"}</div>
                  </div>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {interests.map(i => (
                        <Badge key={i.cisco_code} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">{i.title || i.cisco_code}</Badge>
                      ))}
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.map(s => (
                        <Badge key={s.id} className="bg-purple-50 text-purple-600 border-purple-200 text-xs">{s.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" onClick={() => setShowPreview(false)} className="flex-1">Close</Button>
                  {!editing && <Button onClick={() => { setShowPreview(false); setEditing(true); }} className="flex-1 gap-2"><Edit3 className="w-3 h-3" /> Edit Profile</Button>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                {editing ? (
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300" placeholder="Brief intro about yourself..." />
                ) : (
                  candidate.bio ? (
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{candidate.bio}</p>
                  ) : (
                    <p className="text-neutral-500 text-sm">No bio yet. Tell employers about yourself.</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5" /> Professional Details</h2>
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Education</label>
                        <select value={form.educationCode} onChange={(e) => setForm({ ...form, educationCode: e.target.value })} className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300">
                          <option value="">Select...</option>
                          {Array.from(eduTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Experience Level</label>
                        <select value={form.experienceCode} onChange={(e) => setForm({ ...form, experienceCode: e.target.value })} className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300">
                          <option value="">Select...</option>
                          {Array.from(expTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Location</label>
                        <select value={form.locationCode} onChange={(e) => setForm({ ...form, locationCode: e.target.value })} className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300">
                          <option value="">Select...</option>
                          {Array.from(locTypes.entries()).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Years of Experience</label>
                        <Input type="number" min="0" max="50" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} placeholder="e.g. 5" className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1 block">Portfolio URL</label>
                        <Input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="https://..." className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-2 block">Preferred Industries</label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRY_OPTIONS.map(ind => (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => toggleIndustry(ind)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                              (form.preferredIndustries || []).includes(ind)
                                ? "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30"
                                : "bg-white dark:bg-neutral-800 shadow-sm text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-600" /><span className="text-sm">{eduTypes.get(candidate.education_code) || "Not set"}</span></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-600" /><span className="text-sm">{expTypes.get(candidate.experience_code) || "Not set"}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-pink-600" /><span className="text-sm">{locTypes.get(candidate.location_code) || "Not set"}</span></div>
                    </div>
                    {(candidate.years_of_experience || candidate.portfolio_url || candidate.linkedin_url) && (
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {candidate.years_of_experience && (
                          <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400"><Hash className="w-3.5 h-3.5 text-emerald-600" /> {candidate.years_of_experience} years experience</span>
                        )}
                        {candidate.portfolio_url && (
                          <a href={candidate.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary-500 hover:underline"><Globe className="w-3.5 h-3.5" /> Portfolio <ArrowUpRight className="w-3 h-3" /></a>
                        )}
                        {candidate.linkedin_url && (
                          <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary-500 hover:underline"><Linkedin className="w-3.5 h-3.5" /> LinkedIn <ArrowUpRight className="w-3 h-3" /></a>
                        )}
                      </div>
                    )}
                    {candidate.preferred_industries?.length > 0 && (
                      <div>
                        <div className="text-xs text-neutral-500 mb-1.5">Preferred Industries</div>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.preferred_industries.map(ind => (
                            <Badge key={ind} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">{ind}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Career Interests */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Star className="w-5 h-5" /> Career Interests</h2>
                  {editing && (
                    <Button variant="secondary" size="sm" onClick={() => setShowInterestSearch(!showInterestSearch)} className="gap-1">
                      <Plus className="w-3 h-3" /> Add Interest
                    </Button>
                  )}
                </div>

                {editing && showInterestSearch && (
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        value={interestQuery}
                        onChange={(e) => setInterestQuery(e.target.value)}
                        placeholder="Search job titles to find CISCO codes..."
                        className="pl-10 bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
                        autoFocus
                      />
                    </div>
                    {interestSuggestions.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {interestSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => addInterest(s)}
                            className="text-left rounded-xl px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:border-primary-300 transition"
                          >
                            <div className="font-medium text-sm">{s.ciscoUnit?.title}</div>
                            <div className="text-xs text-neutral-500">{s.label}</div>
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
                          <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 cursor-pointer hover:bg-primary-100">
                            {i.title || i.ciscoCode}
                          </Badge>
                        </Link>
                        {editing && (
                          <button onClick={() => removeInterest(i.ciscoCode)} className="text-neutral-500 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">No career interests set. {editing ? "Click 'Add Interest' above to search." : <Link href="/career-tracks" className="text-primary-500 hover:underline">Explore Career Tracks</Link>}</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5" /> Skills</h2>
                  {editing && (
                    <Button variant="secondary" size="sm" onClick={() => setShowSkillSearch(!showSkillSearch)} className="gap-1">
                      <Plus className="w-3 h-3" /> Add Skill
                    </Button>
                  )}
                </div>

                {editing && showSkillSearch && (
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search skills..."
                        className="pl-10 bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
                        autoFocus
                      />
                    </div>
                    {skillSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skillSuggestions.map((s) => (
                          <button key={s.id} onClick={() => addSkill(s)}>
                            <Badge className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-purple-300 cursor-pointer">
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
                    <div className="text-xs text-neutral-500 mb-2">Suggested based on your interests</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((s) => (
                        <button key={s.id} onClick={() => addSkill(s)}>
                          <Badge className="bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer">
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
                        <Badge className="bg-purple-50 text-purple-600 border-purple-200">{s.name}</Badge>
                        {editing && (
                          <button onClick={() => removeSkill(s.id)} className="text-neutral-500 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">No skills added yet. {editing ? "Click 'Add Skill' above or pick from suggestions." : "Skills will be suggested based on your career interests."}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Status</h3>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-2 block">Availability</label>
                      <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300">
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
                        <><Eye className="w-4 h-4 text-emerald-600" /><span className="text-emerald-600">Visible to employers</span></>
                      ) : (
                        <><EyeOff className="w-4 h-4 text-neutral-500" /><span className="text-neutral-500">Hidden from employers</span></>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Preferences</h3>
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Minimum Salary (KYD/year)</label>
                      <Input
                        type="number"
                        value={form.salaryMin}
                        onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                        placeholder="e.g. 60000"
                        className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-2 block">Work Type</label>
                      <div className="space-y-2">
                        {[["1", "Full-time"], ["2", "Part-time"], ["3", "Contract"]].map(([code, label]) => (
                          <label key={code} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.workTypePreferences.includes(code)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...form.workTypePreferences, code]
                                  : form.workTypePreferences.filter(c => c !== code);
                                setForm({ ...form, workTypePreferences: next });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.willingToRelocate} onChange={(e) => setForm({ ...form, willingToRelocate: e.target.checked })} className="rounded" />
                      <span className="text-sm">Willing to relocate</span>
                    </label>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Phone</label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 345 ..."
                        className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">LinkedIn URL</label>
                      <Input
                        value={form.linkedinUrl}
                        onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Shared with employers only after you accept an introduction.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Resume Summary</label>
                      <textarea
                        value={form.resumeSummary}
                        onChange={(e) => setForm({ ...form, resumeSummary: e.target.value })}
                        rows={3}
                        placeholder="Anything the structured fields don't capture..."
                        className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 h-10 text-sm text-neutral-700 dark:text-neutral-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {candidate.salary_min ? (
                      <div><span className="text-neutral-500">Minimum Salary:</span> KYD {candidate.salary_min.toLocaleString()}/yr</div>
                    ) : (
                      <div className="text-neutral-500">No minimum salary set</div>
                    )}
                    {candidate.work_type_preferences?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidate.work_type_preferences.map(c => (
                          <Badge key={c} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">
                            {c === "1" ? "Full-time" : c === "2" ? "Part-time" : c === "3" ? "Contract" : c}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-neutral-500">No work type preferences set</div>
                    )}
                    {candidate.willing_to_relocate && (
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> <span className="text-emerald-600">Willing to relocate</span></div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-neutral-500" /> {candidate.phone}</div>
                    )}
                    {candidate.linkedin_url && (
                      <div><span className="text-neutral-500">LinkedIn:</span> <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">Profile</a></div>
                    )}
                    {candidate.resume_summary && (
                      <div><span className="text-neutral-500">Summary:</span> <span className="text-neutral-600 dark:text-neutral-400">{candidate.resume_summary}</span></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Introductions */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Send className="w-5 h-5" /> Introductions</h3>
                  {pendingIntroCount > 0 && <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">{pendingIntroCount} pending</Badge>}
                </div>
                <Link href="/introductions" className="text-sm text-primary-500 hover:underline flex items-center gap-1">
                  View all introductions <ChevronRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Job Alerts */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Bell className="w-5 h-5" /> Job Alerts</h3>
                </div>
                {alertsLoaded && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map(a => (
                      <div key={a.id} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 text-xs">{a.frequency}</Badge>
                          <button onClick={() => handleDeleteAlert(a.id)} className="text-neutral-500 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {a.filters?.ciscoCodes?.length ? `${a.filters.ciscoCodes.length} interest(s)` : "All interests"}
                        </div>
                        <button
                          onClick={() => handleToggleFrequency(a)}
                          className="text-xs text-primary-500 hover:underline"
                        >
                          Switch to {a.frequency === "daily" ? "weekly" : "daily"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : alertsLoaded ? (
                  <p className="text-neutral-500 text-sm mb-3">No active alerts.</p>
                ) : null}
                <Button variant="secondary" size="sm" onClick={handleCreateAlert} className="gap-1 w-full mt-3">
                  <Plus className="w-3 h-3" /> Create Alert
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  {unreadCount > 0 && <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">{unreadCount} new</Badge>}
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? "bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700" : "bg-primary-50 dark:bg-primary-500/15 border-primary-200 dark:border-primary-500/30"}`}>
                        <div className="text-sm font-medium">{n.title}</div>
                        {n.body && <div className="text-xs text-neutral-500 mt-1">{n.body}</div>}
                      </div>
                    ))}
                    <Link href="/notifications" className="text-sm text-primary-500 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">No notifications yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
