"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, History, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { onAuthChange, logout, getUserProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "firebase/auth";

type Role = "employer" | "freelancer" | null;
type NavItem = { href: string; label: string };

const sharedNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Earnings", href: "/payment" },
  { label: "Missions", href: "/freelancer/browse" },
  { label: "Feedback", href: "/escrow" },
  { label: "Enablement", href: "/freelancer/pfi" },
];

const navByRole: Record<Exclude<Role, null> | "guest", NavItem[]> = {
  employer: [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/employer/dashboard" },
    { label: "Create Project", href: "/employer/create" },
    { label: "Earnings", href: "/payment" },
    { label: "Feedback", href: "/escrow" },
  ],
  freelancer: [
    { label: "Home", href: "/" },
    { label: "Tasks", href: "/freelancer/browse" },
    { label: "Workspace", href: "/freelancer/workspace" },
    { label: "Earnings", href: "/payment" },
    { label: "PFI Score", href: "/freelancer/pfi" },
    { label: "Escrow", href: "/escrow" },
  ],
  guest: [
    { label: "Home", href: "/" },
    { label: "Browse Tasks", href: "/freelancer/browse" },
    { label: "Earnings", href: "/payment" },
    { label: "PFI Score", href: "/freelancer/pfi" },
    { label: "Get Started", href: "/onboarding" },
  ],
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserAvatar({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-green-600 text-xs font-semibold text-white ring-2 ring-green-500/30 transition hover:bg-green-500"
        aria-label="Profile menu"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
        ) : initials}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-border/60 bg-background p-2 shadow-xl shadow-slate-900/10"
          >
            {/* User info */}
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {user.displayName ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-border/50" />

            {/* Menu items */}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/history"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              Help Center
            </Link>

            <div className="my-1 h-px bg-border/50" />
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/5"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isConnected, setIsConnected] = useState(() => !process.env.NEXT_PUBLIC_API_URL);

  const syncRole = useCallback(() => {
    const storedRole = window.localStorage.getItem("role");
    setRole(storedRole === "employer" || storedRole === "freelancer" ? storedRole : null);
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        // Try Firestore profile first, fall back to localStorage
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile?.role) {
            setRole(profile.role);
            window.localStorage.setItem("role", profile.role);
            return;
          }
        } catch { /* fall through */ }
        syncRole();
      } else {
        setRole(null);
      }
    });
    return unsub;
  }, [syncRole]);

  useEffect(() => {
    syncRole();
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, [syncRole]);

  useEffect(() => {
    setMenuOpen(false);
    syncRole();
  }, [pathname, syncRole]);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBaseUrl) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`, { method: "GET", cache: "no-store" });
        if (!cancelled) setIsConnected(res.ok);
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    };
    void check();
    const id = window.setInterval(() => void check(), 30000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const handleSignOut = async () => {
    await logout();
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("user");
    setRole(null);
    router.push("/");
  };

  const navItems = useMemo(() => navByRole[role ?? "guest"], [role]);

  const statusDot = (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
      isConnected
        ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
        : "border-border/60 bg-background text-foreground/60",
    )}>
      <span className={cn("h-2 w-2 rounded-full", isConnected ? "animate-pulse bg-green-500" : "bg-slate-400")} />
      <span>{isConnected ? "Live" : "Offline"}</span>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-80">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">MilestoneAI</span>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-4 md:flex">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground",
                      active && "text-foreground",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-green-500" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {statusDot}

            {authReady && (
              user ? (
                <UserAvatar user={user} onSignOut={handleSignOut} />
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-3 py-1.5 text-sm text-foreground/70 transition hover:text-foreground">
                    Log in
                  </Link>
                  <Link href="/signup" className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-green-500">
                    Sign up
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-3 md:hidden">
            {statusDot}
            <motion.button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition-colors hover:bg-foreground/5"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close overlay"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xs flex-col border-l border-border/50 bg-background p-6 shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">MilestoneAI</span>
                </div>
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "rounded-2xl border border-transparent px-4 py-3 text-sm transition-colors",
                        active
                          ? "border-green-500/20 bg-green-500/10 text-foreground"
                          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto border-t border-border/50 pt-6">
                {user ? (
                  <div className="space-y-1">
                    <div className="mb-3 flex items-center gap-3 px-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600 text-xs font-semibold text-white">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.photoURL} alt="avatar" className="h-9 w-9 object-cover" />
                        ) : (user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{user.displayName ?? "User"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground">
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    <Link href="/history" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground">
                      <History className="h-4 w-4" /> History
                    </Link>
                    <Link href="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground">
                      <HelpCircle className="h-4 w-4" /> Help Center
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); void handleSignOut(); }}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-500/5"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-xl border border-border/50 px-4 py-2.5 text-center text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground">
                      Log in
                    </Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="rounded-xl bg-green-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-green-500">
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
