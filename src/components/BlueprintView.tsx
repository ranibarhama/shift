"use client";

import { useState } from "react";

/* -----------------------------------------------------------------------------
 * Content — kept as plain data so it's trivial to tweak later.
 * Translated from the CEO's "AI-Native Product Organization Blueprint".
 * High-level only: capture the stage of each layer, not every sub-chip.
 * -------------------------------------------------------------------------- */

type Layer = {
  num: string;
  title: string;
  summary: string;
  hex: string;
  centerpiece?: { label: string; sublabel?: string };
  stages: string[];
  extras?: { label: string; items: string[] }[];
};

const TRANSITIONS: string[] = [
  "AI expands capacity; humans own judgment",
  "From project management to decision management",
  "From roadmap theatre to live portfolio control",
  "From sprint rituals to adaptive execution",
  "From static reports to live operating intelligence",
  "From isolated functions to outcome-owned mini-pods",
  "From one-time launches to continuous learning loops",
];

const FLOW_TAGLINE =
  "From research → planning → MVP → launch → growth → feedback → continuous learning";

export const LAYERS: Layer[] = [
  {
    num: "1",
    title: "Market & User Intelligence",
    summary:
      "Always-on agents listening to the market, users, support, social and competitors — feeding a single Insight Engine.",
    hex: "#22d3ee",
    centerpiece: { label: "Insight Engine", sublabel: "single source of signal" },
    stages: [
      "Competitive research agents",
      "User & app-store review mining",
      "Sentiment & social listening",
      "Search & demand signals",
      "Customer support themes",
      "Pricing & regulatory scanning",
    ],
    extras: [
      {
        label: "Signal tags from the market",
        items: [
          "Pains",
          "Jobs-to-be-done",
          "Demand signals",
          "Complaints",
          "Competitor gaps",
          "Feature opportunities",
          "Risk flags",
        ],
      },
    ],
  },
  {
    num: "2",
    title: "Planning & Prioritization",
    summary:
      "Insights become opportunities, opportunities become scored bets. A single decision gate (Planthon) commits the company to what's next.",
    hex: "#a855f7",
    centerpiece: { label: "PLANTHON", sublabel: "leadership decision gate" },
    stages: [
      "Opportunity backlog",
      "AI-assisted PRDs",
      "Hypothesis builder",
      "Experiment design",
      "RICE scoring engine",
      "Risk & dependency mapping",
    ],
    extras: [
      {
        label: "Planthon outputs per bet",
        items: [
          "MVP scope",
          "Success metrics",
          "Owner",
          "Risks",
          "Timeline",
          "GTM angle",
          "Financial assumptions",
          "Required agents",
          "Required humans-in-the-loop",
        ],
      },
    ],
  },
  {
    num: "3",
    title: "AI Build / MVP",
    summary:
      "From idea to testable MVP in days, not quarters. AI generates code, UX, copy and instrumentation against a shared design system.",
    hex: "#3b82f6",
    centerpiece: { label: "MVP MODE", sublabel: "ship in days" },
    stages: [
      "AI code generation",
      "AI UX wireframing",
      "AI design system assistant",
      "AI QA agent",
      "AI analytics instrumentation",
      "AI copy & content assistant",
    ],
    extras: [
      {
        label: "Reusable foundation",
        items: [
          "Prompt library",
          "Reusable components",
          "Data contracts",
          "Feature flag setup",
          "Experiment setup",
        ],
      },
    ],
  },
  {
    num: "4",
    title: "No-Sprints Execution",
    summary:
      "Sprints out, continuous adaptive flow in. Signal → decision → build → learn → adjust, on a daily cadence.",
    hex: "#10b981",
    stages: [
      "Continuous prioritization",
      "Real-time backlog reshaping",
      "Micro-delivery cycles",
      "Daily decision loops",
      "AI task decomposition",
      "Agent-generated implementation plans",
      "Human approval checkpoints",
      "Live risk alerts",
      "Auto-generated status updates",
      "Dependency detection",
      "Fast rollback & iteration",
    ],
    extras: [
      {
        label: "Old model vs. new model",
        items: [
          "Old: plan → execute → review",
          "New: signal → decide → build → learn → adjust",
        ],
      },
    ],
  },
  {
    num: "5",
    title: "Human-in-the-Loop Mini-Pods",
    summary:
      "Cross-functional pods owned by humans, supported by an agent stack. Agents recommend. Humans decide. Systems remember.",
    hex: "#f59e0b",
    centerpiece: { label: "OPERATING BRAIN", sublabel: "shared memory across pods" },
    stages: [
      "Product pod",
      "UX & research pod",
      "Engineering pod",
      "Design pod",
      "Marketing pod",
      "Growth pod",
      "Ops pod",
      "Customer support pod",
      "Finance pod",
      "Legal / compliance pod",
      "Data / analytics pod",
    ],
    extras: [
      {
        label: "Every pod owns",
        items: [
          "Human owner",
          "Agent stack",
          "KPI ownership",
          "Risk ownership",
          "Feedback ownership",
        ],
      },
    ],
  },
  {
    num: "6",
    title: "Go-to-Market & Growth",
    summary:
      "Launch and growth handled by an agent crew across every channel, watched by live KPI monitors that feed product back.",
    hex: "#ef4444",
    stages: [
      "Launch strategy agent",
      "Campaign setup agents",
      "Creative testing agents",
      "Landing page agent",
      "ASO / SEO agent",
      "Paid UA agent",
      "CRM / lifecycle agent",
      "Upsell & cross-sell agents",
      "Pricing experiment agent",
      "Retargeting & monetization agents",
    ],
    extras: [
      {
        label: "Channels",
        items: [
          "App stores",
          "Web",
          "Browser extensions",
          "Paid search",
          "Paid social",
          "SEO",
          "Email",
          "Push",
          "Affiliates",
          "Partnerships",
          "Communities",
          "Influencers",
        ],
      },
      {
        label: "Live KPI monitors",
        items: [
          "CAC",
          "ROAS",
          "CVR",
          "Retention",
          "Trial start",
          "Trial-to-paid",
          "ARPU",
          "Churn",
          "Payback period",
          "LTV",
        ],
      },
    ],
  },
  {
    num: "7",
    title: "Ops, Risk & Governance",
    summary:
      "A single AI Ops layer giving leadership real-time visibility, ownership clarity and automatic alerts across product, marketing, legal and finance.",
    hex: "#7c5cff",
    stages: [
      "AI Ops layer",
      "Project visibility",
      "Ownership map",
      "Decision log",
      "Risk register",
      "Compliance & privacy checks",
      "App-store policy review",
      "Security review",
      "Quality gates",
      "Dependency map",
      "Leadership dashboard",
    ],
    extras: [
      {
        label: "Alert nodes",
        items: ["Product alerts", "Marketing alerts", "Legal alerts", "Finance alerts"],
      },
    ],
  },
  {
    num: "8",
    title: "Financial Performance",
    summary:
      "Money in, money out, modeled live. Every metric ties back to a decision the leadership can take this week.",
    hex: "#eab308",
    stages: [
      "Revenue tracking",
      "Cost tracking",
      "AI tooling costs",
      "Marketing spend",
      "R&D capacity",
      "Gross margin & unit economics",
      "CAC, LTV, ROAS, payback",
      "Forecasting & scenario planning",
      "Plan vs. actual",
      "Budget alerts",
      "Profitability dashboard",
    ],
    extras: [
      {
        label: "Decision outputs",
        items: [
          "Increase budget",
          "Cut spend",
          "Change pricing",
          "Adjust roadmap",
          "Stop experiment",
          "Scale winner",
          "Fix retention",
          "Reduce cost",
          "Raise LTV",
        ],
      },
    ],
  },
];

