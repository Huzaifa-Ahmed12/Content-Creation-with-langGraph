"use client";

import dynamic from "next/dynamic";

// ChatApp reads saved chats from the browser (localStorage),
// so it is loaded only in the browser, not on the server.
const ChatApp = dynamic(() => import("@/components/ChatApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center">
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-navy text-lg font-bold text-gold">
        U
      </div>
    </div>
  ),
});

export default function Home() {
  return <ChatApp />;
}