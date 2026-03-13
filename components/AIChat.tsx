"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { cn } from "@/lib/utils";

type AIChatProps = {
  projectContext: string;
  systemPrompt: string;
  className?: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export function AIChat({
  projectContext,
  systemPrompt,
  className,
}: AIChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant_welcome",
      role: "assistant",
      content: "Ask me about project status, risks, scope, or milestone readiness.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage].slice(-12);
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectContext,
          systemPrompt,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok || !data.message) {
        throw new Error(data.message || "Unable to get an AI response.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.message ?? "",
      };

      setMessages((current) => [...current, assistantMessage].slice(-12));
    } catch (error) {
      toast({
        title: "AI chat unavailable",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-border/60 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70",
        className,
      )}
    >
      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-6",
              message.role === "assistant"
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                : "ml-auto max-w-[85%] bg-green-500/10 text-green-900 dark:text-green-100",
            )}
          >
            {message.content}
          </div>
        ))}

        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <span className="flex gap-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <motion.span
                    key={index}
                    animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 0.7,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.12,
                      ease: "easeInOut",
                    }}
                    className="h-2 w-2 rounded-full bg-current"
                  />
                ))}
              </span>
              <span className="text-sm">Thinking</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      <form className="mt-4 flex gap-3" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the AI assistant"
          className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-wait"
        >
          <Send className="h-4 w-4" />
          Ask
        </button>
      </form>
    </div>
  );
}

export default AIChat;
