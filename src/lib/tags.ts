export const TAGS = [
  { key: "drop", label: "Drop it", color: "drop", hex: "#ef4444" },
  { key: "automate", label: "Automate it", color: "automate", hex: "#22c55e" },
  { key: "hybrid", label: "Hybrid", color: "hybrid", hex: "#eab308" },
  { key: "own", label: "Own it", color: "own", hex: "#38bdf8" },
] as const;

export type TagKey = (typeof TAGS)[number]["key"];

export function getTag(key: string | null | undefined) {
  return TAGS.find((t) => t.key === key);
}

export const ITEM_KINDS = [
  { key: "participant", label: "Who's involved", verb: "Add person / role" },
  { key: "task", label: "Current Tasks", verb: "Add task" },
  { key: "pain_point", label: "Current Pain Points", verb: "Add pain point" },
  { key: "missing", label: "What's missing", verb: "Add missing thing" },
] as const;

export type ItemKind = (typeof ITEM_KINDS)[number]["key"];

export const MISSING_CATEGORIES = [
  { key: "tool", label: "Tool", hex: "#c084fc" },
  { key: "infrastructure", label: "Infrastructure", hex: "#2dd4bf" },
  { key: "workflow", label: "Workflow", hex: "#fb7185" },
] as const;

export type MissingCategory = (typeof MISSING_CATEGORIES)[number]["key"];

export function getMissingCategory(key: string | null | undefined) {
  return MISSING_CATEGORIES.find((c) => c.key === key);
}

/**
 * A missing item's `tag` column stores one or more category keys as a comma
 * separated string ("tool,infrastructure"). This parses it into a deduped,
 * order-preserving array of valid categories.
 */
export function parseMissingCategories(tag: string | null | undefined): MissingCategory[] {
  if (!tag) return [];
  const valid = new Set(MISSING_CATEGORIES.map((c) => c.key as string));
  const seen = new Set<string>();
  const out: MissingCategory[] = [];
  for (const raw of tag.split(",")) {
    const v = raw.trim();
    if (!v || !valid.has(v) || seen.has(v)) continue;
    seen.add(v);
    out.push(v as MissingCategory);
  }
  return out;
}

export function serializeMissingCategories(cats: Iterable<string>): string {
  // Preserve the canonical order from MISSING_CATEGORIES so the stored value
  // is stable regardless of click order.
  const set = new Set(cats);
  return MISSING_CATEGORIES.filter((c) => set.has(c.key))
    .map((c) => c.key)
    .join(",");
}

export const ROI_LEVELS = [
  { key: "high", label: "High", hex: "#16a34a" },
  { key: "mid", label: "Mid", hex: "#f59e0b" },
  { key: "low", label: "Low", hex: "#ef4444" },
] as const;

export type RoiLevel = (typeof ROI_LEVELS)[number]["key"];

export function getRoi(key: string | null | undefined) {
  return ROI_LEVELS.find((r) => r.key === key);
}

export const HORIZON_LEVELS = [
  { key: "short", label: "Short term", hex: "#38bdf8" },
  { key: "mid", label: "Mid term", hex: "#818cf8" },
  { key: "long", label: "Long term", hex: "#6366f1" },
] as const;

export type HorizonLevel = (typeof HORIZON_LEVELS)[number]["key"];

export function getHorizon(key: string | null | undefined) {
  return HORIZON_LEVELS.find((h) => h.key === key);
}
