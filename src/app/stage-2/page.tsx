import Link from "next/link";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "Stage 2 · Shift",
};

/* -----------------------------------------------------------------------------
 * The process we ran in Stage 1 — same phases/steps as the journey page —
 * ending in the pilot results and handing off to Stage 2 · Session 1.
 * -------------------------------------------------------------------------- */

type FlowNode = {
  key: string;
  label: string;
  title: string;
  hex: string;
  steps: string[];
  numbered?: boolean;
  decisions?: boolean;
  href?: string;
};

const FLOW: FlowNode[] = [
  {
    key: "map",
    label: "Phase 1",
    title: "Map how we work today",
    hex: "#22d3ee",
    steps: ["B2C main workflow", "Department workflows"],
    numbered: true,
  },
  {
    key: "decide",
    label: "Phase 2",
    title: "Decide where AI fits",
    hex: "#a855f7",
    steps: ["Todo Backlog", "Hit List", "How good looks like", "Zoom out"],
    numbered: true,
    decisions: true,
  },
  {
    key: "pilot",
    label: "Phase 3",
    title: "Commit and run the pilot",
    hex: "#3b82f6",
    steps: ["Stages Definition", "Pilot Board", "Pilot Tracker"],
    numbered: true,
  },
  {
    key: "results",
    label: "Outcome",
    title: "Pilot results",
    hex: "#10b981",
    steps: [
      "AI-Native PM → Production pipeline",
      "Insight to live release, end to end",
      "~$20 total cost",
    ],
    href: "/pilot-results",
  },
];

const DECISIONS = [
  { label: "Drop", hex: "#ef4444" },
  { label: "Automate", hex: "#22c55e" },
  { label: "Hybrid", hex: "#eab308" },
  { label: "Own", hex: "#38bdf8" },
];

const TIMELINE: { when: string; name: string; next?: boolean }[] = [
  { when: "Session 1", name: "AI Transition Workshop" },
  { when: "Session 2", name: "Pilot Definition Meeting" },
  { when: "Kickoff", name: "AI Pilot Kickoff" },
  { when: "Pilot", name: "Pilot run & results" },
  { when: "Stage 2 · Session 1", name: "Today's status – Gap Mapping", next: true },
];

const SESSION_1_HREF = "/stage-2/session-1";

