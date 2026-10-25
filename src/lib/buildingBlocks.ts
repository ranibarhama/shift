/**
 * Building blocks — Phase 2 · Step 1, slide 00.
 *
 * Each team member records, per building block of the process:
 *   - have    : what we have today
 *   - missing : what's missing (their top 3)
 *   - connect : something we have that needs a connection, and to where
 *
 * Client-safe (types + constants only). DB queries live in
 * src/lib/buildingBlocksDb.ts.
 */

import { LEADER_NAMES } from "./stoneBriefs";

// Keys are stored with each entry — rename `label` freely, never `key`.
// `mapLines` is the (possibly wrapped) label under each dot in the connections map.
// `owners` are the team members accountable for each block.
// `hex`: validated categorical palette (dataviz default, slots 1–8), one step per
// block that passes both light and dark modes as a linear (process-order) set.
export const BUILDING_BLOCKS = [
  {
    key: "research",
    label: "Data insights",
    mapLines: ["Data insights"],
    hex: "#2a78d6",
    owners: ["Yossi"],
  },
  {
    key: "planning",
    label: "Planning & Prioritisations",
    mapLines: ["Planning &", "Prioritisations"],
    hex: "#d95926",
    owners: ["Rani"],
  },
  {
    key: "development",
    label: "Development",
    mapLines: ["Development"],
    hex: "#199e70",
    owners: ["Rani", "Oren", "Gal"],
  },
  { key: "launch", label: "Launch", mapLines: ["Launch"], hex: "#c98500", owners: ["Ben", "Rani"] },
  { key: "growth", label: "Growth", mapLines: ["Growth"], hex: "#d55181", owners: ["Ben"] },
  { key: "feedback", label: "Feedback", mapLines: ["Feedback"], hex: "#008300", owners: ["Yossi"] },
  {
    // Shown as "OPS" (was "Continuous learning"); key kept so saved input stays attached.
    key: "learning",
    label: "OPS",
    mapLines: ["OPS"],
    hex: "#6250d6",
    owners: ["Limor"],
  },
  {
    // Spans under every block (see isFoundation) — the shared memory of the org.
    key: "brain",
    label: "Organization brain",
    mapLines: ["Organization", "brain"],
    hex: "#e34948",
    owners: [],
  },
] as const;

/** Blocks that span the whole process (full-width card / band) rather than sit in the
 *  flow: OPS ("learning") and the Organization brain. */
const SPANNING = new Set<string>(["learning", "brain"]);

export function isFoundation(key: string): boolean {
  return SPANNING.has(key);
}

export type BlockKey = (typeof BUILDING_BLOCKS)[number]["key"];
export type InputKind = "have" | "missing" | "connect";

/** Every item is categorized as one of these. Shown as neutral labels (no hue):
 *  the block palette owns color, and a second hued set would collide with it. */
export const CATEGORIES = [
  { key: "system", label: "System" },
  { key: "tool", label: "Tool" },
  { key: "process", label: "Process" },
  { key: "infrastructure", label: "Infrastructure" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Team roster offered as quick picks (anyone can also type another name).
 *  Includes every block owner, e.g. Oren (Development), who isn't a stone leader. */
export const TEAM_MEMBERS: readonly string[] = [...LEADER_NAMES, "Oren"];

export const MAX_MISSING = 3;
export const MAX_TEXT = 200;
export const MAX_MEMBER = 40;
export const MAX_TARGET = 80;
/** Most places one item can point to. */
export const MAX_TARGETS = 8;

export type BlockInput = {
  id: string;
  block: BlockKey;
  member: string;
  kind: InputKind;
  text: string;
  /** Where it needs to connect — block keys or free text (a system / team).
   *  `connect`: at least one. `missing`: at least one, unless `unsure`. */
  targets: string[];
  /** `missing` only: "I'm not sure where it should connect". */
  unsure: boolean;
  /** Required on new items; null only for rows created before categories existed. */
  category: CategoryKey | null;
  createdAt: number;
};

export type BlockInputRow = {
  id: string;
  block: string;
  member: string;
  kind: string;
  text: string;
  /** Legacy single target (rows from before `targets`). */
  target: string | null;
  /** JSON array of strings. */
  targets: string | null;
  unsure: number | null;
  category: string | null;
  created_at: number;
};

const BLOCK_KEYS = new Set<string>(BUILDING_BLOCKS.map((b) => b.key));
const KINDS = new Set<string>(["have", "missing", "connect"]);
const CATEGORY_KEYS = new Set<string>(CATEGORIES.map((c) => c.key));

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === "string" && CATEGORY_KEYS.has(v);
}

export function categoryDef(key: string | null) {
  return CATEGORIES.find((c) => c.key === key) ?? null;
}

export function isBlockKey(v: unknown): v is BlockKey {
  return typeof v === "string" && BLOCK_KEYS.has(v);
}

export function isInputKind(v: unknown): v is InputKind {
  return typeof v === "string" && KINDS.has(v);
}

export function blockDef(key: string) {
  return BUILDING_BLOCKS.find((b) => b.key === key) ?? null;
}

function parseTargets(r: BlockInputRow): string[] {
  if (r.targets) {
    try {
      const v: unknown = JSON.parse(r.targets);
      if (Array.isArray(v)) return v.filter((t): t is string => typeof t === "string");
    } catch {
      /* fall through to the legacy column */
    }
  }
  return r.target ? [r.target] : [];
}

export function parseBlockInput(r: BlockInputRow): BlockInput {
  return {
    id: r.id,
    block: r.block as BlockKey,
    member: r.member,
    kind: r.kind as InputKind,
    text: r.text,
    targets: parseTargets(r),
    unsure: Number(r.unsure ?? 0) === 1,
    category: isCategoryKey(r.category) ? r.category : null,
    createdAt: Number(r.created_at),
  };
}
