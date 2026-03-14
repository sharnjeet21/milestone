"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Github, Loader2, LogIn, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { onAuthChange, signInWithEmail, signInWithGoogle, signInWithGitHub, signUpWithEmail } from "@/lib/auth";
import type { User } from "firebase/auth";

// Routes that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/onboarding"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

type Mode = "login" | "signup";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"freelancer" | "employer">("freelancer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user && !isPublic(pathname)) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [authReady, user, pathname]);

  useEffect(() => {
    if (showModal) setTimeout(() => emailRef.current?.focus(), 120);
  }, [showModal, mode]);

  const reset = () => { setEmail(""); setPassword(""); setName(""); setError(""); };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name, role);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("role", role);
        }
      }
      setShowModal(false);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle(role);
      if (typeof window !== "undefined") window.localStorage.setItem("role", role);
      setShowModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGitHub(role);
      if (typeof window !== "undefined") window.localStorage.setItem("role", role);
      setShowModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "GitHub sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // Show nothing until auth is resolved (avoids flash)
  if (!authReady) {
    return (
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      {/* Blur protected content when modal is open */}
      <div className={showModal ? "pointer-events-none select-none blur-sm" : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal — fixed overlay centers the card */}
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 81, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md overflow-y-auto max-h-[90svh] rounded-[2rem] border border-border/60 bg-background p-8 shadow-2xl shadow-slate-950/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-foreground">MilestoneAI</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "login"
                      ? "Sign in to access your workspace."
                      : "Join thousands of experts earning weekly."}
                  </p>
                </div>
                <Link
                  href="/"
                  onClick={() => setShowModal(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-foreground/5"
                >
                  <X className="h-4 w-4" />
                </Link>
              </div>

              {/* Role picker (signup only) */}
              {mode === "signup" && (
                <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-foreground/[0.03] p-1">
                  {(["freelancer", "employer"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`rounded-xl py-2 text-sm font-medium capitalize transition ${
                        role === r
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* OAuth buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleGitHub}
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-50"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground">or continue with email</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === "signup" && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60 placeholder:text-muted-foreground/60"
                  />
                )}
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60 placeholder:text-muted-foreground/60"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60 placeholder:text-muted-foreground/60"
                />

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); reset(); }}
                  className="font-medium text-green-600 transition hover:text-green-700 dark:text-green-400"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
