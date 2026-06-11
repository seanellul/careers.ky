"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldOff, X } from "lucide-react";

// Hard privacy block: companies on this list can never see the candidate
// in any employer search, on any tier — enforced at query level.
export default function BlockedEmployersCard() {
  const [blocked, setBlocked] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile/blocked-employers")
      .then((r) => r.json())
      .then((d) => setBlocked(d.blocked || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/employers/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        const blockedIds = new Set(blocked.map((b) => b.employer_id));
        setSuggestions((d.employers || []).filter((e) => !blockedIds.has(e.id)));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [query, blocked]);

  const save = async (next) => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedEmployerIds: next.map((b) => b.employer_id) }),
      });
      if (res.ok) setBlocked(next);
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (employer) => {
    setQuery("");
    setSuggestions([]);
    save([...blocked, { employer_id: employer.id, name: employer.name }]);
  };

  const removeBlock = (employerId) => {
    save(blocked.filter((b) => b.employer_id !== employerId));
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 font-medium mb-2">
          <ShieldOff className="w-4 h-4 text-primary-500" /> Blocked companies
        </div>
        <p className="text-sm text-neutral-500 mb-3">
          Companies you add here can never see your profile in any search, on any plan — for
          example, your current employer.
        </p>

        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies to block..."
            disabled={saving}
            className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-auto">
              {suggestions.map((e) => (
                <button
                  key={e.id}
                  onClick={() => addBlock(e)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {blocked.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {blocked.map((b) => (
              <Badge
                key={b.employer_id}
                className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 gap-1"
              >
                {b.name}
                <button
                  onClick={() => removeBlock(b.employer_id)}
                  disabled={saving}
                  aria-label={`Unblock ${b.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
