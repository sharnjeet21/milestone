'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Star } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001';

interface FreelancerResult {
  id: string;
  name: string;
  pfi_score: number;
  skills: string[];
  hourly_rate: number;
  available: boolean;
}

function getPFIBadgeColor(score: number): string {
  if (score >= 800) return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
  if (score >= 650) return 'bg-green-500/20 text-green-300 border border-green-500/40';
  if (score >= 500) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
  if (score >= 400) return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
  return 'bg-red-500/20 text-red-300 border border-red-500/40';
}

function getPFITierLabel(score: number): string {
  if (score >= 800) return 'Elite';
  if (score >= 650) return 'Strong';
  if (score >= 500) return 'Average';
  if (score >= 400) return 'Below Avg';
  return 'At Risk';
}

export default function FreelancerSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FreelancerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 3) {
      setError('Please enter at least 3 characters to search.');
      return;
    }

    setError(null);
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `${API_BASE}/api/freelancers/search?q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/employer" className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="section-title text-3xl">Find Freelancers</h1>
              <p className="text-slate-400 text-sm mt-1">Search by skills, role, or expertise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. React developer, Python, UI/UX..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Validation error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Searching freelancers...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="card text-center py-16">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">No results found</p>
            <p className="text-slate-500 text-sm mt-2">Try different keywords or broaden your search</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid gap-4">
            {results.map((freelancer) => (
              <div key={freelancer.id} className="card-hover group">
                <div className="flex items-start justify-between gap-4">
                  {/* Name + PFI badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
                      {freelancer.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getPFIBadgeColor(freelancer.pfi_score)}`}>
                      <Star className="w-3 h-3" />
                      PFI {freelancer.pfi_score} · {getPFITierLabel(freelancer.pfi_score)}
                    </span>
                  </div>

                  {/* Availability */}
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    freelancer.available
                      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${freelancer.available ? 'bg-green-400' : 'bg-red-400'}`} />
                    {freelancer.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Skills */}
                {freelancer.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {freelancer.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-slate-700/60 text-slate-300 text-xs rounded-lg border border-slate-600/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hourly rate */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-slate-500 text-xs uppercase tracking-wide">Hourly Rate</span>
                  <p className="text-white font-semibold mt-0.5">
                    ${freelancer.hourly_rate}<span className="text-slate-400 font-normal text-sm">/hr</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
