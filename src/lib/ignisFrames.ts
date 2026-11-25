/**
 * The Ignis architecture (Phase 2 · 3 · Architecture). Six product frames, each
 * adding one layer to the graph, and one continuous track that runs beside all
 * of them: platform & infrastructure.
 *
 * The names are shared by the diagram, by the task plan in step 4 (which groups
 * its tasks by the same layers) and by the operating model in step 5. Client-safe.
 */

export type IgnisFrame = {
  name: string;
  /** Frames that add to the one before show as "+ name" on the frame picker. */
  plus?: boolean;
  title: string;
  /** The kind of task this frame unlocks. */
  unlock: string;
};

/** The product-development frames, in order. */
export const IGNIS_FRAMES: IgnisFrame[] = [
  {
    name: "Ticket → MR",
    title: "Ticket → merge request",
    unlock: "Simple UI tasks — not business logic",
  },
  {
    name: "Ideas from product memory",
    plus: true,
    title: "Ideas from product memory",
    unlock: "PM gets ideas from a self-updating system (learns from shipped tickets)",
  },
  {
    name: "Proof it worked",
    plus: true,
    title: "Proof it worked: A/B tests, usage & store reviews",
    unlock: "Higher confidence via measurable impact (A/B tests, KPIs, store ratings & reviews)",
  },
  {
    name: "Risk-tiered review",
    plus: true,
    title: "Risk-tiered review (risk checked in planning → PM or R&D merges)",
    unlock: "Small, low-risk tasks ship quicker (PM can merge)",
  },
  {
    name: "Non-code work (3rd-party)",
    plus: true,
    title: "Non-code work via 3rd-party services (UGC → Release)",
    unlock: "3rd-party agents like UGC agent (provided by outside company)",
  },
  {
    name: "Cross-functional planning",
    plus: true,
    title: "Cross-functional planning: Design, Analytics & Marketing skills + gates",
    unlock: "More complex features requiring Design, Marketing & Analytics",
  },
];

export type PlatformItem = {
  name: string;
  /** What kind of work it is. */
  tag: string;
  text: string;
};

/** The continuous track: built once at the platform layer, inherited by every product. */
export const IGNIS_PLATFORM: { name: string; unlock: string; intro: string; items: PlatformItem[] } = {
  name: "Platform & infrastructure",
  unlock: "Runs beside all six frames: compounds complexity, velocity, guardrails & compliance",
  intro:
    "Continuously improved in parallel throughout building Ignis — built once at the platform layer and inherited by every product.",
  items: [
    {
      name: "Continuous Eval",
      tag: "Quality & benchmarks",
      text: "Continuously measure merge pass rates, verification health, shadow-run quality, and post-release outcomes so prompt and model changes ship on evidence.",
    },
    {
      name: "Guardrail enforcement",
      tag: "Safety & release gates",
      text: "Enforce mandatory product, architectural, security, and isolation guardrails automatically in verification and before every single release.",
    },
    {
      name: "Code-writing learning loop",
      tag: "Continuous learning",
      text: "Feed MR review change requests, engineer edits, and product comments back into coding prompts and conventions so code quality compounds over time.",
    },
    {
      name: "Dynamic agent skills",
      tag: "Agent runtime",
      text: "Add, version, and swap specialized skills per agent during development without rewriting the core Windmill pipeline.",
    },
    {
      name: "On-demand agent runtime",
      tag: "Self-serve · Product brain",
      text: "Spin up custom or ad-hoc agents (audits, anomaly triage, release notes, research) with out-of-the-box execution and plug-and-play access to <product>-ignis-context.",
    },
    {
      name: "Alternative coding harnesses",
      tag: "Execution engines",
      text: "Evaluate and benchmark runners such as GitLab Actions and OpenCode alongside Newton to optimize speed, cost, and pass rate per task type.",
    },
    {
      name: "Industry regulation adoption",
      tag: "Compliance & governance",
      text: "Adopt evolving privacy, explicit user consent, minor protection, app-store rules, and legal standards once at the platform level and apply them across all products.",
    },
  ],
};

/** The words the diagram uses, spelled out. */
export const IGNIS_TERMS: { term: string; means: string }[] = [
  { term: "Windmill", means: "workflow runtime" },
  { term: "Newton", means: "coding agent" },
  { term: "SW1–SW6", means: "pipeline stages" },
  { term: "MR", means: "merge request" },
  { term: "Philippe", means: "product usage analytics (DAU & macro metrics)" },
  { term: "UGC", means: "user-generated content" },
];

/**
 * The layers of the plan, as steps 4 and 5 count them: the six frames (1–6), then
 * the continuous platform track (7). Stored estimates point at these numbers, so
 * the order never changes.
 */
export const IGNIS_LAYERS: { name: string; unlock: string }[] = [
  ...IGNIS_FRAMES,
  { name: IGNIS_PLATFORM.name, unlock: IGNIS_PLATFORM.unlock },
];
