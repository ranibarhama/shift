import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import { STAGE2_STEPS, stage2Href, stage2Step } from "@/lib/stage2";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ step: string }> };

export async function generateMetadata({ params }: Props) {
  const s = stage2Step((await params).step);
  return { title: s ? `${s.n} · ${s.title} · Shift` : "Shift" };
}

/**
 * Phase 2 steps that are planned but have no content yet (ready: false in
 * src/lib/stage2.ts). Steps with their own page (1, 2) never reach here —
 * their static routes take precedence.
 */
export default async function Stage2PlannedStepPage({ params }: Props) {
  const s = stage2Step((await params).step);
  if (!s || s.ready) notFound();
  const prev = STAGE2_STEPS.find((x) => x.n === s.n - 1);
  const next = STAGE2_STEPS.find((x) => x.n === s.n + 1);

  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-fg">
            All phases
          </Link>
          <span aria-hidden>›</span>
          <Link href="/stage-2" className="hover:text-fg">
            Phase 2
          </Link>
          <span aria-hidden>›</span>
          <span className="text-fg">
            {s.n} · {s.title}
          </span>
        </nav>

        <header className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-card text-lg font-semibold text-fg">
              {s.n}
            </span>
            {s.title}
          </h1>
        </header>

        <div className="rounded-2xl border border-dashed border-line bg-card/40 px-6 py-14 text-center">
          <div className="text-sm font-semibold text-fg">Nothing here yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            This step is planned{prev ? ` — it comes after ${prev.n} · ${prev.title}` : ""}. Its
            content will be added here.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {prev && (
              <Link
                href={stage2Href(prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-fg"
              >
                ← {prev.n} · {prev.title}
              </Link>
            )}
            {next && (
              <Link
                href={stage2Href(next)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-fg"
              >
                {next.n} · {next.title} →
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
