'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { ArrowLeft, Plus, Briefcase, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

export default function EmployerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'COMPLETED':
        return 'badge-primary';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="section-title text-3xl">Employer Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your projects and milestones</p>
              </div>
            </div>
            <Link href="/employer/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-6 text-lg">No projects yet</p>
            <Link href="/employer/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card-hover group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition">{project.title}</h3>
                      <span className={`badge ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{project.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-400 opacity-60" />
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Budget</p>
                      <p className="text-white font-semibold">${project.total_budget}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400 opacity-60" />
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Timeline</p>
                      <p className="text-white font-semibold">{project.timeline_days} days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 opacity-60" />
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Milestones</p>
                      <p className="text-white font-semibold">{project.milestones?.length || 0}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Type</p>
                    <p className="text-white font-semibold capitalize">{project.deliverable_type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
