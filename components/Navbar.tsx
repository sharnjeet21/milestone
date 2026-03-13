"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Role = "employer" | "freelancer" | null;

type NavItem = {
  href: string;
  label: string;
};

const navByRole: Record<Exclude<Role, null> | "guest", NavItem[]> = {
  employer: [
    { label: "Dashboard", href: "/employer/dashboard" },
    { label: "Create Project", href: "/employer/create" },
  ],
  freelancer: [
    { label: "Browse Projects", href: "/freelancer/browse" },
    { label: "My Workspace", href: "/freelancer/workspace" },
    { label: "My PFI", href: "/freelancer/pfi" },
  ],
  guest: [
    { label: "Login", href: "/auth/login" },
    { label: "Get Started", href: "/auth/role" },
  ],
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [isConnected, setIsConnected] = useState(() => !process.env.NEXT_PUBLIC_API_URL);

  const syncRole = useCallback(() => {
    const storedRole = window.localStorage.getItem("role");
    setRole(
      storedRole === "employer" || storedRole === "freelancer"
        ? storedRole
        : null,
    );
  }, []);

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

    if (!apiBaseUrl) {
      return;
    }

    let cancelled = false;

    const checkApiConnection = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          method: "GET",
          cache: "no-store",
        });

        if (!cancelled) {
          setIsConnected(response.ok);
        }
      } catch {
        if (!cancelled) {
          setIsConnected(false);
        }
      }
    };

    void checkApiConnection();
    const intervalId = window.setInterval(() => {
      void checkApiConnection();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const navItems = useMemo(
    () => navByRole[role ?? "guest"],
    [role],
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-80"
          >
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">MilestoneAI</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-2">
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
                    {active ? (
                      <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-green-500" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                isConnected
                  ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                  : "border-border/60 bg-background text-foreground/60",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "animate-pulse bg-green-500" : "bg-slate-400",
                )}
              />
              <span>{isConnected ? "Live" : "Offline"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                isConnected
                  ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                  : "border-border/60 bg-background text-foreground/60",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "animate-pulse bg-green-500" : "bg-slate-400",
                )}
              />
              <span>{isConnected ? "Live" : "Offline"}</span>
            </div>

            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition-colors hover:bg-foreground/5"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation overlay"
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
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-2">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-2xl border border-transparent px-4 py-3 text-sm transition-colors",
                        active
                          ? "border-green-500/20 bg-green-500/10 text-foreground"
                          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                      )}
                    >
                      <span className="relative inline-flex">
                        {item.label}
                        {active ? (
                          <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-green-500" />
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
