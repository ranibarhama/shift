import Link from "next/link";
import Topbar from "@/components/Topbar";
import BacklogView from "@/components/BacklogView";
import { listBlockInputs } from "@/lib/buildingBlocksDb";
import type { BlockInput } from "@/lib/buildingBlocks";

export const metadata = {
  title: "2 · Backlog · Shift",
};
export const dynamic = "force-dynamic";

/** Stage 2 · 2 · Backlog — the team's session-1 input, and where it all needs to connect. */
export default async function Stage2BacklogPage() {
  let inputs: BlockInput[] = [];
  try {
    inputs = await listBlockInputs();
  } catch {
    // Keep the page usable even if the DB is unreachable.
  }

  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-fg">
            All stages
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Stage 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">2 · Backlog</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Stage 2
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <StepNumber n={2} />
            Backlog
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Every gap the team mapped in{" "}
            <Link href="/stage-2/session-1#blocks" className="font-semibold text-fg underline-offset-4 hover:underline">
              1 · Today&apos;s status
            </Link>
            : what&apos;s missing, and what we have but still needs a connection — plus a map of
            where it all needs to connect. Things we already have that need no connection
            aren&apos;t backlog items. Updates live as people add input.
          </p>
        </header>

        <BacklogView initial={inputs} />
      </main>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
      {n}
    </span>
  );
}
