"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Globe, Image, Type, Users, Calendar, MapPin, Briefcase,
  Linkedin, Twitter, Instagram, Save, Eye, EyeOff, Plus, X, Check,
} from "lucide-react";
import { PREDEFINED_PERKS, PERK_CATEGORIES } from "@/lib/perks";

const SIZE_OPTIONS = [
  { value: "", label: "Select size..." },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

const DEFAULT_SECTIONS = { about: true, benefits: true, jobs: true, insights: true };

export default function ProfileEditClient({ employer }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Branding
  const [logoUrl, setLogoUrl] = useState(employer.logo_url || "");
  const [coverUrl, setCoverUrl] = useState(employer.cover_url || "");
  const [tagline, setTagline] = useState(employer.tagline || "");

  // Company details
  const [companySize, setCompanySize] = useState(employer.company_size || "");
  const [yearFounded, setYearFounded] = useState(employer.year_founded || "");
  const [headquarters, setHeadquarters] = useState(employer.headquarters || "");
  const [industry, setIndustry] = useState(employer.industry || "");

  // Online presence
  const [website, setWebsite] = useState(employer.website || "");
  const socialLinks = employer.social_links || {};
  const [linkedin, setLinkedin] = useState(socialLinks.linkedin || "");
  const [twitter, setTwitter] = useState(socialLinks.twitter || "");
  const [instagram, setInstagram] = useState(socialLinks.instagram || "");

  // About
  const [description, setDescription] = useState(employer.description || "");

  // Benefits
  const storedBenefits = Array.isArray(employer.benefits) ? employer.benefits : [];
  const [selectedPerks, setSelectedPerks] = useState(
    new Set(storedBenefits.filter((b) => b.id !== "custom").map((b) => b.id))
  );
  const [customPerks, setCustomPerks] = useState(
    storedBenefits.filter((b) => b.id === "custom")
  );
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("office");

  // Section visibility
  const sections = { ...DEFAULT_SECTIONS, ...(employer.profile_sections || {}) };
  const [sectionVisibility, setSectionVisibility] = useState(sections);

  const togglePerk = (id) => {
    setSelectedPerks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustomPerk = () => {
    if (!newCustomLabel.trim()) return;
    setCustomPerks((prev) => [
      ...prev,
      { id: "custom", label: newCustomLabel.trim(), category: newCustomCategory },
    ]);
    setNewCustomLabel("");
  };

  const removeCustomPerk = (index) => {
    setCustomPerks((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSection = (key) => {
    setSectionVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const benefits = [
        ...[...selectedPerks].map((id) => ({ id })),
        ...customPerks,
      ];

      const res = await fetch("/api/employer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl || null,
          coverUrl: coverUrl || null,
          tagline: tagline || null,
          companySize: companySize || null,
          yearFounded: yearFounded ? Number(yearFounded) : null,
          headquarters: headquarters || null,
          industry: industry || null,
          website: website || null,
          description: description || null,
          socialLinks: { linkedin: linkedin || null, twitter: twitter || null, instagram: instagram || null },
          benefits,
          profileSections: sectionVisibility,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "bg-white/5 border-white/10 text-neutral-200 placeholder:text-neutral-600";

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
          <p className="text-neutral-400 text-sm mt-1">Customize how your company appears on careers.ky</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Branding */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-cyan-300" /> Branding</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Logo URL</label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Cover Image URL</label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://example.com/cover.jpg" className={inputCls} />
            <p className="text-xs text-neutral-500 mt-1">Recommended: 1200x400px. Shown at the top of your public profile.</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tagline</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your company motto or one-liner" maxLength={200} className={inputCls} />
            <p className="text-xs text-neutral-500 mt-1">{tagline.length}/200 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-300" /> Company Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company Size</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={`w-full rounded-md px-3 py-2 text-sm ${inputCls} border`}>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Year Founded</label>
              <Input type="number" value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} placeholder="2010" min={1800} max={new Date().getFullYear()} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Headquarters</label>
              <Input value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} placeholder="George Town, Grand Cayman" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Industry</label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Financial Services" className={inputCls} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Online Presence */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-300" /> Online Presence</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Website</label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..." className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter / X</label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Type className="w-5 h-5 text-cyan-300" /> About</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Company Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={`w-full rounded-xl px-3 py-2 text-sm ${inputCls} border`}
              placeholder="Tell candidates about your company, culture, and what makes it a great place to work..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Benefits & Perks */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-cyan-300" /> Benefits & Perks</h2>
          <p className="text-sm text-neutral-400">Select the benefits your company offers. These will be displayed on your public profile.</p>

          {PERK_CATEGORIES.map((cat) => {
            const perks = PREDEFINED_PERKS.filter((p) => p.category === cat.id);
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-medium text-neutral-300 mb-2">{cat.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {perks.map((perk) => (
                    <button
                      key={perk.id}
                      onClick={() => togglePerk(perk.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                        selectedPerks.has(perk.id)
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-300/30"
                          : "bg-white/5 text-neutral-400 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {selectedPerks.has(perk.id) && <Check className="w-3 h-3 inline mr-1" />}
                      {perk.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom perks */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-2">Custom Benefits</h3>
            {customPerks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {customPerks.map((cp, i) => (
                  <Badge key={i} className="bg-purple-500/20 text-purple-300 border-purple-300/30 gap-1">
                    {cp.label}
                    <button onClick={() => removeCustomPerk(i)} className="ml-1 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  value={newCustomLabel}
                  onChange={(e) => setNewCustomLabel(e.target.value)}
                  placeholder="Custom benefit name"
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && addCustomPerk()}
                />
              </div>
              <select
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                className={`rounded-md px-3 py-2 text-sm ${inputCls} border`}
              >
                {PERK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <Button variant="secondary" onClick={addCustomPerk} disabled={!newCustomLabel.trim()} className="gap-1">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Eye className="w-5 h-5 text-cyan-300" /> Section Visibility</h2>
          <p className="text-sm text-neutral-400">Control which sections appear on your public profile page.</p>
          <div className="space-y-3">
            {[
              { key: "about", label: "About", desc: "Company description and details" },
              { key: "benefits", label: "Benefits & Perks", desc: "Your company benefits and perks" },
              { key: "jobs", label: "Open Positions", desc: "Active job postings" },
              { key: "insights", label: "Hiring Insights", desc: "Salary ranges, top roles, hiring patterns" },
            ].map((section) => (
              <div key={section.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-sm font-medium">{section.label}</div>
                  <div className="text-xs text-neutral-500">{section.desc}</div>
                </div>
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    sectionVisibility[section.key] ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    sectionVisibility[section.key] ? "translate-x-5" : ""
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
