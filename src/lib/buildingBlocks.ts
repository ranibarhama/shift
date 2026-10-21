/**
 * Building blocks — Stage 2 · Session 1, slide 00.
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
export const BUILDING_BLOCKS = [
  {
    key: "research",
    label: "Data insights",
    mapLines: ["Data insights"],
    hex: "#22d3ee",
    owners: ["Yossi"],
  },
  {
    key: "planning",
    label: "Planning & Prioritisations",
    mapLines: ["Planning &", "Prioritisations"],
    hex: "#a855f7",
    owners: ["Rani"],
  },
  {
    key: "development",
    label: "Development",
    mapLines: ["Development"],
    hex: "#3b82f6",
    owners: ["Rani", "Oren", "Gal"],
  },
  { key: "launch", label: "Launch", mapLines: ["Launch"], hex: "#10b981", owners: ["Ben", "Rani"] },
  { key: "growth", label: "Growth", mapLines: ["Growth"], hex: "#f59e0b", owners: ["Ben"] },
  { key: "feedback", label: "Feedback", mapLines: ["Feedback"], hex: "#ef4444", owners: ["Yossi"] },
  {
    // Shown as "OPS" (was "Continuous learning"); key kept so saved input stays attached.
    key: "learning",
    label: "OPS",
    mapLines: ["OPS"],
    hex: "#7c5cff",
    owners: ["Limor"],
  },
] as const;

export type BlockKey = (typeof BUILDING_BLOCKS)[number]["key"];
export type InputKind = "have" | "missing" | "connect";

/** Every item is categorized as one of these. */
export const CATEGORIES = [
  { key: "system", label: "System", hex: "#0ea5e9" },
  { key: "tool", label: "Tool", hex: "#14b8a6" },
  { key: "process", label: "Process", hex: "#ec4899" },
  { key: "infrastructure", label: "Infrastructure", hex: "#64748b" },
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
