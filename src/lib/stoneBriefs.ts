/**
 * Stone briefs — types, constants, and pure parsing helpers.
 *
 * Client-safe (no DB imports). The matching DB queries live in
 * src/lib/stoneBriefsDb.ts so this file can be pulled into a client
 * component without dragging node:fs into the client bundle.
 *
 * Shape per stone:
 *   - leaders    : multi-select from the fixed LEADER_NAMES list
 *   - kpis       : multi-select from KPIS, each tagged Primary or Secondary
 *   - outcome    : one-line target the stone is committing to deliver
 *   - pilot      : first concrete 2-week experiment
 *   - people     : free-text of names pulled in from other teams
 *   - review_date: ISO yyyy-mm-dd of the leadership check-in
 */

export const LEADER_NAMES = ["Gal", "Rani", "Ran", "Limor", "Yossi", "Ben"] as const;
export type LeaderName = (typeof LEADER_NAMES)[number];

export type KpiKey =
  | "time-saved"
  | "cost-avoidance"
  | "tool-adoption"
  | "workflow-innovation"
  | "role-expansion"
  | "business-outcomes";

export type KpiRole = "primary" | "secondary";

export type KpiDef = {
  key: KpiKey;
  label: string;
  description: string;
};

export const KPIS: KpiDef[] = [
  {
    key: "time-saved",
    label: "Time Saved",
    description: "Time saved per task (self-reported per task).",
  },
  {
    key: "cost-avoidance",
    label: "Cost Avoidance",
    description: "$$ tasks previously outsourced, now done in-house.",
  },
  {
    key: "tool-adoption",
    label: "Tool Adoption",
    description:
      "% of Division using AI tools daily (Gemini, Base44, Claude) and use-case creation.",
  },
  {
    key: "workflow-innovation",
    label: "Workflow Innovation",
    description: "# processes redesigned or automated with AI.",
  },
  {
    key: "role-expansion",
    label: "Role Expansion",
    description: "# new skills and activities each person completes.",
  },
  {
    key: "business-outcomes",
    label: "Business Outcomes",
    description:
      "Revenue per employee, time-to-hire, sales-cycle length, support-resolution time.",
  },
];

export type StoneBriefRow = {
  stone_key: string;
  leaders: string | null;
  kpis: string | null;
  outcome: string | null;
  pilot: string | null;
  people: string | null;
  review_date: string | null;
  updated_at: number;
};

/** Parsed view of a brief — what the UI consumes. */
export type StoneBrief = {
  stoneKey: string;
  leaders: LeaderName[];
  kpis: Partial<Record<KpiKey, KpiRole>>;
  outcome: string;
  pilot: string;
  people: string;
  reviewDate: string;
  updatedAt: number;
};

export function emptyBrief(stoneKey: string): StoneBrief {
  return {
    stoneKey,
    leaders: [],
    kpis: {},
    outcome: "",
    pilot: "",
    people: "",
    reviewDate: "",
    updatedAt: 0,
  };
}

export function parseBrief(r: StoneBriefRow): StoneBrief {
  const leaders = (() => {
    if (!r.leaders) return [] as LeaderName[];
    try {
      const parsed = JSON.parse(r.leaders) as string[];
      return parsed.filter((n): n is LeaderName =>
        (LEADER_NAMES as readonly string[]).includes(n)
      );
    } catch {
      return [];
    }
  })();

  const kpis = (() => {
    if (!r.kpis) return {} as Partial<Record<KpiKey, KpiRole>>;
    try {
      const parsed = JSON.parse(r.kpis) as Record<string, string>;
      const out: Partial<Record<KpiKey, KpiRole>> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (
          KPIS.some((kpi) => kpi.key === k) &&
          (v === "primary" || v === "secondary")
        ) {
          out[k as KpiKey] = v;
        }
      }
      return out;
    } catch {
      return {};
    }
  })();

  return {
    stoneKey: r.stone_key,
    leaders,
    kpis,
    outcome: r.outcome ?? "",
    pilot: r.pilot ?? "",
    people: r.people ?? "",
    reviewDate: r.review_date ?? "",
    updatedAt: r.updated_at,
  };
}

export type StoneBriefPatch = {
  leaders?: LeaderName[];
  kpis?: Partial<Record<KpiKey, KpiRole>>;
  outcome?: string;
  pilot?: string;
  people?: string;
  reviewDate?: string;
};
