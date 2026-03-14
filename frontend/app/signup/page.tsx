'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

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
      router.push(role === 'employer' ? '/employer/dashboard' : '/freelancer/workspace');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle(role);
      router.push(role === 'employer' ? '/employer/dashboard' : '/freelancer/workspace');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
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

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-background text-sm font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google as {role === 'employer' ? 'Employer' : 'Freelancer'}
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
