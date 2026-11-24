"use client";

import { useState } from "react";
import Header from "@/components/Header";
import ProgrammeSelect from "@/components/ProgrammeSelect";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [programme, setProgramme] = useState<string | null>(null);
  const [threadId, setThreadId] = useState("");

  // A new thread_id = a new conversation (used by the backend later)
  const startChat = (p: string) => {
    setProgramme(p);
    setThreadId(crypto.randomUUID());
  };

  return (
    <main className="flex h-dvh flex-col">
      <Header
        programme={programme}
        onChangeProgramme={() => setProgramme(null)}
        onNewChat={() => programme && startChat(programme)}
      />

      {programme ? (
        <ChatWindow key={threadId} programme={programme} threadId={threadId} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ProgrammeSelect onSelect={startChat} />
        </div>
      )}
    </main>
  );
}