import type { BackendStatus } from "@/hooks/useBackendStatus";
import { GraphIcon, MenuIcon, PlusIcon } from "./icons";

interface HeaderProps {
  status: BackendStatus;
  programme?: string | null;
  onMenu: () => void;
  onNewChat: () => void;
  onToggleWorkflow: () => void;
}

const STATUS_TEXT: Record<BackendStatus, string> = {
  checking: "Connecting…",
  online: "Online",
  offline: "Offline",
};

export default function Header({ status, programme, onMenu, onNewChat, onToggleWorkflow }: HeaderProps) {
  return (
    <header className="z-20 shrink-0 bg-navy text-white">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          {/* Mobile: open sidebar */}
          <button
            onClick={onMenu}
            aria-label="Open chat history"
            className="rounded-lg p-1.5 transition hover:bg-white/10 lg:hidden"
          >
            <MenuIcon />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-lg font-bold text-navy">
            U
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">UniAssist</h1>
            <p className="text-xs text-white/70">University Chatbot</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Backend status */}
          <span
            title={`Server: ${STATUS_TEXT[status]}`}
            className="flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status === "online"
                  ? "bg-gold"
                  : status === "checking"
                  ? "animate-pulse bg-white/60"
                  : "border border-white bg-transparent"
              }`}
            />
            <span className="hidden sm:inline">{STATUS_TEXT[status]}</span>
          </span>

          {programme && (
            <span className="hidden rounded-full border border-gold px-3 py-1 text-xs font-medium text-gold md:inline">
              {programme}
            </span>
          )}

          {/* Workflow panel toggle (small screens) */}
          <button
            onClick={onToggleWorkflow}
            aria-label="Show workflow"
            className="rounded-lg border border-white/30 p-1.5 transition hover:border-gold hover:text-gold xl:hidden"
          >
            <GraphIcon className="h-4 w-4" />
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-white"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}