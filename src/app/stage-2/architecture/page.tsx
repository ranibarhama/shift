import Link from "next/link";
import Topbar from "@/components/Topbar";
import IgnisLayers from "@/components/IgnisLayers";

export const metadata = {
  title: "3 · Architecture · Shift",
};

/**
 * Phase 2 · 3 · Architecture — the detailed definition and the technical architecture,
 * in one step: Ignis frame by frame, and the platform work that runs beside it.
 */
export default function Stage2ArchitecturePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-[1460px] px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-fg">
            All phases
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Phase 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">3 · Architecture</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
              3
            </span>
            Architecture
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-fg">
            Small product changes wait on engineering capacity. Ignis turns a Jira ticket into a
            verified merge request, then adds context, measurement and review so we can trust it
            with bigger work.
          </p>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Hit <span className="font-semibold text-fg">Present</span> in the header to go full
            screen. ← → or 1–6 move frame by frame, <Key>I</Key> switches to Platform &amp;
            Infrastructure and back, <Key>N</Key> hides the presenter notes.
          </p>
        </header>

        <IgnisLayers />
      </main>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-card px-1.5 py-px font-sans text-[11px] font-semibold text-fg">
      {children}
    </kbd>
  );
}
