import Link from "next/link";
import Topbar from "@/components/Topbar";
import { STAGE2_STEPS, stage2Href, type Stage2Step } from "@/lib/stage2";

export const metadata = {
  title: "Phase 2 · Shift",
};

/* -----------------------------------------------------------------------------
 * The process we ran in Phase 1 — same parts/steps as the journey page —
 * ending in the pilot results and handing off to Phase 2 · Step 1.
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
    label: "Part 1",
    title: "Map how we work today",
    hex: "#22d3ee",
    steps: ["B2C main workflow", "Department workflows"],
    numbered: true,
  },
  {
    key: "decide",
    label: "Part 2",
    title: "Decide where AI fits",
    hex: "#a855f7",
    steps: ["Todo Backlog", "Hit List", "How good looks like", "Zoom out"],
    numbered: true,
    decisions: true,
  },
  {
    key: "pilot",
    label: "Part 3",
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

export default function Stage2Page() {
  // Step numbers run continuously across the three parts (1–9).
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
            ← All phases
          </Link>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
            Shift · Phase 2
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            The process so far
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            How Phase 1 unfolded — from mapping today&apos;s work to a shipped pilot —
            and where Phase 2 picks up.
          </p>
        </header>

        {/* Diagram */}
        <section aria-label="Phase 1 process diagram" className="mb-12">
          <SectionLabel>What we did in Phase 1</SectionLabel>
          <div className="mt-4 flex flex-col items-stretch lg:flex-row">
            {FLOW.map((node, i) => (
              <div key={node.key} className="flex flex-col lg:flex-1 lg:flex-row lg:min-w-0">
                <FlowCard node={node} nums={numbered[i]} />
                {i < FLOW.length - 1 && <FlowArrow />}
              </div>
            ))}
          </div>
        </section>

        {/* Phase 2 — the same steps as the header menu */}
        <section aria-label="Phase 2 steps diagram">
          <SectionLabel>What we&apos;re doing next in Phase 2</SectionLabel>
          <ol className="mt-4 flex flex-col items-stretch lg:flex-row">
            {STAGE2_STEPS.map((s, i) => (
              <li key={s.slug} className="flex flex-col lg:flex-1 lg:flex-row lg:min-w-0">
                <StepCard step={s} />
                {i < STAGE2_STEPS.length - 1 && <FlowArrow />}
              </li>
            ))}
          </ol>
        </section>
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

function StepCard({ step: s }: { step: Stage2Step }) {
  return (
    <Link
      href={stage2Href(s)}
      className={
        "group flex h-full w-full flex-col rounded-2xl border bg-card/60 p-3.5 shadow-card transition hover:-translate-y-0.5 " +
        (s.ready
          ? "border-automate/50 hover:border-automate"
          : "border-dashed border-line hover:border-accent/40")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-bg text-xs font-semibold text-fg">
          {s.n}
        </span>
        {(s.n === 1 || !s.ready) && (
          <span
            className={
              "text-[10px] font-semibold uppercase tracking-[0.12em] " +
              (s.ready ? "text-automate" : "text-muted")
            }
          >
            {s.ready ? "Up next" : "Planned"}
          </span>
        )}
      </div>
      <h3 className="text-[13.5px] font-semibold leading-tight text-fg">{s.title}</h3>
      <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{s.summary}</p>
      {s.ready && (
        <span className="mt-auto pt-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-semibold text-white transition group-hover:brightness-110"
            style={{ background: "#16a34a" }}
          >
            Open →
          </span>
        </span>
      )}
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
