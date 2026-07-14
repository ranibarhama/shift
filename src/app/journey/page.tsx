import Link from "next/link";
import Topbar from "@/components/Topbar";
import FullscreenButton from "@/components/FullscreenButton";
import DecideTooltip from "@/components/DecideTooltip";
import { TrashIcon, BotIcon, MergeIcon, BrainIcon } from "@/components/DecisionIcons";

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

const DECISIONS = [
  {
    n: "01",
    title: "Drop it",
    desc: "Outdated or no-longer-useful steps.",
    hex: "#ef4444",
    Icon: TrashIcon,
  },
  {
    n: "02",
    title: "Automate it",
    desc: "AI handles it end-to-end.",
    hex: "#22c55e",
    Icon: BotIcon,
  },
  {
    n: "03",
    title: "Hybrid",
    desc: "Human + AI together.",
    hex: "#eab308",
    Icon: MergeIcon,
  },
  {
    n: "04",
    title: "Own it",
    desc: "Only humans can do this.",
    hex: "#38bdf8",
    Icon: BrainIcon,
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
      <main className="w-full">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden">
          {/* ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(124,92,255,0.55), transparent 65%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 top-20 h-[380px] w-[380px] rounded-full opacity-25 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(34,211,238,0.5), transparent 65%)",
            }}
          />
          <div className="relative mx-auto w-full max-w-5xl px-6 pb-14 pt-16 sm:pt-24">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Context · The story so far
              </div>
              <FullscreenButton />
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.04] tracking-tight text-fg sm:text-6xl">
              Map today. Define tomorrow.
              <br />
              <span className="text-accent">Decide where AI fits.</span>{" "}
              <span className="font-extrabold text-automate">Shift!</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              The B2C AI Implementation Playbook. Not just a snapshot of how we
              work today — it&apos;s where we define how we want to work next, and
              for every stage and task choose what to{" "}
              <span className="text-drop">drop</span>,{" "}
              <span className="text-automate">automate</span>,{" "}
              <span className="text-hybrid">make hybrid</span>, or{" "}
              <span className="text-own">own</span>.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted/80">
              Over the past two months we mapped how we work today, defined where AI
              makes the biggest impact, and turned it into a pilot we can run.
              Here&apos;s the whole journey on one page.
            </p>

            {/* Sessions strip */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {SESSIONS.map((s, i) => (
                <span key={s.name} className="flex items-center gap-2">
                  <Link
                    href={s.href}
                    className={
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs transition hover:border-accent/50 " +
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
            </div>
          </div>
        </section>

        {/* ============ THE JOURNEY (phases) ============ */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mb-12 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              How we got here
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Nine steps, left to right
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15.5px] leading-relaxed text-muted">
              The top navigation is the journey. Each step below is a real, editable
              page — click any of them to jump straight in.
            </p>
          </div>

          <div className="space-y-14">
            {PHASES.map((phase) => (
              <div key={phase.label}>
                <div className="mb-5 flex items-baseline gap-3">
                  <span className="font-mono text-sm font-bold tracking-[0.15em] text-accent">
                    {phase.label.toUpperCase()}
                  </span>
                  <div className="h-px flex-1 bg-line/70" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-fg">
                  {phase.title}
                </h3>
                <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
                  {phase.blurb}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {phase.steps.map((step) => (
                    <Link
                      key={step.n}
                      href={step.href}
                      className="group flex items-start gap-4 rounded-2xl border border-line bg-card/50 p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
                      style={{ boxShadow: `inset 3px 0 0 0 ${step.hex}` }}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[15px] font-bold tabular-nums"
                        style={{ background: `${step.hex}1a`, color: step.hex }}
                      >
                        {step.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[16px] font-semibold leading-tight text-fg">
                            {step.name}
                          </h4>
                          <span className="text-accent opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">
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

                {phase.label === "Phase 1" && <DecisionMini />}
              </div>
            ))}
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="border-t border-line/60">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-accent/10 p-10 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(124,92,255,0.6), transparent 65%)",
                }}
              />
              <div className="relative">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                  Now let&apos;s dive in
                </div>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                  The whole thing is live in this app.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted">
                  Every step above is a real, editable page. Start from the top of the
                  navigation and walk it left to right — the menu is the journey.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/main"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
                  >
                    Start the walkthrough →
                  </Link>
                  <Link
                    href="/kickoff"
                    className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-card px-6 py-3 text-sm font-semibold text-accent transition hover:bg-accent hover:text-ink"
                  >
                    Tomorrow&apos;s kickoff agenda
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function DecisionMini() {
  return (
    <div className="mt-4 rounded-2xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            The decision at the heart of it
          </div>
          <h4 className="mt-1 text-[16px] font-bold tracking-tight text-fg">
            For every stage &amp; task, decide
          </h4>
        </div>
        <DecideTooltip />
      </div>
      <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted">
        You&apos;ll tag every task and pain point inside every stage with one of
        these four choices. The visualization color-codes them so you can see
        where the work goes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DECISIONS.map((d) => (
          <span
            key={d.title}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
            style={{
              borderColor: `${d.hex}55`,
              color: d.hex,
              background: `${d.hex}12`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: d.hex }}
            />
            {d.title}
          </span>
        ))}
      </div>
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
