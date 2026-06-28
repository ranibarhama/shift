/**
 * Pilot board — types, constants, and pure parsing helpers.
 *
 * Client-safe (no DB imports). The matching DB queries live in
 * src/lib/pilotBoardDb.ts so these types can be pulled into a client
 * component without dragging node:fs into the bundle.
 */

import {
  KPIS,
  type CustomKpi,
  type KpiKey,
  type KpiRole,
} from "./stoneBriefs";

export type StageKey =
  | "insights"
  | "ai-build"
  | "gtm"
  | "decision-brain"
  | "ops-risk"
  | "financial";

export type StageDef = {
  key: StageKey;
  label: string;
  hex: string;
};

/** The six stages the matrix walks each selected initiative through. */
export const PILOT_STAGES: StageDef[] = [
  { key: "insights", label: "Insights Engine", hex: "#22d3ee" },
  { key: "ai-build", label: "AI Build / MVP", hex: "#3b82f6" },
  { key: "gtm", label: "GTM & Grow", hex: "#ef4444" },
  { key: "decision-brain", label: "Organization Brain", hex: "#a855f7" },
  { key: "ops-risk", label: "Ops, Risk & Governance", hex: "#7c5cff" },
  { key: "financial", label: "Financial Performance", hex: "#eab308" },
];

export type GapType = "tool" | "workflow" | "infra" | "other";
export type GapStatus = "open" | "in_progress" | "done";

export type GapTypeDef = { key: GapType; label: string; hex: string };
export const GAP_TYPES: GapTypeDef[] = [
  { key: "tool", label: "Tool", hex: "#3b82f6" },
  { key: "workflow", label: "Workflow", hex: "#a855f7" },
  { key: "infra", label: "Infra", hex: "#10b981" },
  { key: "other", label: "Other", hex: "#64748b" },
];

export type GapStatusDef = { key: GapStatus; label: string; hex: string };
export const GAP_STATUSES: GapStatusDef[] = [
  { key: "open", label: "Open", hex: "#94a3b8" },
  { key: "in_progress", label: "In progress", hex: "#3b82f6" },
  { key: "done", label: "Done", hex: "#10b981" },
];

/* ---------- DB row + parsed UI shapes ---------- */

export type PilotInitiativeRow = {
  id: string;
  title: string;
  description: string | null;
  author_role: string | null;
  selected: number;
  kpis: string | null;
  custom_kpis: string | null;
  created_at: number;
  updated_at: number;
};

export type PilotInitiative = {
  id: string;
  title: string;
  description: string;
  authorRole: string | null;
  selected: boolean;
  kpis: Partial<Record<KpiKey, KpiRole>>;
  customKpis: CustomKpi[];
  createdAt: number;
  updatedAt: number;
};

const KPI_KEY_SET = new Set<string>(KPIS.map((k) => k.key));

function parseKpisJson(json: string | null): Partial<Record<KpiKey, KpiRole>> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Partial<Record<KpiKey, KpiRole>> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (KPI_KEY_SET.has(k) && (v === "primary" || v === "secondary")) {
        out[k as KpiKey] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function parseCustomKpisJson(json: string | null): CustomKpi[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as Array<{ label?: unknown; role?: unknown }>;
    const out: CustomKpi[] = [];
    for (const item of parsed) {
      if (
        typeof item?.label === "string" &&
        item.label.trim() &&
        (item.role === "primary" || item.role === "secondary")
      ) {
        out.push({ label: item.label.trim(), role: item.role });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function parseInitiative(r: PilotInitiativeRow): PilotInitiative {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    authorRole: r.author_role,
    selected: r.selected === 1,
    kpis: parseKpisJson(r.kpis),
    customKpis: parseCustomKpisJson(r.custom_kpis),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export type PilotGapRow = {
  id: string;
  initiative_id: string;
  stage_key: string;
  title: string | null;
  type: string;
  type_other: string | null;
  owner: string | null;
  status: string;
  notes: string | null;
  created_at: number;
  updated_at: number;
};

export type PilotGap = {
  id: string;
  initiativeId: string;
  stageKey: StageKey;
  title: string;
  type: GapType;
  typeOther: string;
  owner: string | null;
  status: GapStatus;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

const STAGE_KEY_SET = new Set<string>(PILOT_STAGES.map((s) => s.key));
const GAP_TYPE_SET = new Set<string>(GAP_TYPES.map((t) => t.key));
const GAP_STATUS_SET = new Set<string>(GAP_STATUSES.map((s) => s.key));

export function parseGap(r: PilotGapRow): PilotGap {
  return {
    id: r.id,
    initiativeId: r.initiative_id,
    stageKey: (STAGE_KEY_SET.has(r.stage_key) ? r.stage_key : "insights") as StageKey,
    title: r.title ?? "",
    type: (GAP_TYPE_SET.has(r.type) ? r.type : "tool") as GapType,
    typeOther: r.type_other ?? "",
    owner: r.owner,
    status: (GAP_STATUS_SET.has(r.status) ? r.status : "open") as GapStatus,
    notes: r.notes ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ---------- Patch types for the API ---------- */

export type PilotInitiativePatch = {
  title?: string;
  description?: string;
  selected?: boolean;
  kpis?: Partial<Record<KpiKey, KpiRole>>;
  customKpis?: CustomKpi[];
};

export type PilotGapPatch = {
  title?: string;
  type?: GapType;
  typeOther?: string;
  owner?: string | null;
  status?: GapStatus;
  notes?: string;
};

/* ---------- Convenience ---------- */

export function getStageDef(key: string): StageDef | undefined {
  return PILOT_STAGES.find((s) => s.key === key);
}
