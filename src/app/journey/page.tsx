import Link from "next/link";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "The story so far · Shift",
};

type Step = {
  n: number;
  name: string;
  href: string;
  what: string;
  hex: string;
};

type Phase = {
  label: string;
  title: string;
  blurb: string;
  steps: Step[];
};

const PHASES: Phase[] = [
  {
    label: "Phase 1",
    title: "Map how we work today",
    blurb:
      "Before deciding anything, we drew the real picture — the main B2C process and every department's workflow, end to end.",
    steps: [
      {
        n: 1,
        name: "B2C main workflow",
        href: "/main",
        what: "Drafted the end-to-end process, stage by stage — the backbone everything else hangs off.",
        hex: "#22d3ee",
      },
      {
        n: 2,
        name: "Department workflows",
        href: "/overview",
        what: "Each director mapped their own workflow(s) and connected them to the main process. One A-to-Z picture.",
        hex: "#3b82f6",
      },
    ],
  },
  {
    label: "Phase 2",
    title: "Decide where AI fits",
    blurb:
      "With today mapped, we surfaced the gaps, agreed what to drop, and defined where we're heading.",
    steps: [
      {
        n: 3,
        name: "Todo Backlog",
        href: "/backlog",
        what: "Every gap logged and ranked by a Smart Sort action score — Impact × Horizon × Effort — so we argue strategy, not row order.",
        hex: "#a855f7",
      },
      {
        n: 4,
        name: "Hit List",
        href: "/hit-list",
        what: "Everything we agreed to stop doing — the work we deliberately walk away from.",
        hex: "#ef4444",
      },
      {
        n: 5,
        name: "How good looks like",
        href: "/blueprint",
        what: "The target state: Insights Engine → AI Build → GTM & Growth, wrapped by Ops & Governance, on a shared Organization Brain.",
        hex: "#f97316",
      },
      {
        n: 6,
        name: "Zoom out",
        href: "/big-stones",
        what: "The 200+ backlog items rolled up into a handful of strategic stones, each tied to a part of the target.",
        hex: "#7c5cff",
      },
    ],
  },
  {
    label: "Phase 3",
    title: "Commit and run the pilot",
    blurb:
      "From a shared target to owned commitments and a live pilot the team can actually ship.",
    steps: [
      {
        n: 7,
        name: "Stages Definition",
        href: "/next-steps",
        what: "Leaders nominated per stone, each with a KPI commitment, a 90-day outcome, and a first two-week pilot.",
        hex: "#22d3ee",
      },
      {
        n: 8,
        name: "Pilot Board",
        href: "/pilot-board",
        what: "Where we shape the pilot together — pick 2–3 initiatives and map what's missing on each stage to run them.",
        hex: "#3b82f6",
      },
      {
        n: 9,
        name: "Pilot Tracker",
        href: "/pilot-tracker",
        what: "Execution in one list — owners, due dates and status. Shareable by link so anyone can update progress.",
        hex: "#10b981",
      },
    ],
  },
];

const SESSIONS = [
  { name: "AI Transition Workshop", when: "Session 1", href: "/workshop" },
  { name: "Pilot Definition Meeting", when: "Session 2", href: "/pilot" },
  { name: "AI Pilot Kickoff", when: "Tomorrow", href: "/kickoff", now: true },
];

export default function JourneyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Topbar />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* Hero */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Context · The story so far
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-[36px]">
            What we&apos;ve built
          </h1>
          <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-muted">
            Over the past two months the B2C team mapped how we work today, defined
            where AI makes the biggest impact, and turned it into a pilot we can run.
            Here&apos;s the whole journey on one page — then we dive into the system
            itself.
          </p>
        </header>

        {/* Sessions strip */}
        <section className="mb-10 flex flex-wrap items-center gap-2">
          {SESSIONS.map((s, i) => (
            <span key={s.name} className="flex items-center gap-2">
              <Link
                href={s.href}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition hover:border-accent/50 " +
                  (s.now
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-line bg-card/60 text-muted hover:text-fg")
                }
              >
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                  {s.when}
                </span>
                <span className="font-medium">{s.name}</span>
              </Link>
              {i < SESSIONS.length - 1 && (
                <span className="text-[#f97316]" aria-hidden>
                  <Chevron />
                </span>
              )}
            </span>
          ))}
        </section>

        {/* Phases */}
        <div className="space-y-12">
          {PHASES.map((phase) => (
            <section key={phase.label}>
              <div className="mb-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {phase.label}
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">
                  {phase.title}
                </h2>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  {phase.blurb}
                </p>
              </div>

              <div className="space-y-2.5">
                {phase.steps.map((step) => (
                  <Link
                    key={step.n}
                    href={step.href}
                    className="group flex items-start gap-4 rounded-2xl border border-line bg-card/50 p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg sm:p-5"
                    style={{ boxShadow: `inset 3px 0 0 0 ${step.hex}` }}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[14px] font-bold tabular-nums"
                      style={{ background: `${step.hex}1a`, color: step.hex }}
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-semibold leading-tight text-fg">
                          {step.name}
                        </h3>
                        <span className="text-muted opacity-0 transition group-hover:opacity-100">
                          →
                        </span>
                      </div>
                      <p className="mt-1 text-[13.5px] leading-snug text-muted">
                        {step.what}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-accent/40 bg-accent/10 p-6 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Now let&apos;s dive in
          </div>
          <h2 className="mt-1 text-xl font-semibold text-fg">
            The whole thing is live in this app.
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">
            Every step above is a real, editable page. Start from the top of the
            navigation and walk it left to right — the menu is the journey.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/main"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
            >
              Start the walkthrough →
            </Link>
            <Link
              href="/kickoff"
              className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-card px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-ink"
            >
              Tomorrow&apos;s kickoff agenda
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
