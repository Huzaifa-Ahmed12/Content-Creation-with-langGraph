"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText("");
  };

  // Enter = send, Shift + Enter = new line
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-navy/15 bg-white">
      <div className="mx-auto flex max-w-4xl items-end gap-2 px-4 py-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask about fees, courses, attendance..."
          className="max-h-32 flex-1 resize-none rounded-xl border-2 border-navy/15 bg-white px-4 py-2.5 text-sm text-navy outline-none placeholder:text-navy/40 focus:border-gold"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="h-11 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  );
}