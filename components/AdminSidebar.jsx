"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Presentation, Heart, Send, ShieldCheck, Menu, X,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/candidates", label: "Candidates", icon: Users },
    { href: "/admin/employers", label: "Employers", icon: Building2 },
    { href: "/admin/pitches", label: "Pitch Decks", icon: Presentation },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/admin/interests", label: "Interests", icon: Heart },
    { href: "/admin/outreach", label: "Outreach", icon: Send },
  ];

  const isActive = (href) => {
    if (href === "/admin") return pathname === href;
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1">
      <div className="px-3 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Admin</span>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              active
                ? "bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 font-medium border border-primary-200 dark:border-primary-500/30"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? "text-primary-600 dark:text-primary-400" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Admin</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      <aside className="hidden md:block w-60 shrink-0">
        <div className="sticky top-20 py-6 pr-6">
          {navContent}
        </div>
      </aside>
    </>
  );
}
