import type { Conversation } from "@/types/chat";
import { shortName } from "@/lib/programmes";
import { ChatIcon, CloseIcon, PlusIcon, TrashIcon } from "./icons";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean; // mobile drawer open?
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  open,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
  onClearAll,
}: SidebarProps) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Dark overlay on mobile */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 z-30 bg-navy/40 lg:hidden" aria-hidden />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-navy/15 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/60">Chat history</p>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-navy/5 lg:hidden">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/25 py-2.5 text-sm font-semibold transition hover:border-gold hover:bg-gold"
          >
            <PlusIcon /> New chat
          </button>
        </div>

        <nav className="chat-scroll mt-3 flex-1 overflow-y-auto px-3 pb-3">
          {sorted.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-navy/50">
              No chats yet. Start a new chat to see it here.
            </p>
          )}

          <ul className="flex flex-col gap-1">
            {sorted.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => onSelect(c.id)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 pr-9 text-left transition ${
                      active ? "bg-navy text-white" : "hover:bg-navy/5"
                    }`}
                  >
                    <ChatIcon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-gold" : "text-navy/50"}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${active ? "text-white/70" : "text-navy/50"}`}>
                        <span
                          className={`rounded px-1.5 py-px text-[10px] font-semibold ${
                            active ? "bg-gold text-navy" : "bg-navy/10 text-navy"
                          }`}
                        >
                          {shortName(c.programme)}
                        </span>
                        {c.messages.length} messages
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    aria-label="Delete chat"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 ${
                      active ? "text-white hover:text-gold" : "text-navy/60 hover:text-navy"
                    }`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {sorted.length > 0 && (
          <div className="border-t border-navy/15 p-3">
            <button
              onClick={onClearAll}
              className="w-full rounded-lg py-2 text-xs font-medium text-navy/60 transition hover:bg-navy/5 hover:text-navy"
            >
              Clear all chats
            </button>
          </div>
        )}
      </aside>
    </>
  );
}