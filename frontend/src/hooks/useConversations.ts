"use client";

import { useEffect, useState } from "react";
import type { ChatMessage, Conversation, Feedback } from "@/types/chat";

const STORAGE_KEY = "bu-chat-conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Keeps all chats in the browser (localStorage) so they survive a page refresh.
 * Each conversation id is also the LangGraph thread_id on the backend.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);

  // Save to localStorage whenever something changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // storage full or blocked: ignore
    }
  }, [conversations]);

  const createConversation = (programme: string): Conversation => {
    const now = Date.now();
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: "New chat",
      programme,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conv, ...prev]);
    return conv;
  };

  const addMessage = (conversationId: string, message: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const isFirstUserMsg = message.role === "user" && c.messages.length === 0;
        const title = isFirstUserMsg
          ? message.content.slice(0, 40) + (message.content.length > 40 ? "…" : "")
          : c.title;
        return { ...c, title, messages: [...c.messages, message], updatedAt: Date.now() };
      })
    );
  };

  const setFeedback = (conversationId: string, messageId: string, feedback: Feedback) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== conversationId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m
              ),
            }
      )
    );
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  };

  const clearAll = () => setConversations([]);

  return { conversations, createConversation, addMessage, setFeedback, deleteConversation, clearAll };
}