const LEARNING_LOOP_HEX = "#a855f7";
const LEARNING_LOOP_ITEMS = [
  "Experiment results",
  "Customer feedback",
  "Failed bets",
  "Winning patterns",
  "Decision history",
  "Prompt library",
  "Playbooks",
  "Reusable workflows",
  "Campaign learnings",
  "Product learnings",
  "Risk learnings",
  "Financial learnings",
];

/* ----- Transformation tab data ----- */

type TransformStage = {
  key: string;
  currentName: string;
  currentSummary: string;
};

const TRANSFORM_STAGES: TransformStage[] = [
  {
    key: "research",
    currentName: "Research & Planning",
    currentSummary:
      "Manual market research and roadmap planning, mostly periodic, scattered across spreadsheets and docs.",
  },
  {
    key: "development",
    currentName: "Development",
    currentSummary:
      "Sprint-based delivery. Specs become tickets become code, reviewed in cycles.",
  },
  {
    key: "gtm",
    currentName: "Go to Market",
    currentSummary:
      "Launch campaigns, channel setup and messaging owned per team, one launch at a time.",
  },
  {
    key: "growth",
    currentName: "Growth",
    currentSummary:
      "Per-feature growth experiments and reporting, learnings live in the team that ran them.",
  },
];

/* -------------------------------------------------------------------------- */

