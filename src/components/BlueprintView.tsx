"use client";

import Link from "next/link";
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
  newName: string;
  newSublabel: string;
  newLayerNums: string[]; // Layers from LAYERS that compose the new stage
  operatingLayerNum?: string; // Layer rendered as a "how this stage operates" badge
  isLearningLoop?: boolean; // Special case for growth → learning loop
};

const TRANSFORM_STAGES: TransformStage[] = [
  {
    key: "research",
    currentName: "Research & Planning",
    currentSummary:
      "Manual market research and roadmap planning, mostly periodic, scattered across spreadsheets and docs.",
    newName: "B2C Insights Engine",
    newSublabel: "Layer 1 + Layer 2, combined",
    newLayerNums: ["1", "2"],
  },
  {
    key: "development",
    currentName: "Development",
    currentSummary:
      "Sprint-based delivery. Specs become tickets become code, reviewed in cycles.",
    newName: "AI-Native Build",
    newSublabel: "Layer 3 + Layer 5, operating in Layer 4 mode",
    newLayerNums: ["3", "5"],
    operatingLayerNum: "4",
  },
  {
    key: "gtm",
    currentName: "Go to Market",
    currentSummary:
      "Launch campaigns, channel setup and messaging owned per team, one launch at a time.",
    newName: "Agent-Driven GTM",
    newSublabel: "Layer 6",
    newLayerNums: ["6"],
  },
  {
    key: "growth",
    currentName: "Growth",
    currentSummary:
      "Per-feature growth experiments and reporting, learnings live in the team that ran them.",
    newName: "Continuous Learning Loop",
    newSublabel: "Organizational memory & learning loop",
    newLayerNums: [],
    isLearningLoop: true,
  },
];

const CROSS_LAYER_NUMS = ["7", "8"];

/* -------------------------------------------------------------------------- */

export default function BlueprintView() {
  const [tab, setTab] = useState<"layers" | "transform">("layers");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Hero */}
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
          Target state
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          How good looks like
        </h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          The AI-native product organization.
        </p>
        <div className="mt-4 rounded-2xl border border-line bg-card/60 px-4 py-3 text-sm text-fg">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
            End-to-end flow
          </span>
          <div className="mt-1 font-medium">{FLOW_TAGLINE}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-line bg-card/60 p-1">
        <TabButton active={tab === "layers"} onClick={() => setTab("layers")}>
          Layers
        </TabButton>
        <TabButton active={tab === "transform"} onClick={() => setTab("transform")}>
          Transformation structure
        </TabButton>
      </div>

      {tab === "layers" && <LayersTab />}
      {tab === "transform" && <TransformTab />}

      {/* Footer CTA */}
      <section className="mb-4 mt-10 rounded-2xl border border-accent/40 bg-accent/10 p-5">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-accent">
          Use this in the workshop
        </div>
        <h3 className="mb-1 text-lg font-semibold text-fg">
          Map today against this target. Decide where the gaps are.
        </h3>
        <p className="text-sm text-muted">
          For every layer, ask: which parts already exist? Which are missing? Capture the
          gaps on the relevant stage in the{" "}
          <Link href="/main" className="text-accent hover:underline">
            main process
          </Link>{" "}
          or your{" "}
          <Link href="/overview" className="text-accent hover:underline">
            department workflow
          </Link>{" "}
          under "What's missing", then prioritize them on the{" "}
          <Link href="/backlog" className="text-accent hover:underline">
            backlog with Smart Sort
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

/* ===== Tab 1: Layers (the original content) ============================== */

