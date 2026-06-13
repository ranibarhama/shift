import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/session";

export const metadata = {
  title: "How good looks like · Shift",
};

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

const LAYERS: Layer[] = [
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

const LEARNING_LOOP = [
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

/* -------------------------------------------------------------------------- */

export default async function HowGoodLooksLikePage() {
  const role = await getCurrentRole();
  if (role !== "product") redirect("/");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Hero */}
      <div className="mb-8">
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
      <section className="mb-10 rounded-2xl border border-line bg-card/60 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold"
            style={{ background: "#a855f722", color: "#a855f7" }}
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
          {LEARNING_LOOP.map((item) => (
            <span
              key={item}
              className="whitespace-nowrap rounded-full border border-line bg-bg px-2.5 py-1 text-[11px] text-fg"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
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

/* ---------- Components ---------- */

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

        {/* Extras (signal tags / outputs / channels / etc.) */}
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
