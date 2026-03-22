"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, Clock, MapPin, Shield, Send,
  ChevronLeft, Trash2, CheckCircle, X,
} from "lucide-react";

const AVAILABILITY_LABELS = {
  actively_looking: "Actively Looking",
  open_to_offers: "Open to Offers",
  not_looking: "Not Looking",
};
const AVAILABILITY_COLORS = {
  actively_looking: "bg-emerald-500/20 text-emerald-300 border-emerald-300/30",
  open_to_offers: "bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30",
  not_looking: "bg-neutral-500/20 text-neutral-300 border-neutral-300/30",
};

export default function ShortlistDetailClient({ shortlist, candidates: initialCandidates, eduTypes: etObj, expTypes: exObj, locTypes: ltObj }) {
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);
  const locTypes = useMemo(() => new Map(Object.entries(ltObj)), [ltObj]);

  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [showBulkIntro, setShowBulkIntro] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [introSent, setIntroSent] = useState(new Set());

  const handleRemove = async (candidateId) => {
    await fetch(`/api/employer/shortlists/${shortlist.id}/candidates`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
    setCandidates(candidates.filter(c => c.candidate_id !== candidateId));
  };

  const handleBulkIntro = async () => {
    if (selectedCandidates.size === 0) return;
    setSendingBulk(true);
    try {
      const res = await fetch("/api/introductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: [...selectedCandidates], message: bulkMessage }),
      });
      if (res.ok) {
        setIntroSent(new Set([...introSent, ...selectedCandidates]));
        setSelectedCandidates(new Set());
        setShowBulkIntro(false);
        setBulkMessage("");
      }
    } finally {
      setSendingBulk(false);
    }
  };

  const toggleCandidate = (id) => {
    const next = new Set(selectedCandidates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCandidates(next);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/employer/shortlists">
          <Button variant="secondary" className="gap-2"><ChevronLeft className="w-4 h-4" /> Back to Shortlists</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{shortlist.name}</h1>
        <span className="text-neutral-500">{candidates.length} candidate{candidates.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Bulk Actions */}
      {selectedCandidates.size > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-500/15 border border-primary-200 dark:border-primary-500/30 flex items-center justify-between">
          <span className="text-sm text-primary-500">{selectedCandidates.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowBulkIntro(true)} className="gap-1">
              <Send className="w-3 h-3" /> Send Intros
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedCandidates(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {/* Bulk Intro Modal */}
      {showBulkIntro && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBulkIntro(false)}>
          <Card className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Send Bulk Introductions</h3>
              <p className="text-sm text-neutral-500">Sending to {selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? "s" : ""}</p>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={4}
                placeholder="Your message..."
                className="w-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setShowBulkIntro(false)}>Cancel</Button>
                <Button onClick={handleBulkIntro} disabled={sendingBulk} className="gap-2">
                  <Send className="w-3 h-3" /> {sendingBulk ? "Sending..." : "Send All"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <Card key={c.id} className={`bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 ${selectedCandidates.has(c.candidate_id) ? "ring-1 ring-primary-300 dark:ring-primary-500/40" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <label className="mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(c.candidate_id)}
                      onChange={() => toggleCandidate(c.candidate_id)}
                      className="rounded"
                    />
                  </label>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 grid place-items-center"><Users className="w-4 h-4 text-neutral-500" /></div>
                      <span className="font-medium">Candidate #{i + 1}</span>
                      <Badge className={AVAILABILITY_COLORS[c.availability] || ""}>{AVAILABILITY_LABELS[c.availability] || c.availability}</Badge>
                      {c.is_caymanian && <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30"><Shield className="w-3 h-3 mr-1" /> Caymanian</Badge>}
                      {introSent.has(c.candidate_id) && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30"><CheckCircle className="w-3 h-3 mr-1" /> Intro Sent</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                      <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-purple-300" /> {eduTypes.get(c.education_code) || "Not set"}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-300" /> {expTypes.get(c.experience_code) || "Not set"}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-pink-300" /> {locTypes.get(c.location_code) || "Not set"}</div>
                    </div>
                    {c.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {c.interests.map(int => <Badge key={int.cisco_code} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs">{int.title || int.cisco_code}</Badge>)}
                      </div>
                    )}
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.skills.map(s => <Badge key={s.id} className="bg-purple-500/10 text-purple-300 border-purple-300/20 text-xs">{s.name}</Badge>)}
                      </div>
                    )}
                    {c.notes && <div className="mt-2 text-xs text-neutral-500 italic">Notes: {c.notes}</div>}
                  </div>
                  <button onClick={() => handleRemove(c.candidate_id)} className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-500" />
            <h3 className="text-lg font-medium mb-2">No candidates in this shortlist</h3>
            <p className="text-neutral-500 mb-4">Add candidates from the talent search.</p>
            <Link href="/employer/talent"><Button className="gap-2"><Users className="w-4 h-4" /> Search Talent</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
