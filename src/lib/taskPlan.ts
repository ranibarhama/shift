/**
 * Phase 2 · 4 · Updated Backlog Tasks & Resources — the task plan: everything it
 * takes to build the architecture from step 3. Two sources, grouped by the
 * architecture's layers (the Ignis frames):
 *   - tasks that come out of the architecture itself (ARCH_TASKS, below);
 *   - items from the step 2 backlog that a layer answers (BACKLOG_LAYER).
 * Each task can carry an estimate: person-days per role, what it needs, notes.
 * Client-safe (plain data + pure helpers).
 */

import { BUILDING_BLOCKS, type BlockInput } from "./buildingBlocks";
import { IGNIS_FRAMES } from "./ignisFrames";

/** Who the work lands on. Effort is estimated in person-days per role. */
export const ROLES = [
  { key: "rnd", label: "R&D" },
  { key: "product", label: "Product" },
  { key: "design", label: "Design" },
  { key: "data", label: "Data & Analytics" },
  { key: "marketing", label: "Marketing" },
  { key: "ops", label: "Ops" },
] as const;

export type RoleKey = (typeof ROLES)[number]["key"];

export const MAX_DAYS = 999;
export const MAX_NEEDS = 400;
export const MAX_NOTES = 600;

/** A layer of the architecture, 1–7 (the Ignis frame numbers). 0 = not tied to a layer. */
export const LAYER_COUNT = IGNIS_FRAMES.length;

export function isLayer(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= LAYER_COUNT;
}

export type ArchTask = {
  /** Stored with the estimate — reword `title` / `detail` freely, never the id. */
  id: string;
  layer: number;
  title: string;
  detail: string;
};

/** What each layer of the architecture needs built — one task per box or path on the diagram. */
export const ARCH_TASKS: ArchTask[] = [
  // 1 · Implement ticket
  {
    id: "a1-trigger",
    layer: 1,
    title: "Jira trigger",
    detail: "A ticket assigned to Ignis and moved to In Progress starts the run.",
  },
  {
    id: "a1-runtime",
    layer: 1,
    title: "Ignis runtime on Windmill",
    detail: "Ingress routing and the SW1–SW6 pipeline.",
  },
  {
    id: "a1-newton",
    layer: 1,
    title: "Newton coding session",
    detail: "Launched by the pipeline; opens a merge request.",
  },
  {
    id: "a1-verify",
    layer: 1,
    title: "Verification on every merge request",
    detail: "CI, contract checks and staging.",
  },
  {
    id: "a1-release",
    layer: 1,
    title: "Human review, merge and release",
    detail: "The merge request is reviewed, merged and shipped.",
  },
  {
    id: "a1-status",
    layer: 1,
    title: "Status back to Jira",
    detail: "Status and outcome are written back to the ticket.",
  },

  // 2 · Self-updating product brain
  {
    id: "a2-context",
    layer: 2,
    title: "<product>-ignis-context repo for each product",
    detail: "The product brain: README, changelogs and feedback.",
  },
  {
    id: "a2-agent",
    layer: 2,
    title: "Backlog agent on Windmill",
    detail: "Reads the brain daily or on demand and proposes up to 5 ideas.",
  },
  {
    id: "a2-controller",
    layer: 2,
    title: "Ignis Controller backlog snapshot",
    detail: "Title, rationale and copy for the PM to review and take to Jira — no auto-create.",
  },
  {
    id: "a2-feedback",
    layer: 2,
    title: "PM like / dislike feedback",
    detail: "The PM's votes on ideas are saved back into the product brain.",
  },
  {
    id: "a2-docs",
    layer: 2,
    title: "Docs automation",
    detail: "CI in the context repo diffs shipped code and updates product docs and CHANGELOGs after each release.",
  },

  // 3 · Live data sources
  {
    id: "a3-philippe",
    layer: 3,
    title: "Philippe feed into the product brain",
    detail: "DAU and product usage metrics.",
  },
  {
    id: "a3-stores",
    layer: 3,
    title: "Store feed into the product brain",
    detail: "Ratings, reviews and user comments.",
  },

  // 4 · R&D fast track
  {
    id: "a4-risk",
    layer: 4,
    title: "Risk check in feature planning",
    detail: "Define low vs high risk, and classify every feature before a PR exists.",
  },
  {
    id: "a4-tag",
    layer: 4,
    title: "Risk tag on the Jira ticket",
    detail: "The result of the risk check travels with the ticket.",
  },
  {
    id: "a4-low",
    layer: 4,
    title: "Low-risk path: PM merges",
    detail: "After verification the change goes straight to Release.",
  },
  {
    id: "a4-high",
    layer: 4,
    title: "High-risk path: R&D review",
    detail: "An engineer reviews and merges before Release.",
  },

  // 5 · 3rd-party agents (UGC)
  {
    id: "a5-dispatch",
    layer: 5,
    title: "Dispatch to 3rd-party services",
    detail: "The Ignis runtime hands non-code work to an outside service.",
  },
  {
    id: "a5-ugc",
    layer: 5,
    title: "UGC agent from an outside company",
    detail: "Onboard the provider and connect its agent.",
  },
  {
    id: "a5-release",
    layer: 5,
    title: "UGC straight to Release",
    detail: "Created assets go to Release, outside the coding loop.",
  },

  // 6 · Planning skills & gates
  {
    id: "a6-design",
    layer: 6,
    title: "Design skill and Designer gate",
    detail: "Validates UX & UI in planning; a designer reviews when needed.",
  },
  {
    id: "a6-analytics",
    layer: 6,
    title: "Analytics skill and Analyst gate",
    detail: "Validates events & KPIs in planning; an analyst reviews when needed.",
  },
  {
    id: "a6-marketing",
    layer: 6,
    title: "Marketing skill and Marketer gate",
    detail: "Validates messaging in planning; a marketer reviews when needed.",
  },
  {
    id: "a6-aligned",
    layer: 6,
    title: "Validated plan into the Jira ticket",
    detail: "The three gates join, and the aligned plan reaches the ticket before implementation starts.",
  },

  // 7 · Parallel in Ignis
  {
    id: "a7-skills",
    layer: 7,
    title: "Dynamic agent skills",
    detail: "Add or change skills per agent, configurable during development.",
  },
  {
    id: "a7-eval",
    layer: 7,
    title: "Continuous Eval",
    detail: "Ongoing measurement of Ignis results: quality and pass rates.",
  },
  {
    id: "a7-learning",
    layer: 7,
    title: "Code-writing learning",
    detail: "MR change requests and product comments are fed back into the coding loop.",
  },
  {
    id: "a7-harness",
    layer: 7,
    title: "Alternative coding harnesses",
    detail: "Evaluate GitLab Actions and OpenCode alongside Newton.",
  },
];

