import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="grid-paper flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal">
          DWG NO. 001 — REV A
        </p>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Relay</h1>
        <p className="mt-4 text-balance text-base leading-relaxed text-muted">
          A project board that moves at the speed of the room. Drag a card, and every
          teammate&apos;s screen updates before you let go — with an AI summary on standby for
          the thread nobody has time to re-read.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-card border border-amber bg-amber/10 px-5 py-2.5 text-sm font-medium text-amber transition hover:bg-amber/20"
          >
            Sign in
          </Link>
          <a
            href="https://github.com"
            className="rounded-card border border-line px-5 py-2.5 text-sm font-medium text-muted transition hover:border-teal/50 hover:text-teal"
          >
            View source
          </a>
        </div>

        {/* Static preview of the board's card treatment — sets expectation
            for the visual language before the user signs in. */}
        <div className="mt-16 flex justify-center gap-3 text-left">
          {['Backlog', 'In Progress', 'Done'].map((col) => (
            <div key={col} className="w-32 rounded-card border border-line bg-surface/60 p-2">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-wide text-muted">
                {col}
              </p>
              <div className="rounded-card border border-line bg-surface p-2">
                <span className="font-mono text-[8px] text-muted">#A21F09</span>
                <div className="mt-1 h-1.5 w-3/4 rounded-full bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