export default function Stage2Page() {
  // Step numbers run continuously across the three phases (1–9).
  let n = 0;
  const numbered = FLOW.map((node) =>
    node.numbered ? node.steps.map(() => ++n) : []
  );

  return (
    <div className="flex flex-1 flex-col">
      <Topbar stage={2} />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-fg"
          >
            ← All stages
          </Link>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Stage 2
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            The process so far
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            How Stage 1 unfolded — from mapping today&apos;s work to a shipped pilot —
            and where Stage 2 picks up.
          </p>
        </header>

        {/* Diagram */}
        <section aria-label="Stage 1 process diagram" className="mb-12">
          <SectionLabel>What we did in Stage 1</SectionLabel>
          <div className="mt-4 flex flex-col items-stretch lg:flex-row">
            {FLOW.map((node, i) => (
              <div key={node.key} className="flex flex-col lg:flex-1 lg:flex-row lg:min-w-0">
                <FlowCard node={node} nums={numbered[i]} />
                <FlowArrow />
              </div>
            ))}
            <NextCard />
          </div>
        </section>

        {/* Sessions timeline */}
        <section aria-label="Sessions timeline" className="mb-12">
          <SectionLabel>How we got here</SectionLabel>
          <ol className="relative mt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-[9px] hidden h-px bg-line sm:block"
            />
            {TIMELINE.map((t) => (
              <li key={t.name + t.when} className="relative flex items-start gap-3 sm:block">
                <span
                  className={
                    "relative z-10 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 " +
                    (t.next ? "border-automate bg-bg" : "border-accent bg-accent")
                  }
                  aria-hidden
                >
                  {!t.next && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <div className="sm:mt-3">
                  <div
                    className={
                      "text-[10px] font-semibold uppercase tracking-[0.15em] " +
                      (t.next ? "text-automate" : "text-muted")
                    }
                  >
                    {t.when} {t.next ? "· Next" : "· Done"}
                  </div>
                  {t.next ? (
                    <Link
                      href={SESSION_1_HREF}
                      className="text-sm font-semibold text-fg underline decoration-automate/50 underline-offset-4 hover:text-automate"
                    >
                      {t.name}
                    </Link>
                  ) : (
                    <div className="text-sm font-medium text-fg">{t.name}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <Link
          href={SESSION_1_HREF}
          className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-automate/40 bg-automate/10 p-6 transition hover:-translate-y-0.5 hover:border-automate/70 hover:shadow-lg"
        >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-automate">
              Up next
            </div>
            <div className="mt-1 text-xl font-semibold text-fg">
              Session 1 · Today&apos;s status – Gap Mapping
            </div>
            <div className="mt-0.5 text-xs text-muted">
              Map what we have, what&apos;s missing and what needs connecting — block by block —
              then see how good looks like.
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition group-hover:brightness-110"
            style={{ background: "#16a34a" }}
          >
            Open Session 1 →
          </span>
        </Link>
      </main>
    </div>
  );
}

/* ---------- Diagram pieces ---------- */

function FlowCard({ node, nums }: { node: FlowNode; nums: number[] }) {
  const body = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ background: `${node.hex}1f`, color: node.hex }}
        >
          {node.label}
        </span>
        {node.href && (
          <span className="text-[11px] font-semibold" style={{ color: node.hex }}>
            View →
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-semibold leading-tight text-fg">{node.title}</h3>
      <ul className="mt-3 space-y-1.5">
        {node.steps.map((s, i) => (
          <li key={s} className="flex items-start gap-2 text-[12.5px] leading-snug text-fg/90">
            {node.numbered ? (
              <span
                className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                style={{ background: `${node.hex}22`, color: node.hex }}
              >
                {nums[i]}
              </span>
            ) : (
              <svg
                className="mt-0.5 shrink-0"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={node.hex}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{s}</span>
          </li>
        ))}
      </ul>
      {node.decisions && (
        <div className="mt-3 flex flex-wrap gap-1 border-t border-line/60 pt-2.5">
          {DECISIONS.map((d) => (
            <span
              key={d.label}
              className="inline-flex items-center gap-1 text-[10px] text-muted"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.hex }} />
              {d.label}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const cls =
    "flex h-full w-full flex-col rounded-2xl border border-line bg-card/60 p-4 shadow-card";
  const style = { boxShadow: `inset 0 3px 0 0 ${node.hex}` };

  return node.href ? (
    <Link
      href={node.href}
      className={cls + " transition hover:-translate-y-0.5 hover:border-accent/40"}
      style={style}
    >
      {body}
    </Link>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

function NextCard() {
  return (
    <Link
      href={SESSION_1_HREF}
      className="group flex w-full flex-col justify-center rounded-2xl border-2 border-dashed border-automate/60 bg-automate/5 p-4 text-center transition hover:border-automate hover:bg-automate/10 lg:w-auto lg:min-w-[170px] lg:flex-[0.8]"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-automate">
        Stage 2
      </span>
      <span className="mt-1 text-[15px] font-semibold text-fg">Session 1</span>
      <span className="mt-0.5 text-[12px] font-medium text-fg/80">
        Today&apos;s status – Gap Mapping
      </span>
      <span className="mt-1 text-[11px] text-muted">Where we pick up next</span>
      <span className="mt-3 text-xs font-semibold text-automate transition group-hover:translate-x-0.5">
        Open →
      </span>
    </Link>
  );
}

function FlowArrow() {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center py-1.5 text-[#f97316] lg:px-1 lg:py-0"
    >
      <svg
        className="h-5 w-5 rotate-90 lg:rotate-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">{children}</div>
  );
}
