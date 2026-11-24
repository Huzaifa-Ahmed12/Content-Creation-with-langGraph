"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import { sendMessage } from "@/lib/api";
import { SUGGESTIONS } from "@/lib/programmes";
import type { ChatMessage } from "@/types/chat";

interface ChatWindowProps {
  programme: string;
  threadId: string;
}

export default function ChatWindow({ programme, threadId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessage(text, programme, threadId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", content: res.answer, route: res.route },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: "Sorry, I couldn't reach the server. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
                Step 2 of 2
              </span>
              <h2 className="mt-4 text-xl font-bold sm:text-2xl">
                Hi! Ask me anything about {programme}
              </h2>
              <p className="mt-2 text-sm text-navy/70">
                Fees, courses, attendance, grading, scholarships and more.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border-2 border-navy/15 px-4 py-2 text-xs font-medium transition hover:border-gold hover:bg-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}