const ARCH_IDS = new Set(ARCH_TASKS.map((t) => t.id));

export function isArchTaskId(id: string): boolean {
  return ARCH_IDS.has(id);
}

/**
 * Step 2 backlog items (by entry id) → the layer that answers them. An item that
 * isn't listed — one this architecture doesn't answer, or one added after this was
 * written — starts as "not tied to a layer". Anyone can move an item on the page;
 * that choice is saved with its estimate and wins over this default.
 */
export const BACKLOG_LAYER: Record<string, number> = {
  // 2 · Self-updating product brain
  blk_nxyptahklnhj: 2, // Product brain — full scope based on Ignis' current product brain
  blk_kf6du2ugvy08: 2, // Product Brain which will know what we built, what to build next and why
  blk_dv9tuoexj9zc: 2, // Podpilot — where the PM reviews ideas and plans
  // 3 · Live data sources
  blk_x0ncjuvakwmp: 3, // Philippe — Analytics Platform + Slack Agent
  blk_29lbcfpc8l53: 3, // Expanding Philippe brain to new topics
  blk_jmktbcrhcypb: 3, // Adding Mixpanel into Philippe
  blk_dv0rj5zlsz0m: 3, // Full funnel data visibility for all products
  blk_dic3gqm73ddu: 3, // All data we need to prioritise our backlog and support our RICE
  blk_di54tbkwfiic: 3, // Insights on demand
  blk_yqf1javp7hq5: 3, // Feedback loop from support
  // 5 · 3rd-party agents (UGC)
  blk_3sx3960e0zvi: 5, // Creatives generator tool (from banner to UGC & video)
  // 6 · Planning skills & gates
  blk_ohkry4u4q0s6: 6, // Design skills as part of Ignis
  blk_81wlqy4e1ruu: 6, // Skill shared library for marketing and product
  blk_h8aqn59z4401: 6, // Agentic Event Tracking Plan
  blk_2aqu5s75mdod: 6, // Self events implementation tool
  blk_xllpn912r2yl: 6, // Initial infra for marketing brain
  blk_0feo4xzf5rx4: 6, // Email design skill
  // 7 · Parallel in Ignis
  blk_q3km3vtl1jte: 7, // AI first development KPIs dashboard
};

