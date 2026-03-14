"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, Plus, X } from "lucide-react";

type Dispute = {
  id: string;
  project: string;
  milestone: string;
  raised_by: "employer" | "freelancer";
  reason: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  created_at: string;
};

const MOCK: Dispute[] = [
  { id: "d1", project: "AI Dashboard", milestone: "Core Build", raised_by: "freelancer", reason: "Payment not released after milestone approval.", status: "OPEN", created_at: "2026-03-10" },
  { id: "d2", project: "E-commerce Site", milestone: "Final Handoff", raised_by: "employer", reason: "Deliverable did not match agreed scope.", status: "RESOLVED", created_at: "2026-03-05" },
];

const statusIcon = { OPEN: <Clock className="w-4 h-4 text-amber-400" />, RESOLVED: <CheckCircle2 className="w-4 h-4 text-green-400" />, DISMISSED: <X className="w-4 h-4 text-slate-400" /> };
const statusColor = { OPEN: "text-amber-400 bg-amber-400/10", RESOLVED: "text-green-400 bg-green-400/10", DISMISSED: "text-slate-400 bg-slate-400/10" };

export default function DisputesPage() {
  const [disputes] = useState<Dispute[]>(MOCK);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project: "", milestone: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
            <div>
              <h1 className="text-2xl font-semibold text-white">Disputes</h1>
              <p className="text-slate-400 text-sm">Raise or track project disputes</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Raise Dispute
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        {submitted && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Dispute submitted. Our team will review within 24 hours.
          </div>
        )}

        {showForm && (
          <div className="card p-6 space-y-4">
            <h2 className="text-white font-semibold">Raise a Dispute</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.project} onChange={e => setForm(f => ({...f, project: e.target.value}))} placeholder="Project name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
              <input required value={form.milestone} onChange={e => setForm(f => ({...f, milestone: e.target.value}))} placeholder="Milestone name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
              <textarea required rows={3} value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="Describe the issue in detail..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">Submit Dispute</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {disputes.map(d => (
          <div key={d.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{d.project} — {d.milestone}</p>
                <p className="text-slate-400 text-xs mt-1">Raised by {d.raised_by} · {d.created_at}</p>
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusColor[d.status]}`}>
                {statusIcon[d.status]} {d.status}
              </span>
            </div>
            <p className="text-slate-300 text-sm">{d.reason}</p>
            {d.status === "OPEN" && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Escrow funds are frozen until this dispute is resolved.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
