'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { onAuthChange, getUserProfile, UserProfile } from '@/lib/auth';
import { Job, Application } from '@/lib/types';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

interface EnrichedApplication extends Application {
  freelancer_name?: string;
  freelancer_pfi_score?: number;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState('');

  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState('');

  // Auth
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

  // Fetch job by fetching all jobs and filtering by id
  useEffect(() => {
    const fetchJob = async () => {
      setJobLoading(true);
      setJobError('');
      try {
        const res = await fetch(`${API_BASE}/api/jobs`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data: Job[] = await res.json();
        const found = data.find((j) => j.id === jobId);
        if (!found) {
          setJobError('Job not found.');
        } else {
          setJob(found);
        }
      } catch {
        setJobError('Could not load job details. Please try again.');
      } finally {
        setJobLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  // Fetch applications (employer only, for their own job)
  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/applications`);
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data: EnrichedApplication[] = await res.json();
      setApplications(data);
    } catch {
      // silently fail — not critical
    } finally {
      setAppsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!authLoading && user && job && user.role === 'employer' && job.employer_id === user.uid) {
      fetchApplications();
    }
  }, [authLoading, user, job, fetchApplications]);

  const handleUpdateApplication = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setUpdatingAppId(appId);
    setUpdateError('');
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || 'Failed to update application');
      }
      // Refresh applications and job status
      await fetchApplications();
      // Re-fetch job to reflect FILLED status
      const jobRes = await fetch(`${API_BASE}/api/jobs`);
      if (jobRes.ok) {
        const jobs: Job[] = await jobRes.json();
        const updated = jobs.find((j) => j.id === jobId);
        if (updated) setJob(updated);
      }
    } catch (e: unknown) {
      setUpdateError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const isOwnerEmployer = user && job && user.role === 'employer' && job.employer_id === user.uid;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'bg-green-500/20 text-green-400 border border-green-500/30',
      FILLED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      CLOSED: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      PENDING: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
      ACCEPTED: 'bg-green-500/20 text-green-400 border border-green-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return map[status] ?? 'bg-slate-700 text-slate-300';
  };

  if (jobLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
          <p className="text-red-400 mb-4">{jobError || 'Job not found.'}</p>
          <Link href="/jobs" className="text-blue-400 hover:text-blue-300 transition">
            ← Back to Job Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href="/jobs" className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">{job.title}</h1>
              <p className="text-slate-400 text-sm">Job Detail</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Job Details Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-5">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">{job.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusBadge(job.status)}`}>
              {job.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed">{job.description}</p>

          {/* Skills */}
          {job.required_skills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-700/50 text-sm">
            <div className="flex items-center gap-2 text-green-400">
              <DollarSign className="w-4 h-4 opacity-70" />
              <span>
                ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar className="w-4 h-4 opacity-70" />
              <span>{job.timeline_days} days</span>
            </div>
          </div>
        </div>

        {/* Employer view: applications list */}
        {isOwnerEmployer && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Applications
              {applications.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-400">({applications.length})</span>
              )}
            </h3>

            {updateError && (
              <p className="text-red-400 text-sm mb-4">{updateError}</p>
            )}

            {appsLoading ? (
              <div className="flex items-center gap-3 text-slate-400 py-6">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400">No applications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-medium text-white">
                          {app.freelancer_name || 'Unknown Freelancer'}
                        </p>
                        <p className="text-sm text-slate-400">
                          PFI Score:{' '}
                          <span className="text-blue-400 font-medium">
                            {app.pfi_score_at_apply ?? app.freelancer_pfi_score ?? '—'}
                          </span>
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    {app.cover_note && (
                      <p className="text-slate-300 text-sm mb-4 leading-relaxed border-l-2 border-slate-600 pl-3">
                        {app.cover_note}
                      </p>
                    )}

                    {app.status === 'PENDING' && (
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleUpdateApplication(app.id, 'ACCEPTED')}
                          disabled={updatingAppId === app.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {updatingAppId === app.id ? 'Updating...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleUpdateApplication(app.id, 'REJECTED')}
                          disabled={updatingAppId === app.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
                        >
                          <XCircle className="w-4 h-4" />
                          {updatingAppId === app.id ? 'Updating...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {app.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                        <CheckCircle className="w-4 h-4" />
                        Accepted
                      </div>
                    )}

                    {app.status === 'REJECTED' && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Freelancer / non-owner view: apply button */}
        {!isOwnerEmployer && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {job.status === 'OPEN' ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium mb-1">Interested in this role?</p>
                  <p className="text-slate-400 text-sm">Submit your application with a cover note.</p>
                </div>
                <Link
                  href={`/jobs/${jobId}/apply`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition whitespace-nowrap"
                >
                  <Briefcase className="w-4 h-4" />
                  Apply Now
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-400">
                <Clock className="w-5 h-5 opacity-60" />
                <span className="font-medium">Applications Closed</span>
                <span className="text-sm">— This job is no longer accepting applications.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
