import type { Route } from "@/types/chat";
import { CloseIcon, GraphIcon } from "./icons";

interface WorkflowPanelProps {
  route: Route | null; // route of the latest answer
  loading: boolean; // true while the graph is running
  counts: Record<Route, number>; // how many answers went through each route in this chat
  open: boolean; // drawer open on small screens
  onClose: () => void;
}

const BRANCHES: { route: Route; node: string; label: string }[] = [
  { route: "academic", node: "academic_rag", label: "Academic PDF" },
  { route: "fee", node: "fee_rag", label: "Fee PDF" },
  { route: "general", node: "general", label: "LLM only" },
];

function Node({ name, active, pulse, small }: { name: string; active: boolean; pulse?: boolean; small?: boolean }) {
  return (
    <div
      className={`rounded-lg border-2 text-center font-mono font-semibold transition ${
        small ? "break-all px-1 py-1.5 text-[10px] leading-tight" : "px-3 py-1.5 text-xs"
      } ${
        active ? "border-gold bg-gold text-navy" : "border-navy/20 bg-white text-navy/60"
      } ${pulse ? "animate-pulse" : ""}`}
    >
      {name}
    </div>
  );
}

function Arrow({ active }: { active: boolean }) {
  return <div className={`mx-auto h-5 w-0.5 ${active ? "bg-gold" : "bg-navy/20"}`} />;
}

export default function WorkflowPanel({ route, loading, counts, open, onClose }: WorkflowPanelProps) {
  const hasPath = route !== null && !loading;
  const total = counts.academic + counts.fee + counts.general;

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-30 bg-navy/40 xl:hidden" aria-hidden />}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col overflow-y-auto border-l border-navy/15 bg-white p-4 transition-transform duration-200 xl:static xl:z-auto xl:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <GraphIcon className="h-4 w-4 text-gold" /> LangGraph workflow
          </p>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-navy/5 xl:hidden">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-navy/60">
          {loading
            ? "Classifying your question…"
            : hasPath
            ? "Path taken by the last answer"
            : "Ask a question to see its path"}
        </p>

        {/* Graph diagram */}
        <div className="mt-5 flex flex-col">
          <Node name="START" active={hasPath || loading} />
          <Arrow active={hasPath || loading} />
          <Node name="classifier" active={hasPath} pulse={loading} />

          <p className="my-2 text-center text-[10px] font-semibold uppercase tracking-wide text-navy/50">
            conditional edge
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {BRANCHES.map((b) => {
              const active = hasPath && route === b.route;
              return (
                <div key={b.route} className="flex flex-col">
                  <Arrow active={active} />
                  <Node name={b.node} active={active} small />
                  <p className={`mt-1 text-center text-[10px] ${active ? "font-semibold text-navy" : "text-navy/50"}`}>
                    {b.label}
                  </p>
                  <Arrow active={active} />
                </div>
              );
            })}
          </div>

          <Node name="response" active={hasPath} />
          <Arrow active={hasPath} />
          <Node name="END" active={hasPath} />
        </div>

        {/* Route usage in this chat */}
        <div className="mt-6 rounded-xl border border-navy/15 p-3">
          <p className="text-xs font-semibold">Routes used in this chat</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {BRANCHES.map((b) => {
              const n = counts[b.route];
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <div key={b.route}>
                  <div className="flex justify-between text-[11px]">
                    <span className="font-mono">{b.node}</span>
                    <span className="text-navy/60">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy/10">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}