export default function BlueprintView() {
  const [tab, setTab] = useState<"layers" | "transform" | "diagram">("layers");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Hero — minimal */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
          How good looks like
        </h1>
        <p className="mt-1.5 text-sm italic text-muted">{FLOW_TAGLINE}</p>
      </header>

      {/* Tab bar — underline style */}
      <div className="mb-8 border-b border-line">
        <div className="flex gap-6">
          <TabButton active={tab === "layers"} onClick={() => setTab("layers")}>
            Layers
          </TabButton>
          <TabButton active={tab === "transform"} onClick={() => setTab("transform")}>
            Transformation structure
          </TabButton>
          <TabButton active={tab === "diagram"} onClick={() => setTab("diagram")}>
            Transformation diagram
          </TabButton>
        </div>
      </div>

      {tab === "layers" && <LayersTab />}
      {tab === "transform" && <TransformTab />}
      {tab === "diagram" && <DiagramTab />}
    </div>
  );
}

/* ===== Tab 1: Layers ===================================================== */

function LayersTab() {
  return (
    <>
      {/* Seven shifts — compact two-row grid */}
      <section className="mb-10">
        <SectionLabel>Seven shifts behind the model</SectionLabel>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {TRANSITIONS.map((t, i) => (
            <li key={i} className="flex items-baseline gap-3">
              <span className="w-5 shrink-0 font-mono text-[11px] text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-snug text-fg">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* 8 layers — slimmer cards */}
      <section className="my-10 space-y-3">
        <SectionLabel>Eight layers</SectionLabel>
        <div className="space-y-3 pt-2">
          {LAYERS.map((layer) => (
            <LayerCard key={layer.num} layer={layer} />
          ))}
        </div>
      </section>

      <Divider />

      {/* Organizational memory & learning loop */}
      <section className="mb-2 mt-10">
        <SectionLabel>Foundation</SectionLabel>
        <article
          className="mt-3 overflow-hidden rounded-2xl border border-line bg-card/40"
          style={{ boxShadow: `inset 3px 0 0 0 ${LEARNING_LOOP_HEX}` }}
        >
          <div className="flex items-center gap-3 px-5 pt-5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg text-sm font-semibold"
              style={{ background: `${LEARNING_LOOP_HEX}1a`, color: LEARNING_LOOP_HEX }}
              aria-hidden
            >
              ∞
            </span>
            <h3 className="text-base font-semibold text-fg">
              Organizational memory & learning loop
            </h3>
          </div>
          <p className="mt-2 px-5 text-sm leading-snug text-muted">
            Every launch teaches the next plan. Every failure informs the next bet.
            Captured centrally so the company compounds learning instead of repeating it.
          </p>
          <div className="flex flex-wrap gap-1.5 px-5 pb-5 pt-3">
            {LEARNING_LOOP_ITEMS.map((item) => (
              <span
                key={item}
                className="whitespace-nowrap rounded-full border border-line bg-bg/70 px-2.5 py-0.5 text-[11px] text-fg"
              >
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

/* ===== Tab 2: Transformation structure ================================== */

function TransformTab() {
  const [view, setView] = useState<"current" | "future">("current");

  return (
    <section className="space-y-5">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <SectionLabel>B2C workflow, today vs. target</SectionLabel>
        <ToggleSwitch view={view} onChange={setView} />
      </div>

      {view === "current" ? <CurrentStructure /> : <FutureStructure />}
    </section>
  );
}

function CurrentStructure() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-2">
      {TRANSFORM_STAGES.map((s, idx) => (
        <div key={s.key} className="relative">
          <TransformStageCard stage={s} index={idx} />
          {idx < TRANSFORM_STAGES.length - 1 && (
            <span
              aria-hidden
              className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-line lg:block"
            >
              <Chevron />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ----- Future "How good looks like" — refined diagram view --------------- */

const TEAL = "#14b8a6";
const PODS_HEX = "#8b5cf6"; // purple — Mini Pods Structure label
const BRAIN_HEX = "#a855f7"; // purple — Decision Brain accent

function FutureStructure() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_minmax(0,300px)]">
      {/* Left column — the main flow */}
      <div className="relative space-y-5">
        {/* Connecting rail behind cards row */}
        <div className="relative">
          {/* Subtle horizontal gradient rail running between card centers */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[16%] right-[16%] top-[44px] hidden h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent md:block"
          />
          {/* 3 stage cards */}
          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            <FutureStageCard
              num={1}
              eyebrow="Stage 01"
              title="B2C Insights Engine"
              description="Always-on agents listening to the market, users, support, social and competitors — feeding a single Insight Engine."
              accentHex={TEAL}
              chevronAfter
            >
              <div className="space-y-3">
                <div>
                  <div className="text-[12px] font-semibold text-fg">
                    Single source of signal
                  </div>
                  <div className="text-[11px] italic text-muted">Always on</div>
                </div>
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                    Replaces
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <PillBadge hex={TEAL}>Market &amp; User Intelligence</PillBadge>
                    <PillBadge hex={TEAL}>Planning &amp; Prioritization</PillBadge>
                  </div>
                </div>
              </div>
            </FutureStageCard>

            <FutureStageCard
              num={2}
              eyebrow="Stage 02"
              title="AI Build / MVP & Legacy"
              description="From idea to testable MVP in days, not quarters. AI generates code, UX, copy and instrumentation against a shared design system."
              accentHex={PODS_HEX}
              chevronAfter
            >
              <div className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Two streams of work
                </div>

                <StreamPanel
                  label="Legacy"
                  sublabel="existing product"
                  hex="#64748b"
                  items={[
                    "AI maintenance & refactor agents",
                    "Regression test guardrails",
                    "Backwards-compat checks",
                  ]}
                />

                <StreamPanel
                  label="New features"
                  sublabel="greenfield bets"
                  hex={PODS_HEX}
                  badge="Mini Pods Structure"
                  items={[
                    "MVP Mode from a Planthon brief",
                    "Experiment-first delivery",
                    "Fast rollback if it tanks",
                  ]}
                />

                <OperatingModelPill hex={TEAL}>
                  No-Sprints Execution
                </OperatingModelPill>
              </div>
            </FutureStageCard>

            <FutureStageCard
              num={3}
              eyebrow="Stage 03"
              title="GTM & Grow"
              description="Launch and growth handled by an agent crew across every channel, watched by live KPI monitors that feed product back."
              accentHex="#ef4444"
            >
              <ul className="space-y-2.5">
                {[
                  "Agent-driven GTM",
                  "Live KPI monitors",
                  "Real-time alerting & reporting",
                ].map((it) => (
                  <li key={it} className="flex items-start gap-2 text-[13px] text-fg">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </FutureStageCard>
          </div>
        </div>

        {/* Cross-cutting bands */}
        <div className="space-y-2.5">
          <CrossCuttingBand layerNum="7" />
          <CrossCuttingBand layerNum="8" />
        </div>
      </div>

      {/* Right column — Decision Brain card */}
      <DecisionBrainCard />
    </div>
  );
}

function FutureStageCard({
  num,
  eyebrow,
  title,
  description,
  accentHex,
  chevronAfter,
  children,
}: {
  num: number;
  eyebrow: string;
  title: string;
  description: string;
  accentHex: string;
  chevronAfter?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <article
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card/60 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
        style={{ boxShadow: `inset 0 3px 0 0 ${accentHex}` }}
      >
        {/* Header: hex badge + eyebrow + title */}
        <header className="flex items-start gap-3 px-4 pb-3 pt-5">
          <Hexagon num={num} hex={accentHex} />
          <div className="min-w-0 flex-1">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accentHex }}
            >
              {eyebrow}
            </div>
            <h3 className="text-[15px] font-semibold leading-tight text-fg">
              {title}
            </h3>
          </div>
        </header>

        {/* What is it */}
        <div className="px-4 pb-3">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            What is it
          </div>
          <p className="text-[12px] leading-snug text-fg/85">{description}</p>
        </div>

        <div className="mx-4 border-t border-line/50" />

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4">{children}</div>
      </article>

      {chevronAfter && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3.5 top-[44px] hidden -translate-y-1/2 md:block"
        >
          <RailChevron hex={accentHex} />
        </span>
      )}
    </div>
  );
}

function PillBadge({ hex, children }: { hex: string; children: React.ReactNode }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        background: `${hex}14`,
        color: hex,
        border: `1px solid ${hex}40`,
      }}
    >
      {children}
    </span>
  );
}

function StreamPanel({
  label,
  sublabel,
  hex,
  badge,
  items,
}: {
  label: string;
  sublabel?: string;
  hex: string;
  badge?: string;
  items: string[];
}) {
  return (
    <div
      className="rounded-xl border bg-bg/40 p-2.5"
      style={{ borderColor: `${hex}33` }}
    >
      <div className="mb-1.5 flex flex-wrap items-baseline gap-1.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: hex }}
        >
          {label}
        </span>
        {sublabel && <span className="text-[10px] text-muted">· {sublabel}</span>}
        {badge && (
          <span
            className="ml-auto rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider"
            style={{
              background: `${hex}18`,
              color: hex,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-start gap-1.5 text-[11px] leading-snug text-fg"
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: hex }}
              aria-hidden
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OperatingModelPill({
  hex,
  children,
}: {
  hex: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={{
        borderColor: `${hex}44`,
        background: `${hex}10`,
      }}
    >
      <span
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
        style={{ background: hex }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-white" fill="currentColor">
          <path d="M13 2 4 14h7l-2 8 11-13h-7l2-7z" />
        </svg>
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: hex }}
      >
        Operating model
      </span>
      <span className="text-[12px] font-semibold text-fg">{children}</span>
    </div>
  );
}

function DecisionBrainCard() {
  return (
    <aside
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card/60 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
      style={{
        backgroundImage: `radial-gradient(circle at 100% 0%, ${BRAIN_HEX}18, transparent 60%)`,
        boxShadow: `inset 0 3px 0 0 ${BRAIN_HEX}`,
      }}
    >
      <header className="flex items-start gap-3 px-5 pb-3 pt-5">
        <BrainIcon hex={BRAIN_HEX} />
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: BRAIN_HEX }}
          >
            Sits above everything
          </div>
          <h3 className="text-[15px] font-semibold leading-tight text-fg">
            B2C Decision Brain
          </h3>
        </div>
      </header>

      <div className="px-5 pb-3">
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
          What is it
        </div>
        <p className="text-[12px] leading-snug text-fg/85">
          A living knowledge layer that captures, updates and serves everything the
          organization knows. It sits above today's tools, turning scattered work
          output into a connected knowledge graph that humans and AI agents can both
          query.
        </p>
      </div>

      <div className="mx-5 border-t border-line/50" />

      <ul className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        {[
          "Answers you can actually trust",
          "Maintain a real source of truth",
          "Build reliable context for agents",
        ].map((b) => (
          <li key={b} className="flex items-start gap-2 text-[13px] text-fg">
            <CheckMark hex={BRAIN_HEX} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Hexagon({ num, hex }: { num: number; hex: string }) {
  return (
    <span className="relative grid h-9 w-9 shrink-0 place-items-center">
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full drop-shadow-sm"
        aria-hidden
      >
        <defs>
          <linearGradient id={`hex-grad-${num}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={hex} stopOpacity="0.18" />
            <stop offset="100%" stopColor={hex} stopOpacity="0.32" />
          </linearGradient>
        </defs>
        <polygon
          points="12,1.5 22.5,7.25 22.5,16.75 12,22.5 1.5,16.75 1.5,7.25"
          fill={`url(#hex-grad-${num})`}
          stroke={hex}
          strokeWidth="1"
        />
      </svg>
      <span
        className="relative text-[12px] font-bold tabular-nums"
        style={{ color: hex }}
      >
        {num}
      </span>
    </span>
  );
}

function RailChevron({ hex }: { hex: string }) {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full"
      style={{
        background: `${hex}18`,
        border: `1px solid ${hex}55`,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hex}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </span>
  );
}

function BrainIcon({ hex }: { hex: string }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
      style={{
        background: `${hex}1a`,
        border: `1px solid ${hex}44`,
      }}
      aria-hidden
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hex}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15A2.5 2.5 0 0 1 9.5 22 2.5 2.5 0 0 1 7 19.5V18a2 2 0 0 1-2-2 2 2 0 0 1-1-3.7 2.5 2.5 0 0 1 0-4.6 2 2 0 0 1 1-3.7 2 2 0 0 1 2-2A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5V18a2 2 0 0 0 2-2 2 2 0 0 0 1-3.7 2.5 2.5 0 0 0 0-4.6 2 2 0 0 0-1-3.7 2 2 0 0 0-2-2A2.5 2.5 0 0 0 14.5 2Z" />
      </svg>
    </span>
  );
}

function CheckMark({ hex }: { hex: string }) {
  return (
    <span
      className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full"
      style={{ background: `${hex}1a`, border: `1px solid ${hex}55` }}
      aria-hidden
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hex}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

/* ===== Tab 3: Transformation diagram ==================================== */

const CURRENT_FLOW_BOXES = [
  { label: "Research" },
  { label: "Planning" },
  { label: "DEV" },
  { label: "GTM" },
  { label: "Growth" },
];

const AI_BUILD_BULLETS = [
  "Legacy vs. new features",
  "No-sprints execution (Layer 4)",
  "Human in the loop",
  "0 → 1 mindset",
];

function DiagramTab() {
  const [view, setView] = useState<"current" | "future">("current");

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionLabel>Process diagram, today vs. target</SectionLabel>
        <ToggleSwitch view={view} onChange={setView} />
      </div>

      {view === "current" ? <CurrentDiagram /> : <FutureDiagram />}
    </section>
  );
}

function CurrentDiagram() {
  return (
    <div className="rounded-2xl border border-line bg-card/30 p-6 sm:p-8">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {CURRENT_FLOW_BOXES.map((b, i) => (
          <div key={b.label} className="flex flex-1 items-center gap-3">
            <DiagramBox label={b.label} />
            {i < CURRENT_FLOW_BOXES.length - 1 && (
              <span className="hidden text-line sm:block">
                <FlowChevron />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FutureDiagram() {
  const layer1 = LAYERS.find((l) => l.num === "1")!;
  const layer2 = LAYERS.find((l) => l.num === "2")!;
  const layer3 = LAYERS.find((l) => l.num === "3")!;
  const layer4 = LAYERS.find((l) => l.num === "4")!;
  const layer5 = LAYERS.find((l) => l.num === "5")!;
  const layer6 = LAYERS.find((l) => l.num === "6")!;

  return (
    <div className="space-y-4">
      {/* Cross-cutting Layer 7 — top */}
      <CrossCuttingBand layerNum="7" />

      <div className="rounded-2xl border border-line bg-card/30 p-5 sm:p-7">
        {/* Row 1: Insight chain */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <DiagramBox label="Research signals" hex={layer1.hex} muted />
          <Arrow direction="horizontal" />
          <DiagramBox
            label="B2C Insights Engine"
            sublabel={`Layer ${layer1.num} + ${layer2.num}`}
            hex={layer1.hex}
            emphasized
          />
          <Arrow direction="horizontal" />
          <DiagramBox
            label="Planning & Prioritization"
            sublabel="Planthon · Layer 2"
            hex={layer2.hex}
            emphasized
          />
        </div>

        <Arrow direction="vertical" />

        {/* Row 2: Mini Pods wrapper around AI Build */}
        <DashedWrapper title="Mini Pods" caption={`Layer ${layer5.num} · cross-functional`} hex={layer5.hex}>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <DiagramBox
              label="AI Build / MVP"
              sublabel={`Layer ${layer3.num}`}
              hex={layer3.hex}
              emphasized
            />
            <div className="flex-1 rounded-xl border border-line bg-bg/40 p-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                How this stage operates
              </div>
              <ul className="space-y-1">
                {AI_BUILD_BULLETS.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[12px] leading-snug text-fg"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: layer4.hex }}
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DashedWrapper>

        <Arrow direction="vertical" />

        {/* Row 3: Organization Brain wrapper around GTM + Learning loop */}
        <DashedWrapper
          title="Organization Brain"
          caption="shared memory across pods"
          hex={LEARNING_LOOP_HEX}
        >
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <DiagramBox
              label="Agent-Driven GTM"
              sublabel={`Layer ${layer6.num}`}
              hex={layer6.hex}
              emphasized
            />
            <Arrow direction="horizontal" />
            <DiagramBox
              label="Tracking & Learning Loop"
              sublabel="Org memory"
              hex={LEARNING_LOOP_HEX}
              emphasized
            />
          </div>
        </DashedWrapper>
      </div>

      {/* Cross-cutting Layer 8 — bottom */}
      <CrossCuttingBand layerNum="8" />
    </div>
  );
}

function DiagramBox({
  label,
  sublabel,
  hex,
  emphasized,
  muted,
}: {
  label: string;
  sublabel?: string;
  hex?: string;
  emphasized?: boolean;
  muted?: boolean;
}) {
  const accent = hex ?? "#94a3b8";
  return (
    <div
      className="flex-1 rounded-xl border bg-card/60 px-3.5 py-2.5 text-center transition"
      style={{
        borderColor: emphasized ? `${accent}55` : "rgb(var(--line))",
        background: emphasized ? `${accent}10` : undefined,
        boxShadow: emphasized ? `inset 0 -2px 0 0 ${accent}` : undefined,
        opacity: muted ? 0.78 : 1,
      }}
    >
      <div
        className="text-[13px] font-semibold leading-tight text-fg"
        style={{ color: emphasized ? "rgb(var(--fg))" : undefined }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          className="mt-0.5 text-[10px] uppercase tracking-wider"
          style={{ color: accent }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

function Arrow({ direction }: { direction: "horizontal" | "vertical" }) {
  if (direction === "vertical") {
    return (
      <div className="my-2 flex justify-center" aria-hidden>
        <span className="text-line/70">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    );
  }
  return (
    <span className="hidden shrink-0 text-line/70 sm:block" aria-hidden>
      <FlowChevron />
    </span>
  );
}

function DashedWrapper({
  title,
  caption,
  hex,
  children,
}: {
  title: string;
  caption?: string;
  hex: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl border-2 border-dashed bg-bg/20 px-4 py-5 sm:px-5"
      style={{ borderColor: `${hex}55` }}
    >
      <div
        className="absolute -top-2.5 left-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ borderColor: `${hex}55`, color: hex }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
        {title}
      </div>
      {caption && (
        <div className="absolute -top-2.5 right-4 hidden rounded-full border border-line bg-card px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted sm:inline-flex">
          {caption}
        </div>
      )}
      <div className="pt-1">{children}</div>
    </div>
  );
}

function FlowChevron() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

/* ===== End diagram tab =================================================== */

function ToggleSwitch({
  view,
  onChange,
}: {
  view: "current" | "future";
  onChange: (v: "current" | "future") => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-card/60 p-0.5">
      <ToggleOption active={view === "current"} onClick={() => onChange("current")}>
        Current
      </ToggleOption>
      <ToggleOption active={view === "future"} onClick={() => onChange("future")}>
        How good looks like
      </ToggleOption>
    </div>
  );
}

function ToggleOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition " +
        (active
          ? "bg-accent text-ink"
          : "text-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

function CrossCuttingBand({ layerNum }: { layerNum: string }) {
  const layer = LAYERS.find((l) => l.num === layerNum);
  if (!layer) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-line bg-card/30 px-4 py-3"
      style={{ boxShadow: `inset 0 3px 0 0 ${layer.hex}` }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: layer.hex }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Cross-cutting · applies to every stage
          </div>
          <div className="text-sm font-semibold text-fg">{layer.title}</div>
        </div>
        <div className="hidden text-[11px] text-muted sm:block sm:max-w-md sm:text-right">
          {layer.summary}
        </div>
      </div>
    </div>
  );
}

function TransformStageCard({
  stage,
  index,
}: {
  stage: TransformStage;
  index: number;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card/40">
      <header className="flex items-center gap-2 px-4 pb-2 pt-4">
        <span
          className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold"
          style={{ background: "rgb(var(--line) / 0.5)", color: "rgb(var(--fg))" }}
        >
          {index + 1}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">Today</span>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-fg">
            {stage.currentName}
          </h3>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
            Today
          </div>
        </div>
        <p className="text-xs leading-snug text-muted">{stage.currentSummary}</p>
      </div>
    </article>
  );
}

/* ===== Shared bits ====================================================== */

function LayerCard({ layer }: { layer: Layer }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-line bg-card/40"
      style={{ boxShadow: `inset 3px 0 0 0 ${layer.hex}` }}
    >
      <header className="flex flex-wrap items-start gap-4 px-5 pt-4">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold"
          style={{ background: `${layer.hex}1a`, color: layer.hex }}
        >
          {layer.num}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: layer.hex }}
          >
            Layer {layer.num}
          </div>
          <h2 className="text-[16px] font-semibold leading-tight text-fg">
            {layer.title}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-muted">{layer.summary}</p>
        </div>
        {layer.centerpiece && (
          <div className="shrink-0 text-right">
            <div
              className="whitespace-nowrap text-[11px] font-bold tracking-wide"
              style={{ color: layer.hex }}
            >
              {layer.centerpiece.label}
            </div>
            {layer.centerpiece.sublabel && (
              <div className="whitespace-nowrap text-[10px] text-muted">
                {layer.centerpiece.sublabel}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Stages */}
      <div className="px-5 pb-4 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {layer.stages.map((s) => (
            <span
              key={s}
              className="whitespace-nowrap rounded-full border border-line bg-bg/60 px-2.5 py-0.5 text-[11px] text-fg"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Extras */}
        {layer.extras?.map((ex) => (
          <div key={ex.label} className="mt-3 border-t border-line/40 pt-3">
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
              {ex.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ex.items.map((it) => (
                <span
                  key={it}
                  className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    background: `${layer.hex}10`,
                    color: layer.hex,
                    border: `1px solid ${layer.hex}28`,
                  }}
                >
                  {it}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition " +
        (active
          ? "border-accent text-fg"
          : "border-transparent text-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.2em] text-muted">{children}</div>
  );
}

function Divider() {
  return <div className="my-2 border-t border-line/50" />;
}

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
