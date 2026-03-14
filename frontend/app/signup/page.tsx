'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { signUpWithEmail } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'employer' | 'freelancer'>('freelancer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password, displayName, role);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur"
        >
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">
            Get started
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground">
            Create your account
          </h1>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                />
              </div>
            </div>

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
                  minLength={6}
                  className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                />
              </div>
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    role === 'freelancer'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border/50 bg-background hover:border-green-500/40'
                  }`}
                >
                  <p className="font-semibold text-foreground text-sm">Freelancer</p>
                  <p className="text-xs text-muted-foreground mt-1">Find work & earn</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    role === 'employer'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border/50 bg-background hover:border-green-500/40'
                  }`}
                >
                  <p className="font-semibold text-foreground text-sm">Employer</p>
                  <p className="text-xs text-muted-foreground mt-1">Post projects</p>
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-green-600 transition hover:text-green-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
