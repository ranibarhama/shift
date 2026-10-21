import Link from "next/link";
import Topbar from "@/components/Topbar";
import HowGoodHL from "@/components/HowGoodHL";
import { listBlockInputs } from "@/lib/buildingBlocksDb";
import type { BlockInput } from "@/lib/buildingBlocks";

export const metadata = {
  title: "Session 1 · How good looks like – HL · Shift",
};
export const dynamic = "force-dynamic";

/** Stage 2 · Session 1 — "How good looks like" at a high level (HL). */
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
            All stages
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Stage 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">Session 1</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Stage 2 · Session 1
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            How good looks like – HL
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Start at <span className="font-semibold text-fg">screen 00</span>: every team
            member adds, per building block, what we have, what&apos;s missing and what needs
            connecting. Then the high-level picture — the transformation structure and the
            details behind it. Hit <span className="font-semibold text-fg">Present</span> to
            run it full screen (← → to move, Esc to exit).
          </p>
        </header>

        <HowGoodHL initialBlockInputs={blockInputs} />
      </main>
    </div>
  );
}
