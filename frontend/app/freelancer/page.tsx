'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { ArrowLeft, Zap, Code2, Palette, Database } from 'lucide-react';

export default function FreelancerPortal() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects((data as Project[]).filter((p: Project) => p.status === 'ACTIVE'));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <Code2 className="w-5 h-5" />;
      case 'design':
        return <Palette className="w-5 h-5" />;
      case 'data':
        return <Database className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

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
              <h1 className="section-title text-3xl">Available Projects</h1>
              <p className="text-slate-400 text-sm mt-1">Find and bid on projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-16">
            <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">No active projects available</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card-hover group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition">{project.title}</h3>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <p className="text-slate-400">{project.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-700/50 mb-4">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Budget</p>
                    <p className="text-white font-semibold">${project.total_budget}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Timeline</p>
                    <p className="text-white font-semibold">{project.timeline_days} days</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-cyan-400">{getTypeIcon(project.deliverable_type)}</span>
                      <p className="text-white font-semibold capitalize">{project.deliverable_type}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Milestones</p>
                    <p className="text-white font-semibold">{project.milestones?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Success Fee</p>
                    <p className="text-green-400 font-semibold">15%</p>
                  </div>
                </div>

                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Tech Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs font-medium border border-slate-600/50">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/freelancer/submit?projectId=${project.id}`}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/20"
                >
                  View Milestones
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
