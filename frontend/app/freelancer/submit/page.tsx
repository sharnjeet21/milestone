'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProject, submitMilestone } from '@/lib/api';
import { Project } from '@/lib/types';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
    if (!projectId) return;
    getProject(projectId)
      .then((data: Project) => {
        setProject(data);
        if (data.milestones?.length > 0) setSelectedMilestone(data.milestones[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !submittedWork) {
      alert('Please select a milestone and provide work details');
      return;
    }
    setSubmitting(true);
    try {
      await submitMilestone({
        project_id: projectId!,
        milestone_id: selectedMilestone,
        submitted_work: submittedWork,
        freelancer_id: 'freelancer_' + Date.now(),
        days_taken: 1,
      });
      alert('Work submitted successfully!');
      router.push('/freelancer');
    } catch {
      alert('Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  const spinnerBg = "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] flex items-center justify-center";

  if (loading) return (
    <div className={spinnerBg}>
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading project...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className={spinnerBg}>
      <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-10 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-muted-foreground">Project not found</p>
      </div>
    </div>
  );

  const milestone = project.milestones?.find(m => m.id === selectedMilestone);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/freelancer" className="p-2 rounded-xl border border-border/50 bg-white/80 hover:border-green-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">Submit Work</p>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">{project.title}</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Milestones sidebar */}
          <div className="md:col-span-1">
            <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-foreground mb-3">Milestones</h3>
              <div className="space-y-2">
                {project.milestones?.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMilestone(m.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition text-sm ${
                      selectedMilestone === m.id
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'border border-border/50 bg-background text-foreground hover:border-green-500/40'
                    }`}
                  >
                    <p className="font-medium">{m.title}</p>
                    <p className={`text-xs mt-0.5 ${selectedMilestone === m.id ? 'text-white/70' : 'text-muted-foreground'}`}>${m.payment_amount}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission form */}
          <div className="md:col-span-2">
            {milestone && (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6"
              >
                <h3 className="text-xl font-semibold text-foreground mb-1">{milestone.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{milestone.description}</p>

                {milestone.checklist && milestone.checklist.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl border border-border/40 bg-background/60">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Checklist
                    </h4>
                    <div className="space-y-2">
                      {milestone.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <div className="w-4 h-4 rounded border-2 border-border/60 mt-0.5 flex-shrink-0 hover:border-green-500 transition cursor-pointer" />
                          <div>
                            <p className="text-foreground font-medium">{item.item}</p>
                            <p className="text-xs text-muted-foreground">Weight: {item.weight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Describe Your Work</label>
                    <textarea
                      value={submittedWork}
                      onChange={(e) => setSubmittedWork(e.target.value)}
                      required
                      rows={7}
                      placeholder="Describe what you've completed, include links to deliverables, code repositories, screenshots, etc."
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none transition focus:border-green-500/60 resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {submitting ? 'Submitting...' : 'Submit Work'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitWork() {
  const spinnerBg = "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] flex items-center justify-center";
  return (
    <Suspense fallback={
      <div className={spinnerBg}>
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    }>
      <SubmitWorkContent />
    </Suspense>
  );
}
