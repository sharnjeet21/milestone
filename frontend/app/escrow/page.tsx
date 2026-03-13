'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, DollarSign, TrendingUp, Search, ArrowUpRight, ArrowDownLeft, AlertTriangle, Shield, Zap } from 'lucide-react';
import { api } from '@/lib/api';

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
        const data = await response.json();
        setVaultData(data);
      } else {
        alert('Vault not found');
        setVaultData(null);
      }
    } catch (error) {
      console.error('Failed to fetch vault:', error);
      alert('Failed to fetch vault');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !freelancerId) {
      alert('Please enter Project ID and Freelancer ID');
      return;
    }

    setLoading(true);
    try {
      const data = await api.assessMilestoneRisk(projectId, 'milestone-1', freelancerId);
      setRiskAssessment(data.risk_assessment);
      setActiveTab('risk');
    } catch (error) {
      console.error('Failed to assess risk:', error);
      alert('Failed to assess risk');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !freelancerId) {
      alert('Please enter Project ID and Freelancer ID');
      return;
    }

    setLoading(true);
    try {
      const data = await api.optimizePaymentSchedule(projectId, freelancerId);
      setPaymentSchedule(data.optimization);
      setActiveTab('schedule');
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
      alert('Failed to optimize schedule');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-orange-400';
      case 'CRITICAL':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-500/10 border-green-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'MILESTONE_PAYMENT':
        return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
      case 'REFUND':
        return <ArrowDownLeft className="w-4 h-4 text-red-400" />;
      case 'SUCCESS_FEE':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="section-title text-3xl mb-2">Smart Escrow Vault</h1>
        <p className="text-slate-400">AI-powered payment management & risk assessment</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'vault'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Vault Status
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'risk'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Risk Assessment
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'schedule'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Payment Schedule
          </button>
        </div>

        {/* Vault Tab */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <form onSubmit={handleSearchVault} className="mb-8">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={vaultId}
                    onChange={(e) => setVaultId(e.target.value)}
                    placeholder="Enter Vault ID..."
                    className="input-field pl-12"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {vaultData && (
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Total Amount</p>
                        <p className="text-3xl font-bold text-white mt-2">${vaultData.total_amount}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center opacity-20">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Locked</p>
                        <p className="text-3xl font-bold text-yellow-400 mt-2">${vaultData.locked_amount}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center opacity-20">
                        <Lock className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Released</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">${vaultData.released_amount}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center opacity-20">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Status</p>
                      <div className="mt-2">
                        <span className={`badge ${vaultData.status === 'ACTIVE' ? 'badge-success' : 'badge-primary'}`}>
                          {vaultData.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                {vaultData.transactions && vaultData.transactions.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
                    <div className="space-y-3">
                      {vaultData.transactions.map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:border-slate-500 transition">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-600/50">
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{tx.type}</p>
                              <p className="text-slate-400 text-xs mt-1">{tx.description}</p>
                              <p className="text-slate-500 text-xs mt-2">{new Date(tx.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-white font-bold text-lg">${tx.amount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!vaultData && !loading && (
              <div className="card text-center py-16">
                <Lock className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">Enter a vault ID to view escrow details</p>
              </div>
            )}
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <form onSubmit={handleAssessRisk} className="mb-8">
              <div className="grid md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Project ID"
                  className="input-field"
                />
                <input
                  type="text"
                  value={freelancerId}
                  onChange={(e) => setFreelancerId(e.target.value)}
                  placeholder="Freelancer ID"
                  className="input-field"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Assessing...' : 'Assess Risk'}
                </button>
              </div>
            </form>

            {riskAssessment && (
              <div className="space-y-6">
                <div className={`card border-2 ${getRiskBgColor(riskAssessment.risk_level)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-sm uppercase tracking-wide">Risk Level</p>
                      <p className={`text-4xl font-bold mt-2 ${getRiskColor(riskAssessment.risk_level)}`}>
                        {riskAssessment.risk_level}
                      </p>
                      <p className="text-slate-400 text-sm mt-2">Risk Score: {riskAssessment.risk_score}/100</p>
                    </div>
                    <Shield className={`w-12 h-12 ${getRiskColor(riskAssessment.risk_level)}`} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Risk Factors</h3>
                    <ul className="space-y-2">
                      {riskAssessment.risk_factors?.map((factor: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Mitigation Strategies</h3>
                    <ul className="space-y-2">
                      {riskAssessment.mitigation_strategies?.map((strategy: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Recommendation</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Payment Recommendation</p>
                      <p className="text-2xl font-bold text-white mt-2">{riskAssessment.payment_recommendation}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Hold Percentage</p>
                      <p className="text-2xl font-bold text-yellow-400 mt-2">{riskAssessment.recommended_hold_percentage}%</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">{riskAssessment.reasoning}</p>
                </div>
              </div>
            )}

            {!riskAssessment && !loading && (
              <div className="card text-center py-16">
                <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">Enter Project ID and Freelancer ID to assess risk</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <form onSubmit={handleOptimizeSchedule} className="mb-8">
              <div className="grid md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Project ID"
                  className="input-field"
                />
                <input
                  type="text"
                  value={freelancerId}
                  onChange={(e) => setFreelancerId(e.target.value)}
                  placeholder="Freelancer ID"
                  className="input-field"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Optimizing...' : 'Optimize Schedule'}
                </button>
              </div>
            </form>

            {paymentSchedule && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="card">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Strategy</p>
                    <p className="text-2xl font-bold text-blue-400 mt-2">{paymentSchedule.payment_strategy}</p>
                  </div>
                  <div className="card">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Immediate Release</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">${paymentSchedule.total_immediate_release}</p>
                  </div>
                  <div className="card">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Total Held</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-2">${paymentSchedule.total_held}</p>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Milestone Adjustments</h3>
                  <div className="space-y-3">
                    {paymentSchedule.milestone_adjustments?.map((adj: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-semibold text-white">Milestone {adj.milestone_index + 1}</p>
                          <span className="badge badge-primary text-xs">{adj.release_condition}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Original</p>
                            <p className="text-white font-bold">${adj.original_payment}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Adjusted</p>
                            <p className="text-green-400 font-bold">${adj.adjusted_payment}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Hold</p>
                            <p className="text-yellow-400 font-bold">${adj.hold_amount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <p className="text-slate-400 text-sm">Strategy Rationale</p>
                  <p className="text-white mt-2">{paymentSchedule.strategy_rationale}</p>
                </div>
              </div>
            )}

            {!paymentSchedule && !loading && (
              <div className="card text-center py-16">
                <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">Enter Project ID and Freelancer ID to optimize payment schedule</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
