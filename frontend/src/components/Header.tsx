interface HeaderProps {
  programme?: string | null;
  onChangeProgramme?: () => void;
  onNewChat?: () => void;
}

export default function Header({ programme, onChangeProgramme, onNewChat }: HeaderProps) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-lg font-bold text-navy">
            BU
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              Bahria University Assistant
            </h1>
            <p className="text-xs text-white/70">Islamabad Campus</p>
          </div>
        </div>

        {programme && (
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-gold px-3 py-1 text-xs font-medium text-gold sm:inline">
              {programme}
            </span>
            <button
              onClick={onNewChat}
              className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium transition hover:border-gold hover:text-gold"
            >
              New chat
            </button>
            <button
              onClick={onChangeProgramme}
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-white"
            >
              Change
            </button>
          </div>
        )}
      </div>
    </header>
  );
}