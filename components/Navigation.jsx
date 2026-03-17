"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, User, ChevronDown, Building2, Send } from "lucide-react";
import { useSession } from "@/components/SessionProvider";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loginType, setLoginType] = useState("candidate");
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);

  const { session, loading, refresh } = useSession();

  const unreadCount = session?.unreadCount || 0;
  const pendingIntroCount = session?.pendingIntroCount || 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setShowDropdown(false);
    refresh();
    router.push("/");
    router.refresh();
  };

  const isEmployer = !!session?.employerAccountId;
  const isCandidate = !!session?.candidateId && !isEmployer;

  const navItems = [];
  navItems.push({ href: "/", label: "Home" });

  if (!isEmployer) {
    navItems.push({ href: "/career-tracks", label: "Career Tracks" });
    navItems.push({ href: "/jobs", label: "Live Search" });
  }

  navItems.push({ href: "/employers", label: "Employers" });

  if (isCandidate) {
    navItems.push({ href: "/introductions", label: "Introductions", badge: pendingIntroCount });
  }

  if (isEmployer) {
    navItems.push({ href: "/employer/dashboard", label: "Dashboard" });
  }

  const initial = session?.candidateName?.[0] || session?.employerName?.[0] || session?.candidateEmail?.[0]?.toUpperCase() || "U";

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
              <span key={item.href} className="text-cyan-300 font-medium flex items-center gap-1.5">
                {item.label}
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-cyan-500 rounded-full text-[10px] grid place-items-center font-semibold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-white transition flex items-center gap-1.5"
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-cyan-500 rounded-full text-[10px] grid place-items-center font-semibold text-white animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            )
          )}

          {!loading && !session && (
            <button
              onClick={() => { setShowSignIn(!showSignIn); }}
              className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-300/30 hover:bg-cyan-500/30 transition text-sm font-medium"
            >
              Sign In
            </button>
          )}

          {!loading && session && (
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-white/10 transition">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full text-[10px] grid place-items-center font-semibold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-500/30 text-cyan-300 grid place-items-center text-xs font-semibold">
                    {initial}
                  </div>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    {isEmployer ? (
                      <Link
                        href="/employer/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition"
                      >
                        <Building2 className="w-4 h-4" /> Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition"
                      >
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition"
                    >
                      <Bell className="w-4 h-4" /> Notifications
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition w-full text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
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

      {/* Sign In Panel */}
      {showSignIn && !session && (
        <div className="border-t border-white/5 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-lg ml-auto space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 mb-1 block">I am a</label>
                  <select
                    value={loginType}
                    onChange={(e) => setLoginType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="candidate">Job Seeker</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <a
                    href={`/api/auth/google?type=${loginType}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-100 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowSignIn(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-neutral-950/95 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
            {navItems.map((item) =>
              pathname === item.href ? (
                <div
                  key={item.href}
                  className="px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-300/30 text-cyan-300 font-medium flex items-center justify-between"
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1.5 bg-cyan-500 rounded-full text-[11px] grid place-items-center font-semibold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left flex items-center justify-between"
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1.5 bg-cyan-500 rounded-full text-[11px] grid place-items-center font-semibold text-white animate-pulse">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Link>
              )
            )}
            {!loading && session && (
              <>
                {isEmployer ? (
                  <Link href="/employer/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white">
                    My Profile
                  </Link>
                )}
                <Link href="/notifications" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white">
                  Notifications
                </Link>
                <button onClick={handleLogout} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-red-400 text-left">
                  Sign Out
                </button>
              </>
            )}
            {!loading && !session && (
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSignIn(true); }}
                className="px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-300/30 text-cyan-300 font-medium text-left"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