function LayersTab() {
  return (
    <>
      {/* Transition principles strip */}
      <section className="mb-8">
        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted">
          Seven shifts behind the model
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TRANSITIONS.map((t, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-line bg-card/60 px-3 py-2.5"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                {i + 1}
              </span>
              <span className="text-xs leading-snug text-fg">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 8 numbered layers */}
      <section className="mb-10 space-y-4">
        {LAYERS.map((layer) => (
          <LayerCard key={layer.num} layer={layer} />
        ))}
      </section>

      {/* Organizational memory & learning loop */}
      <section className="mb-2 rounded-2xl border border-line bg-card/60 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold"
            style={{ background: `${LEARNING_LOOP_HEX}22`, color: LEARNING_LOOP_HEX }}
          >
            ∞
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
              Foundation layer
            </div>
            <h2 className="text-lg font-semibold text-fg">
              Organizational memory & learning loop
            </h2>
          </div>
        </div>
        <p className="mb-4 text-sm text-muted">
          Every launch teaches the next plan. Every failure informs the next bet. Captured
          centrally so the company compounds learning instead of repeating it.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LEARNING_LOOP_ITEMS.map((item) => (
            <span
              key={item}
              className="whitespace-nowrap rounded-full border border-line bg-bg px-2.5 py-1 text-[11px] text-fg"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

/* ===== Tab 2: Transformation structure ================================== */

function TransformTab() {
  const [view, setView] = useState<"current" | "future">("current");

  return (
    <section className="space-y-6">
      {/* Intro + toggle */}
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-line bg-card/60 p-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
            B2C work-progress, side by side
          </div>
          <h2 className="mt-1 text-xl font-semibold text-fg">
            How the work progresses, today vs. how good looks like
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Toggle to swap each stage of the current main B2C workflow with the
            corresponding part of the target model. Layers 7 and 8 sit across all stages,
            not inside any single one.
          </p>
        </div>
        <ToggleSwitch view={view} onChange={setView} />
      </div>

      {/* Cross-cutting band — top: Layer 7 */}
      <CrossCuttingBand layerNum="7" active={view === "future"} />

      {/* 4-stage flow */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {TRANSFORM_STAGES.map((s, idx) => (
          <TransformStageCard key={s.key} stage={s} view={view} index={idx} />
        ))}
      </div>

      {/* Cross-cutting band — bottom: Layer 8 */}
      <CrossCuttingBand layerNum="8" active={view === "future"} />

      {/* Legend / explanation strip */}
      {view === "future" && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm text-fg">
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            How to read this
          </div>
          <ul className="ml-5 list-disc space-y-1 text-muted">
            <li>
              Each stage box shows the layers from the blueprint that replace today's
              stage of the same shape in the flow.
            </li>
            <li>
              <span className="text-fg">Development</span> shows two component layers (3 +
              5) plus a badge for Layer 4 — that's not a component, it's the operating
              model the whole stage runs on.
            </li>
            <li>
              <span className="text-fg">Layer 7 (Ops, Risk &amp; Governance)</span> and{" "}
              <span className="text-fg">Layer 8 (Financial Performance)</span> are
              cross-cutting — they apply to every stage, so they're drawn as bands above
              and below the flow.
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}

function ToggleSwitch({
  view,
  onChange,
}: {
  view: "current" | "future";
  onChange: (v: "current" | "future") => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-bg p-1">
      <button
        type="button"
        onClick={() => onChange("current")}
        className={
          "rounded-full px-3 py-1.5 text-xs font-medium transition " +
          (view === "current"
            ? "bg-fg text-bg"
            : "text-muted hover:text-fg")
        }
      >
        Current
      </button>
      <button
        type="button"
        onClick={() => onChange("future")}
        className={
          "rounded-full px-3 py-1.5 text-xs font-medium transition " +
          (view === "future"
            ? "bg-accent text-ink"
            : "text-muted hover:text-fg")
        }
      >
        How good looks like
      </button>
    </div>
  );
}

function CrossCuttingBand({ layerNum, active }: { layerNum: string; active: boolean }) {
  const layer = LAYERS.find((l) => l.num === layerNum);
  if (!layer) return null;

  return (
    <div
      className="rounded-2xl border px-5 py-3 transition"
      style={{
        borderColor: active ? `${layer.hex}55` : "rgb(var(--line))",
        background: active ? `${layer.hex}10` : "transparent",
        opacity: active ? 1 : 0.4,
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
          style={{
            background: active ? `${layer.hex}22` : "rgb(var(--line) / 0.4)",
            color: active ? layer.hex : "rgb(var(--muted))",
          }}
        >
          {layer.num}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: active ? layer.hex : undefined }}
          >
            Cross-cutting layer — applies to every stage
          </div>
          <div className="text-sm font-semibold text-fg">{layer.title}</div>
        </div>
        <div className="text-[11px] text-muted">
          {active ? layer.summary : "Not present today"}
        </div>
      </div>
    </div>
  );
}

function TransformStageCard({
  stage,
  view,
  index,
}: {
  stage: TransformStage;
  view: "current" | "future";
  index: number;
}) {
  const isFuture = view === "future";
  const layerObjs = stage.newLayerNums
    .map((n) => LAYERS.find((l) => l.num === n))
    .filter((l): l is Layer => Boolean(l));
  const operatingLayer = stage.operatingLayerNum
    ? LAYERS.find((l) => l.num === stage.operatingLayerNum)
    : null;
  const primaryHex = isFuture && layerObjs[0] ? layerObjs[0].hex : "rgb(var(--line))";

  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border transition"
      style={{
        borderColor: isFuture ? `${primaryHex}55` : "rgb(var(--line))",
        background: isFuture ? `${primaryHex}08` : "rgb(var(--card) / 0.6)",
      }}
    >
      {/* Step number + flow arrow on the side */}
      <div className="flex items-center gap-2 border-b border-line/60 px-4 py-2.5">
        <span
          className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold"
          style={{
            background: isFuture
              ? `${primaryHex}22`
              : "rgb(var(--line) / 0.5)",
            color: isFuture ? primaryHex : "rgb(var(--fg))",
          }}
        >
          {index + 1}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
          {isFuture ? "Future stage" : "Current stage"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        {/* Heading */}
        <div>
          {isFuture && (
            <div className="text-[10px] text-muted line-through">
              {stage.currentName}
            </div>
          )}
          <h3 className="text-base font-semibold text-fg">
            {isFuture ? stage.newName : stage.currentName}
          </h3>
          <div
            className="mt-1 text-[11px] uppercase tracking-wider"
            style={{ color: isFuture ? primaryHex : "rgb(var(--muted))" }}
          >
            {isFuture ? stage.newSublabel : "Today"}
          </div>
        </div>

        {/* Body */}
        {!isFuture && (
          <p className="text-xs leading-snug text-muted">{stage.currentSummary}</p>
        )}

        {isFuture && stage.isLearningLoop && (
          <>
            <p className="text-xs leading-snug text-muted">
              Every launch teaches the next plan. Captured centrally so the company
              compounds learning instead of repeating it.
            </p>
            <div className="flex flex-wrap gap-1">
              {LEARNING_LOOP_ITEMS.slice(0, 6).map((it) => (
                <span
                  key={it}
                  className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    background: `${LEARNING_LOOP_HEX}14`,
                    color: LEARNING_LOOP_HEX,
                    border: `1px solid ${LEARNING_LOOP_HEX}33`,
                  }}
                >
                  {it}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-muted">+ {LEARNING_LOOP_ITEMS.length - 6} more</div>
          </>
        )}

        {isFuture && !stage.isLearningLoop && layerObjs.length > 0 && (
          <div className="space-y-2">
            {layerObjs.map((layer) => (
              <div
                key={layer.num}
                className="rounded-xl border bg-bg/60 px-3 py-2"
                style={{ borderColor: `${layer.hex}33` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
                    style={{
                      background: `${layer.hex}22`,
                      color: layer.hex,
                    }}
                  >
                    {layer.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-fg">
                      {layer.title}
                    </div>
                  </div>
                </div>
                {layer.centerpiece && (
                  <div
                    className="mt-1.5 inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: `${layer.hex}18`,
                      color: layer.hex,
                      border: `1px solid ${layer.hex}44`,
                    }}
                  >
                    {layer.centerpiece.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Operating-model badge for Development → Layer 4 */}
        {isFuture && operatingLayer && (
          <div
            className="rounded-xl border-2 border-dashed px-3 py-2"
            style={{
              borderColor: `${operatingLayer.hex}55`,
              background: `${operatingLayer.hex}10`,
            }}
          >
            <div
              className="mb-0.5 text-[9px] uppercase tracking-[0.18em]"
              style={{ color: operatingLayer.hex }}
            >
              Operating model
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold"
                style={{
                  background: `${operatingLayer.hex}22`,
                  color: operatingLayer.hex,
                }}
              >
                {operatingLayer.num}
              </span>
              <span className="text-[11px] font-semibold text-fg">
                {operatingLayer.title}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ===== Shared: LayerCard ================================================= */

function LayerCard({ layer }: { layer: Layer }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border bg-card/60"
      style={{ borderColor: `${layer.hex}55` }}
    >
      {/* Header strip */}
      <header
        className="flex flex-wrap items-start gap-4 border-b px-5 py-4"
        style={{ borderColor: `${layer.hex}33`, background: `${layer.hex}10` }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base font-bold"
          style={{ background: `${layer.hex}22`, color: layer.hex }}
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
          <h2 className="text-lg font-semibold text-fg">{layer.title}</h2>
          <p className="mt-1 text-sm text-muted">{layer.summary}</p>
        </div>
        {layer.centerpiece && (
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-xl border px-4 py-3 text-center"
            style={{
              borderColor: `${layer.hex}66`,
              background: `${layer.hex}18`,
              color: layer.hex,
            }}
          >
            <div className="whitespace-nowrap text-sm font-bold tracking-wide">
              {layer.centerpiece.label}
            </div>
            {layer.centerpiece.sublabel && (
              <div className="mt-0.5 whitespace-nowrap text-[10px] uppercase tracking-wider opacity-80">
                {layer.centerpiece.sublabel}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Stages grid */}
      <div className="px-5 py-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">
          Stages
        </div>
        <div className="flex flex-wrap gap-1.5">
          {layer.stages.map((s) => (
            <span
              key={s}
              className="whitespace-nowrap rounded-full border bg-bg px-3 py-1 text-xs text-fg"
              style={{ borderColor: `${layer.hex}55` }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Extras */}
        {layer.extras?.map((ex) => (
          <div key={ex.label} className="mt-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">
              {ex.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ex.items.map((it) => (
                <span
                  key={it}
                  className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px]"
                  style={{
                    background: `${layer.hex}14`,
                    color: layer.hex,
                    border: `1px solid ${layer.hex}33`,
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

/* ===== Shared: TabButton ================================================= */

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
        "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition " +
        (active
          ? "bg-accent text-ink shadow-card"
          : "text-muted hover:bg-line/30 hover:text-fg")
      }
    >
      {children}
    </button>
  );
}
