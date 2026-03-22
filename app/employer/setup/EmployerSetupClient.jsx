"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Building2, CheckCircle, ChevronRight, Globe, FileText, Clock } from "lucide-react";
import t from "@/lib/theme";

export default function EmployerSetupClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Optional profile fields
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Search employers
  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); return; }
    const ctrl = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/employer/search?q=${encodeURIComponent(searchQuery)}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(d => { setResults(d.employers || []); setSearching(false); })
        .catch(() => setSearching(false));
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [searchQuery]);

  const handleClaim = async () => {
    if (!selectedEmployer) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/employer/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: selectedEmployer.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data.verificationStatus);
        if (data.verificationStatus === "verified") {
          setStep(2);
        } else {
          setStep(3); // Pending verification
        }
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleFinish = async () => {
    if (website || description || logoUrl) {
      await fetch("/api/employer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, description, logoUrl }),
      });
    }
    router.push("/employer/dashboard");
  };

  const stepLabels = ["Select Company", "Verification", "Company Details"];

  return (
    <div className={t.page}>
      <div id="bg-gradient" aria-hidden className={t.pageGradient} style={t.pageGradientStyle} />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 grid place-items-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Employer Setup</h1>
          <p className="text-neutral-500">Link your account to your company to start using the talent pool.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const isActive = step >= num || (num === 2 && step === 3);
            const isSkipped = num === 2 && verificationStatus === "verified" && step === 2;
            if (isSkipped) return null;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-neutral-500" />}
                <div className={`flex items-center gap-2 ${isActive ? "text-primary-500" : "text-neutral-500"}`}>
                  <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold ${isActive ? "bg-primary-50 border border-primary-200" : "bg-neutral-50 border border-neutral-200"}`}>{num}</div>
                  <span className="text-sm font-medium hidden sm:inline">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Find your company</h2>
              <p className="text-neutral-500 text-sm">Search for your company from our database of Cayman employers.</p>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedEmployer(null); }}
                  placeholder="Search company name..."
                  className="pl-10 bg-neutral-50 border-neutral-200"
                  autoFocus
                />
              </div>

              {searching && <div className="text-sm text-neutral-500">Searching...</div>}

              {results.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployer(emp)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        selectedEmployer?.id === emp.id
                          ? "bg-primary-50 border-primary-200"
                          : "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 grid place-items-center shrink-0">
                          <Building2 className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          {emp.claimed && <span className="text-xs text-yellow-600">Already claimed</span>}
                        </div>
                        {selectedEmployer?.id === emp.id && <CheckCircle className="w-5 h-5 text-primary-500 ml-auto" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && results.length === 0 && (
                <p className="text-sm text-neutral-500">No companies found. Try a different search term.</p>
              )}

              <Button onClick={handleClaim} disabled={!selectedEmployer || claiming} className="w-full gap-2">
                {claiming ? "Linking..." : "Link My Account"} <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-semibold">Linked to {selectedEmployer?.name}</h2>
              </div>
              <p className="text-neutral-500 text-sm">Optionally add more details about your company. You can always update these later.</p>

              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className="bg-neutral-50 border-neutral-200" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief description of your company..." className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-700" />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.push("/employer/dashboard")} className="flex-1">
                  Skip for Now
                </Button>
                <Button onClick={handleFinish} className="flex-1 gap-2">
                  Save & Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-amber-50 grid place-items-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Verification Pending</h2>
                  <p className="text-neutral-500 text-sm">We&apos;re verifying your connection to {selectedEmployer?.name}</p>
                </div>
              </div>

              <p className="text-neutral-600 text-sm leading-relaxed">
                Our team reviews new employer accounts and will be in touch shortly — usually within 24 hours.
              </p>

              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <p className="text-primary-700 text-sm">
                  <strong>Tip:</strong> Sign in with your <span className="font-mono">@{selectedEmployer?.name?.toLowerCase().replace(/\s+/g, "")}.com</span> email for instant verification.
                </p>
              </div>

              <Button onClick={() => router.push("/employer/dashboard")} className="w-full gap-2">
                Continue to Dashboard <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
