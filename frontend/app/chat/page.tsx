"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Paperclip, Users } from "lucide-react";

type Message = { id: string; sender: "me" | "other"; name: string; text: string; time: string; };
type Contact = { id: string; name: string; role: string; project: string; unread: number; };

const CONTACTS: Contact[] = [
  { id: "c1", name: "Alex Chen", role: "Employer", project: "AI Dashboard", unread: 2 },
  { id: "c2", name: "Priya Sharma", role: "Freelancer", project: "E-commerce Site", unread: 0 },
  { id: "c3", name: "Marcus Lee", role: "Employer", project: "Mobile App", unread: 1 },
];

const MOCK_MSGS: Record<string, Message[]> = {
  c1: [
    { id: "1", sender: "other", name: "Alex Chen", text: "Hey, milestone 2 looks great! Can we discuss the timeline for milestone 3?", time: "2:30 PM" },
    { id: "2", sender: "me", name: "You", text: "Sure! I can have it done by Friday. The core features are already 60% done.", time: "2:35 PM" },
    { id: "3", sender: "other", name: "Alex Chen", text: "Perfect. Also, can you share the task breakdown?", time: "2:36 PM" },
  ],
  c2: [
    { id: "1", sender: "other", name: "Priya Sharma", text: "I've submitted the design files for review.", time: "11:00 AM" },
  ],
  c3: [
    { id: "1", sender: "other", name: "Marcus Lee", text: "Can we schedule a quick call to review the app flow?", time: "Yesterday" },
  ],
};

export default function ChatPage() {
  const [active, setActive] = useState<string>("c1");
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MSGS);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, active]);

  const send = () => {
    if (!input.trim()) return;
    const msg: Message = { id: Date.now().toString(), sender: "me", name: "You", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(m => ({ ...m, [active]: [...(m[active] || []), msg] }));
    setInput("");
  };

  const contact = CONTACTS.find(c => c.id === active)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></Link>
          <h1 className="text-xl font-semibold text-white">Messages</h1>
        </div>
      </div>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-4 h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-2">
          <p className="text-slate-500 text-xs uppercase tracking-widest px-2 mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Conversations</p>
          {CONTACTS.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} className={`w-full text-left p-3 rounded-xl transition ${active === c.id ? "bg-blue-500/20 border border-blue-500/30" : "bg-slate-800/50 hover:bg-slate-800 border border-transparent"}`}>
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium">{c.name}</p>
                {c.unread > 0 && <span className="w-5 h-5 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">{c.unread}</span>}
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{c.role} · {c.project}</p>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <p className="text-white font-semibold">{contact.name}</p>
            <p className="text-slate-400 text-xs">{contact.role} · {contact.project}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {(messages[active] || []).map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "me" ? "bg-blue-500 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 rounded-bl-sm"}`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-blue-200" : "text-slate-500"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-slate-700/50 flex gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-300 transition"><Paperclip className="w-5 h-5" /></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500" />
            <button onClick={send} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
