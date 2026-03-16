"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, User, ChevronDown } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSending, setLoginSending] = useState(false);
  const [loginSent, setLoginSent] = useState(false);
  const [loginType, setLoginType] = useState("candidate");
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        setSession(d.authenticated ? d : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    setLoginSending(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, type: loginType }),
      });
      setLoginSent(true);
    } finally {
      setLoginSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setShowDropdown(false);
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

  if (isEmployer) {
    navItems.push({ href: "/talent", label: "Talent" });
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

          {!loading && !session && (
            <button
              onClick={() => { setShowSignIn(!showSignIn); setLoginSent(false); }}
              className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-300/30 hover:bg-cyan-500/30 transition text-sm font-medium"
            >
              Sign In
            </button>
          )}

          {!loading && session && (
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-white/10 transition">
                <Bell className="w-4 h-4" />
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
                    <Link
                      href="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
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

      {/* Sign In Inline Form */}
      {showSignIn && !session && (
        <div className="border-t border-white/5 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            {!loginSent ? (
              <form onSubmit={handleLogin} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 max-w-lg ml-auto">
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-cyan-300/40"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">I am a</label>
                  <select
                    value={loginType}
                    onChange={(e) => setLoginType(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="candidate">Job Seeker</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loginSending || !loginEmail}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition disabled:opacity-50"
                >
                  {loginSending ? "Sending..." : "Send Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignIn(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between max-w-lg ml-auto">
                <div className="text-sm text-emerald-300">Check your email for the sign-in link.</div>
                <button onClick={() => { setShowSignIn(false); setLoginSent(false); }} className="text-sm text-neutral-400 hover:text-white">
                  Close
                </button>
              </div>
            )}
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
            {!loading && session && (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white">
                  My Profile
                </Link>
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
