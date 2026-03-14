"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, Mail, Briefcase, Code2, ArrowLeft } from "lucide-react";
import { useState } from "react";

import { signInWithEmail, signInWithGoogle, signInWithGitHub, getUserProfile } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";

type Role = "employer" | "freelancer";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "auth">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectAfterLogin = async () => {
    const user = auth.currentUser;
    if (!user) return router.push("/");
    const profile = await getUserProfile(user.uid);
    const r = profile?.role ?? role;
    if (r) window.localStorage.setItem("role", r);
    // Send incomplete profiles to profile page first
    const snap = await getDoc(doc(db, 'users', user.uid));
    const profileComplete = snap.data()?.profileComplete;
    if (!profileComplete) return router.push("/profile");
    router.push(r === "employer" ? "/employer/dashboard" : "/freelancer/workspace");
  };

  const handle = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    setError("");
    try {
      await fn();
      await redirectAfterLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (r: Role) => {
    setRole(r);
    setStep("auth");
  };

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <AnimatePresence mode="wait">

          {/* Step 1 — Role selection */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 mb-2">
                Welcome
              </p>
              <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
                Sign in to MilestoneAI
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Choose how you're joining — your role shapes your dashboard.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {([
                  { r: "employer" as Role, label: "Employer", sub: "Post & manage projects", Icon: Briefcase },
                  { r: "freelancer" as Role, label: "Freelancer", sub: "Find work & get paid", Icon: Code2 },
                ]).map(({ r, label, sub, Icon }) => (
                  <motion.button
                    key={r}
                    type="button"
                    onClick={() => selectRole(r)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-[1.5rem] border-2 border-border/50 bg-white/80 backdrop-blur p-6 text-left transition hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </motion.button>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/signup" className="font-medium text-green-600 hover:text-green-700 transition">
                  Sign up
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2 — Auth form */}
          {step === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur"
            >
              <button
                onClick={() => { setStep("role"); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  {role === "employer"
                    ? <Briefcase className="w-4 h-4 text-green-600" />
                    : <Code2 className="w-4 h-4 text-green-600" />
                  }
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-600 font-medium">
                    {role === "employer" ? "Employer" : "Freelancer"}
                  </p>
                  <h1 className="text-xl font-medium text-foreground">Sign in</h1>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Google OAuth */}
              <motion.button
                type="button"
                onClick={() => void handle(() => signInWithGoogle(role!))}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-background text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google as {role === "employer" ? "Employer" : "Freelancer"}
              </motion.button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-muted-foreground">or sign in with email</span>
                </div>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); void handle(() => signInWithEmail(email, password)); }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/signup" className="font-medium text-green-600 hover:text-green-700 transition">
                  Sign up
                </Link>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
