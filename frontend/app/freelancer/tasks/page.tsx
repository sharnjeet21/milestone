"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Users, CheckCircle2, Clock, Share2 } from "lucide-react";

type Task = { id: string; title: string; assignee: string; status: "TODO" | "IN_PROGRESS" | "DONE"; shared: boolean; };

const INIT: Task[] = [
  { id: "t1", title: "Build authentication flow", assignee: "You", status: "DONE", shared: false },
  { id: "t2", title: "Design dashboard UI", assignee: "You", status: "IN_PROGRESS", shared: false },
  { id: "t3", title: "API integration", assignee: "You", status: "TODO", shared: false },
];

const statusColor = { TODO: "text-slate-400 bg-slate-400/10", IN_PROGRESS: "text-amber-400 bg-amber-400/10", DONE: "text-green-400 bg-green-400/10" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INIT);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [shareModal, setShareModal] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(t => [...t, { id: Date.now().toString(), title: newTask.trim(), assignee: "You", status: "TODO", shared: false }]);
    setNewTask("");
    setShowForm(false);
  };

  const shareTask = (id: string) => {
    setTasks(t => t.map(task => task.id === id ? { ...task, shared: true, assignee: shareEmail || "Fellow Freelancer" } : task));
    setShareMsg(`Task shared with ${shareEmail || "fellow freelancer"}`);
    setShareModal(null);
    setShareEmail("");
    setTimeout(() => setShareMsg(""), 3000);
  };

  const cycle = (id: string) => {
    const order: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];
    setTasks(t => t.map(task => task.id === id ? { ...task, status: order[(order.indexOf(task.status) + 1) % 3] } : task));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/freelancer" className="p-2 hover:bg-slate-800 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
            <div>
              <h1 className="text-2xl font-semibold text-white">Task Board</h1>
              <p className="text-slate-400 text-sm">Manage and share tasks with fellow freelancers</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-3">
        {shareMsg && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{shareMsg}</div>}

        {showForm && (
          <form onSubmit={addTask} className="flex gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Task title..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500" />
            <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm transition">Cancel</button>
          </form>
        )}

        {shareModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> Share Task</h3>
              <p className="text-slate-400 text-sm">Share this task with a fellow freelancer. They'll be able to collaborate on it.</p>
              <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Freelancer email or name" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500" />
              <div className="flex gap-3">
                <button onClick={() => shareTask(shareModal)} className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition">Share</button>
                <button onClick={() => setShareModal(null)} className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition">
            <button onClick={() => cycle(task.id)} className="shrink-0">
              {task.status === "DONE" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-slate-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-slate-500" : "text-white"}`}>{task.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{task.shared ? `Shared with ${task.assignee}` : "Assigned to you"}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[task.status]}`}>{task.status.replace("_", " ")}</span>
            {!task.shared && (
              <button onClick={() => setShareModal(task.id)} className="p-2 text-slate-400 hover:text-cyan-400 transition" title="Share with fellow freelancer">
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
