"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function ProfileCompletenessCard({ score, missing }) {
  if (score >= 100 || missing.length === 0) return null;

  // Show at most 4 missing items
  const items = missing.slice(0, 4);

  return (
    <Card className="bg-gradient-to-br from-primary-50 via-white to-white border-primary-200">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 grid place-items-center">
              <Zap className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <div className="font-semibold text-sm text-neutral-900">Complete your profile</div>
              <div className="text-xs text-neutral-500">
                {score}% complete — boost your visibility to employers
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-primary-600 flex-shrink-0">{score}%</div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-neutral-100 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Missing items */}
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Link key={i} href="/profile" className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition text-neutral-600 hover:text-primary-700">
              + {item}
            </Link>
          ))}
          {missing.length > 4 && (
            <Link href="/profile" className="text-xs px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-primary-300 transition text-neutral-500 hover:text-primary-700">
              +{missing.length - 4} more
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
