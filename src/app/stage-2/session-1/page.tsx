import Link from "next/link";
import Topbar from "@/components/Topbar";
import HowGoodHL from "@/components/HowGoodHL";

export const metadata = {
  title: "Session 1 · How good looks like – HL · Shift",
};

/** Stage 2 · Session 1 — "How good looks like" at a high level (HL). */
export default function Stage2Session1Page() {
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
            The high-level picture: the transformation structure from today to target, and
            the details behind it — told as a graphic presentation. Hit{" "}
            <span className="font-semibold text-fg">Present</span> to run it full screen
            (← → to move, Esc to exit).
          </p>
        </header>

        <HowGoodHL />
      </main>
    </div>
  );
}
