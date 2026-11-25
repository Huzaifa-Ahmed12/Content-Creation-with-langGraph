import { PROGRAMMES } from "@/lib/programmes";

interface ProgrammeSelectProps {
  onSelect: (programme: string) => void;
}

export default function ProgrammeSelect({ onSelect }: ProgrammeSelectProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-10 sm:py-16">
      <span className="rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
        Step 1 of 2
      </span>
      <h2 className="mt-4 text-center text-2xl font-bold sm:text-3xl">Select your programme</h2>
      <p className="mt-2 max-w-md text-center text-sm text-navy/70">
        The assistant will tailor fee and academic answers to the programme you choose.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAMMES.map((p) => (
          <button
            key={p.name}
            onClick={() => onSelect(p.name)}
            className="group flex items-center gap-4 rounded-xl border-2 border-navy/15 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white transition group-hover:bg-gold group-hover:text-navy">
              {p.short}
            </div>
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-navy/60">{p.school}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}