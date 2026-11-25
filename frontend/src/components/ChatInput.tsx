"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MicIcon, SendIcon } from "./icons";

const MAX_CHARS = 2000; // same limit as the backend

// Minimal types for the browser Speech Recognition API (Chrome / Edge)
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => getSpeechRecognition() !== null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Auto-grow the text box as the student types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  // Stop listening if the component closes
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    recognitionRef.current?.stop();
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

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    const startText = text;
    recognition.onresult = (e) => {
      let spoken = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        spoken += e.results[i][0].transcript;
      }
      setText((startText ? startText + " " : "") + spoken.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const tooLong = text.length > MAX_CHARS;

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-navy/15 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div
          className={`flex items-end gap-2 rounded-2xl border-2 bg-white p-2 transition ${
            listening ? "border-gold" : "border-navy/15 focus-within:border-gold"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={listening ? "Listening… speak now" : "Ask about fees, courses, attendance..."}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-navy outline-none placeholder:text-navy/40"
          />

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              title={listening ? "Stop listening" : "Speak your question"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                listening ? "animate-pulse bg-gold text-navy" : "text-navy hover:bg-navy/5"
              }`}
            >
              <MicIcon />
            </button>
          )}

          <button
            type="submit"
            disabled={disabled || !text.trim() || tooLong}
            title="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-white transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1.5 flex justify-between px-1 text-[10px] text-navy/50">
          <span>Enter to send · Shift + Enter for new line</span>
          <span className={tooLong ? "font-semibold text-navy" : ""}>
            {text.length} / {MAX_CHARS}
          </span>
        </div>
      </div>
    </form>
  );
}