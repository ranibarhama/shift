/**
 * "How good looks like" content — shared by the Blueprint tabs and the
 * Stage 2 · Session 1 presentation. Client-safe plain data (no DB imports).
 */


export type Layer = {
  num: string;
  title: string;
  summary: string;
  hex: string;
  centerpiece?: { label: string; sublabel?: string };
  stages: string[];
  extras?: { label: string; items: string[] }[];
};

export const TRANSITIONS: string[] = [
  "AI expands capacity; humans own judgment",
  "From project management to decision management",
  "From roadmap theatre to live portfolio control",
  "From sprint rituals to adaptive execution",
  "From static reports to live operating intelligence",
  "From isolated functions to outcome-owned mini-pods",
  "From one-time launches to continuous learning loops",
];

export const FLOW_TAGLINE =
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
];

export const LEARNING_LOOP_HEX = "#a855f7";
export const LEARNING_LOOP_ITEMS = [
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

export type TransformStage = {
  key: string;
  currentName: string;
  currentSummary: string;
};

export const TRANSFORM_STAGES: TransformStage[] = [
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

/* ----- Target state ("How good looks like") ----- */

export type FutureStage = {
  key: string;
  num: number;
  title: string;
  hex: string;
  /** One-line essence, for compact diagrams. */
  essence: string;
  description: string;
  /** Today's stages (TRANSFORM_STAGES keys) this stage takes over. */
  from: string[];
};

export const FUTURE_STAGES: FutureStage[] = [
  {
    key: "insights",
    num: 1,
    title: "B2C Insights Engine",
    hex: "#14b8a6",
    essence: "Single source of signal · always on",
    description:
      "Always-on agents listening to the market, users, support, social and competitors — feeding a single Insight Engine.",
    from: ["research"],
  },
  {
    key: "build",
    num: 2,
    title: "AI Build / MVP & Legacy",
    hex: "#8b5cf6",
    essence: "MVP in days · legacy + new-feature streams",
    description:
      "From idea to testable MVP in days, not quarters. AI generates code, UX, copy and instrumentation against a shared design system.",
    from: ["development"],
  },
  {
    key: "gtm",
    num: 3,
    title: "GTM & Growth",
    hex: "#ef4444",
    essence: "Agent-driven GTM · live KPI monitors",
    description:
      "Launch and growth handled by an agent crew across every channel, watched by live KPI monitors that feed product back.",
    from: ["gtm", "growth"],
  },
];

export const INSIGHTS_REPLACES = ["Market & User Intelligence", "Planning & Prioritization"];

export const BUILD_STREAMS: {
  label: string;
  sublabel: string;
  hex: string;
  badge?: string;
  items: string[];
}[] = [
  {
    label: "Legacy",
    sublabel: "existing product",
    hex: "#64748b",
    items: [
      "AI maintenance & refactor agents",
      "Regression test guardrails",
      "Backwards-compat checks",
    ],
  },
  {
    label: "New features",
    sublabel: "greenfield bets",
    hex: "#8b5cf6",
    badge: "Mini Pods Structure",
    items: [
      "MVP Mode from a Planthon brief",
      "Experiment-first delivery",
      "Fast rollback if it tanks",
    ],
  },
];

export const BUILD_OPERATING_MODEL = "No-Sprints Execution";

export const GTM_ITEMS = [
  "Agent-driven GTM",
  "Live KPI monitors",
  "Real-time alerting & reporting",
];

export const ORG_BRAIN = {
  title: "B2C Organization Brain",
  // Same color as the "Organization brain" building block — one entity, one color.
  hex: "#e34948",
  description:
    "A living knowledge layer that captures, updates and serves everything the organization knows. It sits above today's tools, turning scattered work output into a connected knowledge graph that humans and AI agents can both query.",
  benefits: [
    "Answers you can actually trust",
    "Maintain a real source of truth",
    "Build reliable context for agents",
  ],
};

export const LEARNING_LOOP_SUMMARY =
  "Every launch teaches the next plan. Every failure informs the next bet. Captured centrally so the company compounds learning instead of repeating it.";
