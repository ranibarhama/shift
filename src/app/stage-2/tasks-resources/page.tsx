import Link from "next/link";
import Topbar from "@/components/Topbar";
import TaskPlanView from "@/components/TaskPlanView";
import { listBlockInputs } from "@/lib/buildingBlocksDb";
import { listEstimates } from "@/lib/taskPlanDb";
import type { BlockInput } from "@/lib/buildingBlocks";
import type { Estimates } from "@/lib/taskPlan";

export const metadata = {
  title: "4 · Updated Backlog Tasks & Resources · Shift",
};
export const dynamic = "force-dynamic";

/** Phase 2 · 4 — the updated backlog: every task it takes to build the architecture, and its cost. */
export default async function Stage2TasksResourcesPage() {
  let inputs: BlockInput[] = [];
  let estimates: Estimates = {};
  try {
    [inputs, estimates] = await Promise.all([listBlockInputs(), listEstimates()]);
  } catch {
    // Keep the page usable even if the DB is unreachable: the architecture's tasks still show.
  }

  const link = "font-semibold text-fg underline-offset-4 hover:underline";

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
          <span className="text-fg">4 · Updated Backlog Tasks &amp; Resources</span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
              4
            </span>
            Updated Backlog Tasks &amp; Resources
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Everything it takes to bring the architecture to life. The tasks that come out of{" "}
            <Link href="/stage-2/architecture" className={link}>
              3 · Architecture
            </Link>
            , layer by layer, together with the items from{" "}
            <Link href="/stage-2/backlog" className={link}>
              2 · Backlog
            </Link>{" "}
            that each layer answers — and what each one costs: development time, people and what
            it needs.
          </p>
        </header>

        <TaskPlanView initialInputs={inputs} initialEstimates={estimates} />
      </main>
    </div>
  );
}
