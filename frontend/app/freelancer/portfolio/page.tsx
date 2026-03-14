"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ExternalLink, Star, Trash2, Code2, Palette, Database, FileText } from "lucide-react";

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  type: "code" | "design" | "data" | "content";
  url: string;
  tags: string[];
  rating: number;
};

const INIT: PortfolioItem[] = [
  { id: "p1", title: "E-commerce Platform", description: "Full-stack Next.js + FastAPI marketplace with Stripe payments and real-time inventory.", type: "code", url: "https://github.com", tags: ["Next.js", "FastAPI", "Stripe"], rating: 5 },
  { id: "p2", title: "SaaS Dashboard UI", description: "Figma design system and responsive dashboard for a B2B analytics product.", type: "design", url: "https://figma.com", tags: ["Figma", "Tailwind", "UI/UX"], rating: 4 },
];

const typeIcon = { code: <Code2 className="w-4 h-4" />, design: <Palette className="w-4 h-4" />, data: <Database className="w-4 h-4" />, content: <FileText className="w-4 h-4" /> };
const typeColor = { code: "text-green-400 bg-green-400/10", design: "text-fuchsia-400 bg-fuchsia-400/10", data: "text-blue-400 bg-blue-400/10", content: "text-amber-400 bg-amber-400/10" };

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>(INIT);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "code" as PortfolioItem["type"], url: "", tags: "" });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setItems(i => [...i, {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      type: form.type,
      url: form.url,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      rating: 0,
    }]);
    setForm({ title: "", description: "", type: "code", url: "", tags: "" });
    setShowForm(false);
  };

  const remove = (id: string) => setItems(i => i.filter(item => item.id !== id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-slate-800 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
            <div>
              <h1 className="text-2xl font-semibold text-white">Portfolio</h1>
              <p className="text-slate-400 text-sm">Showcase your best work to employers</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        {showForm && (
          <form onSubmit={add} className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-white font-semibold">Add Portfolio Project</h2>
            <div className="grid grid-cols-2 gap-4">
              <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Project title" className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-green-500" />
              <textarea required rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description" className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-green-500" />
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as PortfolioItem["type"]}))} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-green-500">
                <option value="code">Code</option>
                <option value="design">Design</option>
                <option value="data">Data</option>
                <option value="content">Content</option>
              </select>
              <input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} placeholder="Project URL (GitHub, Figma, etc.)" className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-green-500" />
              <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="Tags (comma separated)" className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-green-500" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition">Add to Portfolio</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm transition">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map(item => (
            <div key={item.id} className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition group">
              <div className="flex items-start justify-between mb-3">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColor[item.type]}`}>
                  {typeIcon[item.type]} {item.type}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white transition"><ExternalLink className="w-4 h-4" /></a>}
                  <button onClick={() => remove(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{item.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full text-xs">{tag}</span>
                ))}
              </div>
              {item.rating > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < item.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                  ))}
                  <span className="text-slate-500 text-xs ml-1">Employer rated</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
