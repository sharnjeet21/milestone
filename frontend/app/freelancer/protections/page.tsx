"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Heart, AlertTriangle, Clock, FileText, CheckCircle2 } from "lucide-react";

type Clause = { id: string; icon: React.ReactNode; title: string; description: string; active: boolean; };

export default function ProtectionsPage() {
  const [clauses, setClauses] = useState<Clause[]>([
    { id: "illness", icon: <Heart className="w-5 h-5 text-red-400" />, title: "Illness / Medical Emergency", description: "If you're unable to work due to illness or medical emergency, deadlines are automatically extended by up to 7 days with no penalty. Requires a brief notice in the dispute channel.", active: true },
    { id: "scope_creep", icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, title: "Scope Creep Protection", description: "Any work requested beyond the original agreed scope must be approved as a new milestone. Employers cannot penalize for not completing out-of-scope work.", active: true },
    { id: "payment_delay", icon: <Clock className="w-5 h-5 text-blue-400" />, title: "Payment Delay Protection", description: "If an employer delays milestone approval for more than 5 business days after submission, funds are auto-released to the freelancer.", active: true },
    { id: "unfair_penalty", icon: <Shield className="w-5 h-5 text-purple-400" />, title: "Unfair Penalty Shield", description: "Penalties can only be applied if the AI evaluation confirms the milestone was genuinely unmet. Employers cannot manually apply penalties without AI verification.", active: true },
    { id: "termination", icon: <FileText className="w-5 h-5 text-cyan-400" />, title: "Early Termination Rights", description: "If an employer terminates the contract early without cause, you are entitled to payment for all completed milestones plus 20% of remaining contract value.", active: true },
    { id: "revision_limit", icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, title: "Revision Limit Enforcement", description: "Employers are limited to 2 revision requests per milestone. Additional revisions must be negotiated as separate paid work.", active: false },
  ]);

  const toggle = (id: string) => setClauses(c => c.map(cl => cl.id === id ? { ...cl, active: !cl.active } : cl));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-4">
          <Link href="/freelancer" className="p-2 hover:bg-slate-800 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-purple-400" /> Freelancer Protections</h1>
            <p className="text-slate-400 text-sm">Your rights are enforced by the platform — employers cannot override these</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
          These protections are embedded in every MOU and contract generated on MilestoneAI. They are legally binding and enforced automatically by the platform.
        </div>

        {clauses.map(cl => (
          <div key={cl.id} className={`p-5 rounded-xl border transition ${cl.active ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-900/30 border-slate-800/50 opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5 shrink-0">{cl.icon}</div>
                <div>
                  <p className="text-white font-medium">{cl.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{cl.description}</p>
                </div>
              </div>
              <button onClick={() => toggle(cl.id)} className={`shrink-0 w-11 h-6 rounded-full transition-colors ${cl.active ? "bg-purple-500" : "bg-slate-700"}`}>
                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${cl.active ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
