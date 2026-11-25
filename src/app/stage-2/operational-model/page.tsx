import Link from "next/link";
import Topbar from "@/components/Topbar";
import OperatingModel from "@/components/OperatingModel";

export const metadata = {
  title: "5 · Operational model · Shift",
};

/** Phase 2 · 5 · Operational model — a proposal for how we run the architecture day to day. */
export default function Stage2OperationalModelPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-fg">
            All phases
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Phase 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">5 · Operational model</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
              5
            </span>
            Operational model
            <span className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Proposal
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            How we run it day to day. One central AI team builds the platform once. Product pods
            own their outcomes. Domain owners hold each profession&apos;s bar in every pod. Hit{" "}
            <span className="font-semibold text-fg">Present</span> in the header to go full
            screen: ← → move section by section.
          </p>
        </header>

        <OperatingModel />
      </main>
    </div>
  );
}
