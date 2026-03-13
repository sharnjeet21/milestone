'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '@/lib/api';

export default function PaymentPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [projectId, setProjectId] = useState('demo-project-1');
  const [milestoneId, setMilestoneId] = useState('m2');
  const [freelancerId, setFreelancerId] = useState('demo-freelancer-1');
  const [submittedWork, setSubmittedWork] = useState('');
  const [daysTaken, setDaysTaken] = useState(15);
  const [revisionCount, setRevisionCount] = useState(0);
  
  // Results
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [pfiUpdate, setPfiUpdate] = useState<any>(null);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStep(2);

    try {
      // Simulate work submission and evaluation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await api.submitMilestone({
        project_id: projectId,
        milestone_id: milestoneId,
        freelancer_id: freelancerId,
        submitted_work: submittedWork,
        submission_type: 'text',
        days_taken: daysTaken,
        revision_count: revisionCount
      });

      setEvaluationResult(result.evaluation);
      setPaymentResult(result.payment_result);
      setPfiUpdate(result.pfi_update);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setEvaluationResult(null);
    setPaymentResult(null);
    setPfiUpdate(null);
    setError('');
    setSubmittedWork('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title text-3xl mb-2">Escrow Payment Flow</h1>
        <p className="text-slate-400">Submit work → AI evaluation → Automatic payment</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-blue-400 bg-blue-500/20' : 'border-slate-600'
              }`}>
                1
              </div>
              <span className="font-semibold">Submit Work</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
            
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-slate-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-blue-400 bg-blue-500/20' : 'border-slate-600'
              }`}>
                {loading && step === 2 ? <Loader className="w-5 h-5 animate-spin" /> : '2'}
              </div>
              <span className="font-semibold">AI Evaluation</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
            
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-green-400' : 'text-slate-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'border-green-400 bg-green-500/20' : 'border-slate-600'
              }`}>
                {step >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-semibold">Payment Released</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Submit Work */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6">Submit Milestone Work</h2>
            
            <form onSubmit={handleSubmitWork} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Try: demo-project-1</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Milestone ID</label>
                  <input
                    type="text"
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Try: m2</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Freelancer ID</label>
                <input
                  type="text"
                  value={freelancerId}
                  onChange={(e) => setFreelancerId(e.target.value)}
                  className="input-field"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Try: demo-freelancer-1</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Submitted Work</label>
                <textarea
                  value={submittedWork}
                  onChange={(e) => setSubmittedWork(e.target.value)}
                  className="input-field min-h-32"
                  placeholder="Describe the work completed for this milestone..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Days Taken</label>
                  <input
                    type="number"
                    value={daysTaken}
                    onChange={(e) => setDaysTaken(parseInt(e.target.value))}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Revision Count</label>
                  <input
                    type="number"
                    value={revisionCount}
                    onChange={(e) => setRevisionCount(parseInt(e.target.value))}
                    className="input-field"
                    min="0"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Submit & Process Payment
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 2 && loading && (
          <div className="card text-center py-16">
            <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Processing Submission</h3>
            <p className="text-slate-400">AI is evaluating the work quality...</p>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && evaluationResult && paymentResult && pfiUpdate && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="card border-2 border-green-500/30 bg-green-500/10">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-12 h-12 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Payment Processed Successfully!</h3>
                  <p className="text-slate-300">{paymentResult.message}</p>
                </div>
              </div>
            </div>

            {/* Quality Evaluation */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Quality Evaluation</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Completion Score</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{evaluationResult.completion_score}%</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-2xl font-bold text-green-400 mt-2">{evaluationResult.status}</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Recommendation</p>
                  <p className="text-2xl font-bold text-white mt-2">{evaluationResult.recommendation}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {evaluationResult.strengths?.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-green-300">
                        <span className="mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {evaluationResult.gaps && evaluationResult.gaps.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Areas for Improvement</p>
                    <ul className="space-y-1">
                      {evaluationResult.gaps.map((gap: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-yellow-300">
                          <span className="mt-1">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-400" />
                Payment Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm">Amount Released</p>
                  <p className="text-4xl font-bold text-green-400 mt-2">
                    ${paymentResult.transaction?.amount_released || evaluationResult.payout_amount}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payout Percentage</p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {(evaluationResult.payout_percentage * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              
              {paymentResult.transaction && (
                <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-sm mb-2">Transaction ID</p>
                  <p className="text-white font-mono text-sm break-all">{paymentResult.transaction.transaction_id}</p>
                </div>
              )}
            </div>

            {/* PFI Score Update */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Professional Fidelity Index Update</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Previous Score</p>
                  <p className="text-3xl font-bold text-slate-300 mt-2">{pfiUpdate.previous_score}</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">New Score</p>
                  <p className="text-3xl font-bold text-blue-400 mt-2">{pfiUpdate.new_score}</p>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Change</p>
                  <p className={`text-3xl font-bold mt-2 ${pfiUpdate.score_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pfiUpdate.score_change >= 0 ? '+' : ''}{pfiUpdate.score_change}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Tier</span>
                  <span className="badge badge-primary">{pfiUpdate.tier}</span>
                </div>
                <p className="text-slate-300 text-sm">{pfiUpdate.perks}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={resetForm} className="btn-primary flex-1">
                Process Another Payment
              </button>
              <Link href="/employer" className="btn-secondary flex-1 text-center">
                View All Projects
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
