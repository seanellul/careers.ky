"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Zap } from "lucide-react";

export default function ProfileCompletenessCard({ score, missing }) {
  if (score >= 100 || missing.length === 0) return null;

  // Show at most 4 missing items
  const items = missing.slice(0, 4);

  return (
    <Card className="bg-gradient-to-br from-cyan-500/10 via-white/5 to-white/5 border-cyan-300/20">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 grid place-items-center">
              <Zap className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="font-semibold text-sm">Complete your profile</div>
              <div className="text-xs text-neutral-400">
                {score}% complete — boost your visibility to employers
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-300 flex-shrink-0">{score}%</div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-white/10 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Missing items */}
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Link key={i} href="/profile" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:bg-white/10 transition text-neutral-300 hover:text-white">
              + {item}
            </Link>
          ))}
          {missing.length > 4 && (
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-300/40 transition text-neutral-400 hover:text-white">
              +{missing.length - 4} more
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