/** A task's estimate — the costing template. */
export type Estimate = {
  /** Person-days per role. A role with no work on the task is left out. */
  days: Partial<Record<RoleKey, number>>;
  /** What the task needs besides people: tools, licences, access, vendors, budget. */
  needs: string;
  notes: string;
  /** Already in place — kept on the list, left out of the effort still to spend. */
  done: boolean;
  /** Backlog items only: the layer it was moved to (0 = not tied). null = the default. */
  layer: number | null;
  updatedBy: string;
  updatedAt: number;
};

export type Estimates = Record<string, Estimate>;

/** What the page sends when saving an estimate. */
export type EstimateInput = Pick<Estimate, "days" | "needs" | "notes" | "done" | "layer">;

export function totalDays(e: Pick<Estimate, "days"> | undefined): number {
  if (!e) return 0;
  return ROLES.reduce((n, r) => n + (e.days[r.key] ?? 0), 0);
}

/** "3", "2.5" — person-days without trailing zeros. */
export function fmtDays(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export type PlanTask = {
  id: string;
  /** "2.3" — layer, then position in it. Empty for items not tied to a layer. */
  num: string;
  layer: number;
  title: string;
  detail: string;
  source: "architecture" | "backlog";
  /** The step 2 entry behind a backlog task. */
  input?: BlockInput;
};

export type Plan = {
  /** Tasks per layer, in frame order (index 0 = layer 1). */
  layers: PlanTask[][];
  /** Step 2 backlog items not tied to a layer. */
  loose: PlanTask[];
};

const BLOCK_ORDER = new Map<string, number>(BUILDING_BLOCKS.map((b, i) => [b.key, i]));

/** The whole plan: each layer's architecture tasks, then the backlog items it answers. */
export function buildPlan(inputs: BlockInput[], estimates: Estimates): Plan {
  const backlog = inputs
    .filter((e) => e.kind === "missing" || e.kind === "connect")
    .sort(
      (a, b) =>
        (BLOCK_ORDER.get(a.block) ?? 0) - (BLOCK_ORDER.get(b.block) ?? 0) || a.createdAt - b.createdAt
    )
    .map((e) => {
      const moved = estimates[e.id]?.layer;
      return {
        id: e.id,
        num: "",
        layer: isLayer(moved) ? moved : (BACKLOG_LAYER[e.id] ?? 0),
        title: e.text,
        detail: "",
        source: "backlog" as const,
        input: e,
      };
    });

  const layers = IGNIS_FRAMES.map((_, i) => {
    const n = i + 1;
    const tasks: PlanTask[] = [
      ...ARCH_TASKS.filter((t) => t.layer === n).map((t) => ({ ...t, num: "", source: "architecture" as const })),
      ...backlog.filter((t) => t.layer === n),
    ];
    return tasks.map((t, j) => ({ ...t, num: `${n}.${j + 1}` }));
  });

  return { layers, loose: backlog.filter((t) => t.layer === 0) };
}

/** Cleans what the page sent. Returns an error message when something is off. */
export function parseEstimateInput(
  raw: Record<string, unknown>,
  isBacklogItem: boolean
): { ok: true; value: EstimateInput } | { ok: false; error: string } {
  const days: Partial<Record<RoleKey, number>> = {};
  const rawDays = (raw.days && typeof raw.days === "object" ? raw.days : {}) as Record<string, unknown>;
  for (const r of ROLES) {
    const v = rawDays[r.key];
    if (v === undefined || v === null || v === "") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > MAX_DAYS) {
      return { ok: false, error: `${r.label}: enter 0–${MAX_DAYS} person-days` };
    }
    if (n > 0) days[r.key] = Math.round(n * 100) / 100;
  }
  const needs = typeof raw.needs === "string" ? raw.needs.trim() : "";
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";
  if (needs.length > MAX_NEEDS) return { ok: false, error: `keep "what it needs" under ${MAX_NEEDS} characters` };
  if (notes.length > MAX_NOTES) return { ok: false, error: `keep the notes under ${MAX_NOTES} characters` };

  let layer: number | null = null;
  if (isBacklogItem && raw.layer !== undefined && raw.layer !== null) {
    if (!isLayer(raw.layer)) return { ok: false, error: "unknown layer" };
    layer = raw.layer;
  }
  return { ok: true, value: { days, needs, notes, done: raw.done === true, layer } };
}
