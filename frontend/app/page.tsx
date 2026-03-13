'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, DollarSign, TrendingUp, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MilestoneAI
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/employer/create" className="btn-primary text-sm">
              Post Project
            </Link>
            <Link href="/freelancer" className="btn-secondary text-sm">
              Find Work
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <span className="text-sm font-semibold text-blue-300">✨ AI-Powered Project Management</span>
          </div>
          
          <h1 className="section-title mb-6 text-5xl md:text-7xl leading-tight">
            Decompose Projects.<br />Evaluate Quality.<br />Manage Payments.
          </h1>
          
          <p className="section-subtitle mb-10 max-w-2xl mx-auto text-lg">
            MilestoneAI automatically breaks down projects into achievable milestones, evaluates work quality with AI precision, and manages escrow payments seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/employer/create" className="btn-primary inline-flex items-center justify-center gap-2 group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/employer" className="btn-secondary inline-flex items-center justify-center gap-2">
              View Projects
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="card-hover group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Decomposition</h3>
            <p className="text-slate-400 text-sm">Automatically break projects into logical, measurable milestones with AI precision</p>
          </div>

          <div className="card-hover group">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Escrow</h3>
            <p className="text-slate-400 text-sm">Secure payment management with milestone-based releases and full transparency</p>
          </div>

          <div className="card-hover group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quality Scoring</h3>
            <p className="text-slate-400 text-sm">AI evaluates submissions against objective criteria with detailed feedback</p>
          </div>

          <div className="card-hover group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">PFI Score</h3>
            <p className="text-slate-400 text-sm">Professional Fidelity Index tracks freelancer reliability and performance</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/employer" className="block">
            <div className="card-hover group h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Employer Hub</h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-400">Create projects, manage milestones, track payments, and monitor freelancer performance</p>
            </div>
          </Link>

          <Link href="/freelancer" className="block">
            <div className="card-hover group h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Freelancer Portal</h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-400">Browse projects, submit milestone work, track earnings, and build your reputation</p>
            </div>
          </Link>

          <Link href="/escrow" className="block">
            <div className="card-hover group h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Escrow Vault</h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-400">View payment status, transaction history, and manage fund releases securely</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span className="font-semibold text-white">MilestoneAI</span>
            </div>
            <p className="text-slate-400 text-sm">© 2024 MilestoneAI. Powered by AI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
