"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, Feedback } from "@/types/chat";
import { CheckIcon, CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

const ROUTE_LABEL = {
  academic: "Academic handbook",
  fee: "Fee structure",
  general: "General",
} as const;

interface MessageBubbleProps {
  message: ChatMessage;
  onFeedback?: (feedback: Feedback) => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessageBubble({ message, onFeedback }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: ignore
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-sm font-medium text-navy">
          {message.content}
        </div>
        <span className="mt-1 text-[10px] text-navy/50">{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  const actionBtn = "rounded-md p-1.5 transition hover:bg-navy/5";

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
        U
      </div>
      <div className="min-w-0 max-w-[85%]">
        <div
          className={`markdown rounded-2xl rounded-tl-sm border bg-white px-4 py-3 text-sm leading-relaxed text-navy ${
            message.isError ? "border-gold" : "border-navy/15"
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1 text-navy/60">
          {message.route && (
            <span className="mr-1 rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
              {ROUTE_LABEL[message.route]}
            </span>
          )}
          <span className="mr-1 text-[10px]">{formatTime(message.createdAt)}</span>

          {!message.isError && (
            <>
              <button onClick={copy} title="Copy answer" className={actionBtn}>
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-gold" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onFeedback?.("up")}
                title="Helpful"
                className={`${actionBtn} ${message.feedback === "up" ? "bg-gold text-navy hover:bg-gold" : ""}`}
              >
                <ThumbUpIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onFeedback?.("down")}
                title="Not helpful"
                className={`${actionBtn} ${message.feedback === "down" ? "bg-navy text-white hover:bg-navy" : ""}`}
              >
                <ThumbDownIcon className="h-3.5 w-3.5" />
              </button>
              {copied && <span className="text-[10px] font-medium text-navy">Copied!</span>}
              {message.feedback && !copied && (
                <span className="text-[10px] font-medium text-navy">Thanks for your feedback!</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}