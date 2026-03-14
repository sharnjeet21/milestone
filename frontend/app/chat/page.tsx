"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { id: string; sender: "me" | "other"; name: string; text: string; time: string; };
type Contact = { id: string; name: string; role: string; project: string; unread: number; avatar: string; };

const CONTACTS: Contact[] = [
  { id: "c1", name: "Alex Chen", role: "Employer", project: "AI Dashboard", unread: 2, avatar: "AC" },
  { id: "c2", name: "Priya Sharma", role: "Freelancer", project: "E-commerce Site", unread: 0, avatar: "PS" },
  { id: "c3", name: "Marcus Lee", role: "Employer", project: "Mobile App", unread: 1, avatar: "ML" },
];

const MOCK_MSGS: Record<string, Message[]> = {
  c1: [
    { id: "1", sender: "other", name: "Alex Chen", text: "Hey, milestone 2 looks great! Can we discuss the timeline for milestone 3?", time: "2:30 PM" },
    { id: "2", sender: "me", name: "You", text: "Sure! I can have it done by Friday. The core features are already 60% done.", time: "2:35 PM" },
    { id: "3", sender: "other", name: "Alex Chen", text: "Perfect. Also, can you share the task breakdown?", time: "2:36 PM" },
  ],
  c2: [{ id: "1", sender: "other", name: "Priya Sharma", text: "I've submitted the design files for review.", time: "11:00 AM" }],
  c3: [{ id: "1", sender: "other", name: "Marcus Lee", text: "Can we schedule a quick call to review the app flow?", time: "Yesterday" }],
};

export default function ChatPage() {
  const [active, setActive] = useState("c1");
  const [messages, setMessages] = useState(MOCK_MSGS);
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
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">Messaging</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">Messages</h1>
        </motion.div>

        {/* Chat layout */}
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

          {/* Contacts sidebar */}
          <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-border/60 bg-white/80 p-4 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Conversations
            </p>
            <div className="space-y-1">
              {CONTACTS.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)}
                  className={cn("w-full text-left rounded-2xl px-3 py-3 transition",
                    active === c.id ? "bg-green-500/10 border border-green-500/20" : "border border-transparent hover:bg-foreground/5")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                      {c.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        {c.unread > 0 && (
                          <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white">{c.unread}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.role} · {c.project}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chat window */}
          <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="flex flex-col rounded-[2rem] border border-border/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70 overflow-hidden"
            style={{ minHeight: "480px" }}>

            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border/50 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                {contact.avatar}
              </div>
              <div>
                <p className="font-medium text-foreground">{contact.name}</p>
                <p className="text-xs text-muted-foreground">{contact.role} · {contact.project}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {(messages[active] || []).map(msg => (
                <div key={msg.id} className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 text-sm",
                    msg.sender === "me"
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "border border-border/50 bg-background text-foreground rounded-bl-sm")}>
                    <p>{msg.text}</p>
                    <p className={cn("mt-1 text-xs", msg.sender === "me" ? "text-green-200" : "text-muted-foreground")}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 border-t border-border/50 px-4 py-3">
              <button className="p-2 text-muted-foreground transition hover:text-foreground">
                <Paperclip className="w-4 h-4" />
              </button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60 placeholder:text-muted-foreground/60" />
              <button onClick={send}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
