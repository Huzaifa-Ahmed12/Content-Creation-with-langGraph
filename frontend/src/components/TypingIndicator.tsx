export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-gold">
        BU
      </div>
      <div className="flex gap-1.5 rounded-2xl rounded-tl-sm border border-navy/15 bg-white px-4 py-4">
        <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
      </div>
    </div>
  );
}