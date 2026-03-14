'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, DollarSign, TrendingUp, Search, ArrowUpRight, ArrowDownLeft, AlertTriangle, Shield, Zap } from 'lucide-react';
import { assessMilestoneRisk, optimizePaymentSchedule } from '@/lib/api';

export default function EscrowVault() {
  const [vaultId, setVaultId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [freelancerId, setFreelancerId] = useState('');
  const [vaultData, setVaultData] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vault' | 'risk' | 'schedule'>('vault');

  const handleSearchVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:9001/api/escrow/${vaultId}`);
      if (response.ok) {
        setVaultData(await response.json());
      } else {
        alert('Vault not found');
        setVaultData(null);
      }
    } catch {
      alert('Failed to fetch vault');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !freelancerId) { alert('Please enter Project ID and Freelancer ID'); return; }
    setLoading(true);
    try {
      const data = await assessMilestoneRisk(projectId, 'milestone-1', freelancerId);
      setRiskAssessment(data.risk_assessment);
      setActiveTab('risk');
    } catch { alert('Failed to assess risk'); }
    finally { setLoading(false); }
  };

  const handleOptimizeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !freelancerId) { alert('Please enter Project ID and Freelancer ID'); return; }
    setLoading(true);
    try {
      const data = await optimizePaymentSchedule(projectId, freelancerId);
      setPaymentSchedule(data.optimization);
      setActiveTab('schedule');
    } catch { alert('Failed to optimize schedule'); }
    finally { setLoading(false); }
  };

  const riskColor = (level: string) => ({ LOW: 'text-green-600', MEDIUM: 'text-yellow-600', HIGH: 'text-orange-600', CRITICAL: 'text-red-600' }[level] ?? 'text-muted-foreground');
  const riskBg = (level: string) => ({ LOW: 'border-green-500/30 bg-green-500/10', MEDIUM: 'border-yellow-500/30 bg-yellow-500/10', HIGH: 'border-orange-500/30 bg-orange-500/10', CRITICAL: 'border-red-500/30 bg-red-500/10' }[level] ?? 'border-border/60 bg-white/80');

  const txIcon = (type: string) => {
    if (type === 'DEPOSIT') return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
    if (type === 'MILESTONE_PAYMENT') return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
    if (type === 'REFUND') return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
    if (type === 'SUCCESS_FEE') return <TrendingUp className="w-4 h-4 text-purple-600" />;
    return <DollarSign className="w-4 h-4 text-muted-foreground" />;
  };

  const tabs = [
    { id: 'vault', label: 'Vault Status', icon: Lock },
    { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
    { id: 'schedule', label: 'Payment Schedule', icon: Zap },
  ] as const;

  const inputCls = "h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60";
  const btnCls = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.06),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">Escrow</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">Smart Escrow Vault</h1>
          <p className="text-muted-foreground mt-1">AI-powered payment management & risk assessment</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 rounded-2xl border border-border/60 bg-white/80 backdrop-blur p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Vault Tab */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <form onSubmit={handleSearchVault}>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={vaultId}
                    onChange={(e) => setVaultId(e.target.value)}
                    placeholder="Enter Vault ID..."
                    className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                  />
                </div>
                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {vaultData ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Amount', value: `$${vaultData.total_amount}`, cls: 'text-foreground' },
                    { label: 'Locked', value: `$${vaultData.locked_amount}`, cls: 'text-yellow-600' },
                    { label: 'Released', value: `$${vaultData.released_amount}`, cls: 'text-green-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="rounded-[1.5rem] border border-border/60 bg-white/80 backdrop-blur p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className={`text-2xl font-semibold mt-2 ${cls}`}>{value}</p>
                    </div>
                  ))}
                  <div className="rounded-[1.5rem] border border-border/60 bg-white/80 backdrop-blur p-5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${vaultData.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {vaultData.status}
                    </span>
                  </div>
                </div>

                {vaultData.transactions?.length > 0 && (
                  <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Transaction History</h3>
                    <div className="space-y-3">
                      {vaultData.transactions.map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-border/40 bg-background/60 hover:border-green-500/30 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl border border-border/50 bg-background flex items-center justify-center">
                              {txIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">{tx.description}</p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-foreground">${tx.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-16 text-center">
                <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Enter a vault ID to view escrow details</p>
              </div>
            )}
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <form onSubmit={handleAssessRisk}>
              <div className="grid sm:grid-cols-3 gap-2">
                <input type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project ID" className={inputCls} />
                <input type="text" value={freelancerId} onChange={(e) => setFreelancerId(e.target.value)} placeholder="Freelancer ID" className={inputCls} />
                <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Assessing...' : 'Assess Risk'}</button>
              </div>
            </form>

            {riskAssessment ? (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[2rem] border-2 p-6 ${riskBg(riskAssessment.risk_level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Risk Level</p>
                      <p className={`text-4xl font-bold mt-2 ${riskColor(riskAssessment.risk_level)}`}>{riskAssessment.risk_level}</p>
                      <p className="text-sm text-muted-foreground mt-2">Score: {riskAssessment.risk_score}/100</p>
                    </div>
                    <Shield className={`w-10 h-10 ${riskColor(riskAssessment.risk_level)}`} />
                  </div>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Risk Factors</h3>
                    <ul className="space-y-2">
                      {riskAssessment.risk_factors?.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-red-500 mt-0.5">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Mitigation Strategies</h3>
                    <ul className="space-y-2">
                      {riskAssessment.mitigation_strategies?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <span className="text-green-600 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Recommendation</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Recommendation</p>
                      <p className="text-xl font-semibold text-foreground mt-1">{riskAssessment.payment_recommendation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Hold Percentage</p>
                      <p className="text-xl font-semibold text-yellow-600 mt-1">{riskAssessment.recommended_hold_percentage}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{riskAssessment.reasoning}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-16 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Enter Project ID and Freelancer ID to assess risk</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <form onSubmit={handleOptimizeSchedule}>
              <div className="grid sm:grid-cols-3 gap-2">
                <input type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Project ID" className={inputCls} />
                <input type="text" value={freelancerId} onChange={(e) => setFreelancerId(e.target.value)} placeholder="Freelancer ID" className={inputCls} />
                <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Optimizing...' : 'Optimize Schedule'}</button>
              </div>
            </form>

            {paymentSchedule ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Strategy', value: paymentSchedule.payment_strategy, cls: 'text-blue-600' },
                    { label: 'Immediate Release', value: `$${paymentSchedule.total_immediate_release}`, cls: 'text-green-600' },
                    { label: 'Total Held', value: `$${paymentSchedule.total_held}`, cls: 'text-yellow-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="rounded-[1.5rem] border border-border/60 bg-white/80 backdrop-blur p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className={`text-xl font-semibold mt-2 ${cls}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Milestone Adjustments</h3>
                  <div className="space-y-3">
                    {paymentSchedule.milestone_adjustments?.map((adj: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-border/40 bg-background/60">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-medium text-foreground text-sm">Milestone {adj.milestone_index + 1}</p>
                          <span className="rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-600">{adj.release_condition}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div><p className="text-muted-foreground text-xs">Original</p><p className="font-semibold text-foreground">${adj.original_payment}</p></div>
                          <div><p className="text-muted-foreground text-xs">Adjusted</p><p className="font-semibold text-green-600">${adj.adjusted_payment}</p></div>
                          <div><p className="text-muted-foreground text-xs">Hold</p><p className="font-semibold text-yellow-600">${adj.hold_amount}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-6">
                  <p className="text-xs text-muted-foreground mb-2">Strategy Rationale</p>
                  <p className="text-sm text-foreground">{paymentSchedule.strategy_rationale}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-[2rem] border border-border/60 bg-white/80 backdrop-blur p-16 text-center">
                <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Enter Project ID and Freelancer ID to optimize payment schedule</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
