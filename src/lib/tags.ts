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
  { key: "task", label: "Tasks", verb: "Add task" },
  { key: "pain_point", label: "Pain points", verb: "Add pain point" },
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
