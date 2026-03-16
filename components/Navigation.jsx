"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Menu, X } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/career-tracks", label: "Career Tracks" },
    { href: "/jobs", label: "Live Search" },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="h-8 w-8">
            <img
              src="/images/logo-careers.png"
              alt="careers.ky logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-semibold tracking-tight">
            careers<span className="text-cyan-300">.ky</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
          {navItems.map((item) =>
            pathname === item.href ? (
              <span key={item.href} className="text-cyan-300 font-medium">
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-white transition"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-neutral-950/95 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
            {navItems.map((item) =>
              pathname === item.href ? (
                <div
                  key={item.href}
                  className="px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-300/30 text-cyan-300 font-medium"
                >
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
