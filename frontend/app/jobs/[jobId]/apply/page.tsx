'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile, UserProfile } from '@/lib/auth';
import { ArrowLeft, Briefcase, CheckCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancer_id: user.uid, cover_note: coverNote }),
      });

      if (res.status === 409) {
        setError('You have already applied to this job.');
        return;
      }

      if (res.status === 422) {
        setError('This job is no longer accepting applications.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || 'Failed to submit application.');
      }

      setSuccess(true);
      setTimeout(() => router.push(`/jobs/${jobId}`), 2500);
    } catch (err: unknown) {
      if (!error) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href={`/jobs/${jobId}`} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Apply for Job</h1>
              <p className="text-slate-400 text-sm">Submit your application</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {success ? (
          <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-8 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Application Submitted</h2>
            <p className="text-slate-400">Your application has been sent. Redirecting you back to the job...</p>
            <Link
              href={`/jobs/${jobId}`}
              className="inline-block mt-2 text-blue-400 hover:text-blue-300 transition text-sm"
            >
              ← Back to job
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Cover Note</h2>
                <p className="text-slate-400 text-sm">Tell the employer why you're a great fit</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="cover-note" className="block text-sm font-medium text-slate-300 mb-2">
                  Cover note
                </label>
                <textarea
                  id="cover-note"
                  rows={7}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Introduce yourself and explain why you're the right person for this job..."
                  className="w-full bg-slate-900/60 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 text-sm leading-relaxed resize-none focus:outline-none focus:border-blue-500/60 transition"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition text-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <Link
                  href={`/jobs/${jobId}`}
                  className="px-5 py-2.5 border border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg transition text-sm"
                >
                  Cancel
                </Link>
              </div>

              {!user && !authLoading && (
                <p className="text-amber-400 text-sm text-center">
                  You must be signed in to apply.
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
