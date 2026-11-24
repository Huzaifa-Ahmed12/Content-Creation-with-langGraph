import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types/chat";

const ROUTE_LABEL = {
  academic: "Academic handbook",
  fee: "Fee structure",
  general: "General",
} as const;

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gold px-4 py-2.5 text-sm font-medium text-navy">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
        BU
      </div>
      <div className="max-w-[85%]">
        <div className="markdown rounded-2xl rounded-tl-sm border border-navy/15 bg-white px-4 py-3 text-sm leading-relaxed text-navy">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        {message.route && (
          <span className="mt-1 inline-block rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
            {ROUTE_LABEL[message.route]}
          </span>
        )}
      </div>
    </div>
  );
}