import Link from "next/link";
import Topbar from "@/components/Topbar";
import HowGoodHL from "@/components/HowGoodHL";
import { listBlockInputs } from "@/lib/buildingBlocksDb";
import type { BlockInput } from "@/lib/buildingBlocks";

export const metadata = {
  title: "1 · Gaps and Connections · Shift",
};
export const dynamic = "force-dynamic";

/** Phase 2 · Step 1 — Gaps and Connections, then How good looks like (HL). */
export default async function Stage2Session1Page() {
  let blockInputs: BlockInput[] = [];
  try {
    blockInputs = await listBlockInputs();
  } catch {
    // Keep the presentation usable even if the DB is unreachable.
  }
  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-fg">
            All phases
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Phase 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">1 · Gaps and Connections</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
              1
            </span>
            Gaps and Connections
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            <span className="font-semibold text-fg">Slide 01</span> shows the whole process at
            a glance. On <span className="font-semibold text-fg">slide 00</span> every team
            member maps today&apos;s status stage by stage — what we have, what&apos;s
            missing and what needs connecting. Hit{" "}
            <span className="font-semibold text-fg">Present</span> to run it full screen
            (← → to move, Esc to exit).
          </p>
        </header>

        <HowGoodHL initialBlockInputs={blockInputs} />
      </main>
    </div>
  );
}
