import Link from "next/link";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "Stage 2 · Session 1 · Shift",
};

/** Stage 2 · Session 1 — placeholder until the session content is defined. */
export default function Stage2Session1Page() {
  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
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

        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
          Shift · Stage 2
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Session 1
        </h1>

        <div className="mt-8 rounded-2xl border border-dashed border-line bg-card/40 px-6 py-14 text-center">
          <div className="text-sm font-semibold text-fg">Nothing here yet</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            The agenda and content for the first Stage 2 session will live on this page.
          </p>
          <Link
            href="/stage-2"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-fg"
          >
            ← Back to the process so far
          </Link>
        </div>
      </main>
    </div>
  );
}
