"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ProgrammeSelect from "./ProgrammeSelect";
import ChatWindow from "./ChatWindow";
import WorkflowPanel from "./WorkFlowPanel";
import { useConversations } from "@/hooks/useConversations";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { sendMessage } from "@/lib/api";
import type { Feedback, Route } from "@/types/chat";

export default function ChatApp() {
  const { conversations, createConversation, addMessage, setFeedback, deleteConversation, clearAll } =
    useConversations();
  const status = useBackendStatus();

  const [activeId, setActiveId] = useState<string | null>(null); // null = programme selection screen
  const [loadingIds, setLoadingIds] = useState<string[]>([]); // chats waiting for an answer
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [workflowOpen, setWorkflowOpen] = useState(false); // small-screen drawer

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const loading = active ? loadingIds.includes(active.id) : false;

  // Latest route + route counts for the workflow panel
  const botMessages = active?.messages.filter((m) => m.role === "bot" && m.route) ?? [];
  const lastRoute: Route | null = botMessages.length ? botMessages[botMessages.length - 1].route ?? null : null;
  const counts: Record<Route, number> = { academic: 0, fee: 0, general: 0 };
  botMessages.forEach((m) => {
    if (m.route) counts[m.route] += 1;
  });

  // ---------- actions ----------
  const goToNewChat = () => {
    setActiveId(null);
    setSidebarOpen(false);
  };

  const startChat = (programme: string) => {
    const conv = createConversation(programme);
    setActiveId(conv.id);
  };

  const selectChat = (id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  const removeChat = (id: string) => {
    deleteConversation(id);
    if (id === activeId) setActiveId(null);
  };

  const removeAll = () => {
    if (!confirm("Delete all chats? This cannot be undone.")) return;
    clearAll();
    setActiveId(null);
  };

  const handleSend = async (text: string) => {
    if (!active || loading) return;
    const convId = active.id;
    const programme = active.programme;

    addMessage(convId, { id: crypto.randomUUID(), role: "user", content: text, createdAt: Date.now() });
    setLoadingIds((prev) => [...prev, convId]);

    try {
      // conversation id = LangGraph thread_id, so the backend remembers this chat
      const res = await sendMessage(text, programme, convId);
      addMessage(convId, {
        id: crypto.randomUUID(),
        role: "bot",
        content: res.answer,
        route: res.route,
        createdAt: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      addMessage(convId, {
        id: crypto.randomUUID(),
        role: "bot",
        content: `⚠️ ${msg}`,
        isError: true,
        createdAt: Date.now(),
      });
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== convId));
    }
  };

  const handleFeedback = (messageId: string, feedback: Feedback) => {
    if (active) setFeedback(active.id, messageId, feedback);
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header
        status={status}
        programme={active?.programme}
        onMenu={() => setSidebarOpen(true)}
        onNewChat={goToNewChat}
        onToggleWorkflow={() => setWorkflowOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={selectChat}
          onNewChat={goToNewChat}
          onDelete={removeChat}
          onClearAll={removeAll}
        />

        {active ? (
          <ChatWindow
            key={active.id}
            conversation={active}
            loading={loading}
            onSend={handleSend}
            onFeedback={handleFeedback}
          />
        ) : (
          <div className="chat-scroll min-w-0 flex-1 overflow-y-auto">
            <ProgrammeSelect onSelect={startChat} />
          </div>
        )}

        <WorkflowPanel
          route={lastRoute}
          loading={loading}
          counts={counts}
          open={workflowOpen}
          onClose={() => setWorkflowOpen(false)}
        />
      </div>
    </div>
  );
}