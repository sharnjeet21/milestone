'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { ArrowLeft, Loader, CheckCircle2, AlertCircle } from 'lucide-react';

function SubmitWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [submittedWork, setSubmittedWork] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const data = await api.getProject(projectId);
        setProject(data);
        if (data.milestones && data.milestones.length > 0) {
          setSelectedMilestone(data.milestones[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !submittedWork) {
      alert('Please select a milestone and provide work details');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitMilestone({
        project_id: projectId!,
        milestone_id: selectedMilestone,
        submitted_work: submittedWork,
        freelancer_id: 'freelancer_' + Date.now(),
        days_taken: 1,
      });

      alert('Work submitted successfully!');
      router.push('/freelancer');
    } catch (error) {
      console.error('Failed to submit work:', error);
      alert('Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-slate-400">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/freelancer" className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="section-title text-3xl">{project.title}</h1>
              <p className="text-slate-400 text-sm mt-1">Submit your work for evaluation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Milestones List */}
          <div className="md:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Milestones</h3>
              <div className="space-y-2">
                {project.milestones?.map((milestone) => (
                  <button
                    key={milestone.id}
                    onClick={() => setSelectedMilestone(milestone.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      selectedMilestone === milestone.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{milestone.title}</p>
                    <p className="text-xs opacity-75 mt-1">${milestone.payment_amount}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="md:col-span-2">
            {selectedMilestone && project.milestones && (
              <div className="card">
                {(() => {
                  const milestone = project.milestones.find(m => m.id === selectedMilestone);
                  return (
                    <>
                      <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-white mb-2">{milestone?.title}</h3>
                        <p className="text-slate-400">{milestone?.description}</p>
                      </div>

                      {milestone?.checklist && milestone.checklist.length > 0 && (
                        <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Checklist Items
                          </h4>
                          <div className="space-y-2">
                            {milestone.checklist.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className="w-5 h-5 rounded border-2 border-slate-500 mt-0.5 flex-shrink-0 flex items-center justify-center hover:border-cyan-400 transition cursor-pointer" />
                                <div>
                                  <p className="text-white font-medium">{item.item}</p>
                                  <p className="text-slate-500 text-xs">Weight: {item.weight}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-3">
                            Describe Your Work
                          </label>
                          <textarea
                            value={submittedWork}
                            onChange={(e) => setSubmittedWork(e.target.value)}
                            required
                            rows={7}
                            className="input-field resize-none"
                            placeholder="Describe what you've completed, include links to deliverables, code repositories, screenshots, etc. Be detailed and specific."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              Submit Work
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitWork() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <SubmitWorkContent />
    </Suspense>
  );
}
