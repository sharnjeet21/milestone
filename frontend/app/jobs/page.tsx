'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthChange, getUserProfile, UserProfile } from '@/lib/auth';
import { Job } from '@/lib/types';
import { Briefcase, Plus, DollarSign, Calendar, Tag, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

type Tab = 'browse' | 'post';

export default function JobsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('browse');

  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  // Post job form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    budget_min: '',
    budget_max: '',
    timeline_days: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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

  const fetchJobs = async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      setJobsError('Could not load jobs. Please try again.');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = {
        employer_id: user?.uid ?? 'anonymous',
        title: form.title,
        description: form.description,
        required_skills: form.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
        budget_min: parseFloat(form.budget_min) || 0,
        budget_max: parseFloat(form.budget_max) || 0,
        timeline_days: parseInt(form.timeline_days) || 30,
      };
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to post job');
      }
      setSubmitSuccess('Job posted successfully!');
      setForm({ title: '', description: '', required_skills: '', budget_min: '', budget_max: '', timeline_days: '' });
      fetchJobs();
    } catch (e: any) {
      setSubmitError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const myJobs = user ? jobs.filter((j) => j.employer_id === user.uid) : [];
  const openJobs = jobs.filter((j) => j.status === 'OPEN');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'badge-success';
      case 'FILLED': return 'badge-primary';
      case 'CLOSED': return 'badge-warning';
      default: return 'badge-warning';
    }
  };

  const JobCard = ({ job, showStatus = false }: { job: Job; showStatus?: boolean }) => (
    <div className="card-hover group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
              {job.title}
            </h3>
            {showStatus && (
              <span className={`badge ${getStatusColor(job.status)}`}>{job.status}</span>
            )}
          </div>
          <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>
        </div>
      </div>

      {job.required_skills?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {job.required_skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 text-xs">
              <Tag className="w-3 h-3" />
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-3 border-t border-slate-700/50 text-sm">
        <div className="flex items-center gap-1.5 text-green-400">
          <DollarSign className="w-4 h-4 opacity-70" />
          <span>${job.budget_min} – ${job.budget_max}</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-400">
          <Calendar className="w-4 h-4 opacity-70" />
          <span>{job.timeline_days} days</span>
        </div>
        <div className="ml-auto">
          <Link
            href={`/jobs/${job.id}`}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="section-title text-3xl">Job Board</h1>
              <p className="text-slate-400 text-sm mt-1">Browse open opportunities or post a new job</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${
              activeTab === 'browse'
                ? 'bg-slate-800 text-white border border-b-0 border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </span>
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${
              activeTab === 'post'
                ? 'bg-slate-800 text-white border border-b-0 border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post a Job
            </span>
          </button>
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-400">Loading jobs...</p>
                </div>
              </div>
            ) : jobsError ? (
              <div className="card text-center py-12">
                <p className="text-red-400">{jobsError}</p>
                <button onClick={fetchJobs} className="btn-primary mt-4">Retry</button>
              </div>
            ) : openJobs.length === 0 ? (
              <div className="card text-center py-16">
                <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg mb-4">No open jobs right now</p>
                <button onClick={() => setActiveTab('post')} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Post the first job
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {openJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post a Job Tab */}
        {activeTab === 'post' && (
          <div className="max-w-2xl">
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">Post a New Job</h2>
              <form onSubmit={handlePostJob} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Senior React Developer"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    required
                    rows={4}
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Required Skills</label>
                  <input
                    name="required_skills"
                    value={form.required_skills}
                    onChange={handleFormChange}
                    placeholder="React, TypeScript, Node.js (comma-separated)"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Budget Min ($)</label>
                    <input
                      name="budget_min"
                      type="number"
                      min="0"
                      value={form.budget_min}
                      onChange={handleFormChange}
                      placeholder="500"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Budget Max ($)</label>
                    <input
                      name="budget_max"
                      type="number"
                      min="0"
                      value={form.budget_max}
                      onChange={handleFormChange}
                      placeholder="2000"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Timeline (days)</label>
                  <input
                    name="timeline_days"
                    type="number"
                    min="1"
                    value={form.timeline_days}
                    onChange={handleFormChange}
                    placeholder="30"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                {submitError && (
                  <p className="text-red-400 text-sm">{submitError}</p>
                )}
                {submitSuccess && (
                  <p className="text-green-400 text-sm">{submitSuccess}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </form>
            </div>

            {/* My Jobs */}
            {user && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">My Posted Jobs</h2>
                {jobsLoading ? (
                  <p className="text-slate-400">Loading...</p>
                ) : myJobs.length === 0 ? (
                  <div className="card text-center py-10">
                    <p className="text-slate-400">You haven't posted any jobs yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {myJobs.map((job) => (
                      <JobCard key={job.id} job={job} showStatus />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
