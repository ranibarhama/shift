import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentTheme } from "@/lib/theme";

/** Landing — pick a Shift stage. */
export default async function Home() {
  const theme = await getCurrentTheme();

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-6 pb-20 pt-16 sm:pt-24">
      <div className="absolute right-6 top-6">
        <ThemeToggle initial={theme} />
      </div>

      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> B2C · AI Implementation Playbook
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          <span className="text-automate font-bold">Shift!</span>{" "}
          <span className="text-fg">Pick a stage</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
          Stage 1 is everything we&apos;ve built so far. Stage 2 is where we go next.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        <StageCard
          href="/stage-1"
          stage="Stage 1"
          status="Done so far"
          title="Shift Stage 1"
          desc="Everything we've built until now — mapping today's workflow, defining how good looks like, deciding where AI fits, and running the first pilot."
          chips={["Map", "Define", "Decide", "Pilot", "Results"]}
          cta="Enter Stage 1"
          hex="#7c5cff"
        />
        <StageCard
          href="/stage-2"
          stage="Stage 2"
          status="Up next"
          title="Shift Stage 2"
          desc="The next phase. See the process we ran so far on one diagram, then jump into Session 1."
          chips={["Process so far", "Session 1"]}
          cta="Open Stage 2"
          hex="#16a34a"
          highlight
        />
      </div>
    </main>
  );
}

function StageCard({
  href,
  stage,
  status,
  title,
  desc,
  chips,
  cta,
  hex,
  highlight,
}: {
  href: string;
  stage: string;
  status: string;
  title: string;
  desc: string;
  chips: string[];
  cta: string;
  hex: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card/60 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"
      style={{
        boxShadow: `inset 0 3px 0 0 ${hex}`,
        backgroundImage: highlight
          ? `radial-gradient(circle at 100% 0%, ${hex}1f, transparent 60%)`
          : undefined,
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ background: `${hex}1f`, color: hex }}
        >
          {stage}
        </span>
        <span className="text-[11px] text-muted">{status}</span>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c}
            className="rounded-full border border-line bg-bg/60 px-2.5 py-0.5 text-[11px] text-fg"
          >
            {c}
          </span>
        ))}
      </div>

      <span
        className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition group-hover:brightness-110"
        style={{ background: hex }}
      >
        {cta} →
      </span>
    </Link>
  );
}
