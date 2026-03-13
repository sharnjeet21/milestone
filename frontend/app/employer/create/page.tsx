'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, Loader, Sparkles } from 'lucide-react';

export default function CreateProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_budget: '',
    timeline_days: '',
    deliverable_type: 'code',
    tech_stack: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const techStack = formData.tech_stack
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      await api.createProject({
        title: formData.title,
        description: formData.description,
        total_budget: parseFloat(formData.total_budget),
        timeline_days: parseInt(formData.timeline_days),
        deliverable_type: formData.deliverable_type,
        tech_stack: techStack,
        employer_id: 'employer_' + Date.now(),
      });

      router.push('/employer');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/employer" className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="section-title text-3xl">Create New Project</h1>
              <p className="text-slate-400 text-sm mt-1">Let AI decompose your project into milestones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Project Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="e.g., Build E-commerce Platform"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="input-field resize-none"
              placeholder="Describe your project in detail. Include requirements, features, and any specific details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Budget ($)</label>
              <input
                type="number"
                name="total_budget"
                value={formData.total_budget}
                onChange={handleChange}
                required
                min="100"
                className="input-field"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-3">Timeline (days)</label>
              <input
                type="number"
                name="timeline_days"
                value={formData.timeline_days}
                onChange={handleChange}
                required
                min="7"
                className="input-field"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">Deliverable Type</label>
            <select
              name="deliverable_type"
              value={formData.deliverable_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="code">💻 Code</option>
              <option value="content">📝 Content</option>
              <option value="design">🎨 Design</option>
              <option value="data">📊 Data</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">Tech Stack (comma-separated)</label>
            <input
              type="text"
              name="tech_stack"
              value={formData.tech_stack}
              onChange={handleChange}
              className="input-field"
              placeholder="React, Node.js, PostgreSQL, Docker"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Project with AI
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
