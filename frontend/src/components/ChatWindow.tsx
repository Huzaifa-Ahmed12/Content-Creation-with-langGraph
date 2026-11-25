"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import { FOLLOW_UPS, SUGGESTIONS } from "@/lib/programmes";
import type { Conversation, Feedback } from "@/types/chat";

interface ChatWindowProps {
  conversation: Conversation;
  loading: boolean;
  onSend: (text: string) => void;
  onFeedback: (messageId: string, feedback: Feedback) => void;
}

export default function ChatWindow({ conversation, loading, onSend, onFeedback }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, programme } = conversation;

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  // Follow-up chips: based on the route of the latest answer
  const last = messages[messages.length - 1];
  const followUps =
    !loading && last?.role === "bot" && last.route
      ? FOLLOW_UPS[last.route].filter(
          (q) => !messages.some((m) => m.role === "user" && m.content === q)
        )
      : [];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="chat-scroll flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
                Step 2 of 2
              </span>
              <h2 className="mt-4 text-xl font-bold sm:text-2xl">Hi! Ask me anything about {programme}</h2>
              <p className="mt-2 text-sm text-navy/70">
                Fees, courses, attendance, grading, scholarships and more. You can also use the mic to speak.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    disabled={loading}
                    className="rounded-full border-2 border-navy/15 px-4 py-2 text-xs font-medium transition hover:border-gold hover:bg-gold disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} onFeedback={(f) => onFeedback(m.id, f)} />
          ))}

          {loading && <TypingIndicator />}

          {followUps.length > 0 && (
            <div className="ml-10">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy/50">
                You might also ask
              </p>
              <div className="flex flex-wrap gap-2">
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSend(q)}
                    className="rounded-full border-2 border-gold px-3.5 py-1.5 text-xs font-medium transition hover:bg-gold"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  );
}