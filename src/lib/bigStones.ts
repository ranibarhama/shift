/**
 * Big Stones — strategic rollup of the missing-items backlog.
 *
 * Six canonical stones, each tied to a pillar of "How good looks like".
 * Every backlog item is auto-classified into one stone using keyword
 * matching against its content, stage and workflow names. Items that
 * don't match any stone confidently surface as "needs alignment" so the
 * workshop can sweep them.
 *
 * Tweak by editing the BIG_STONES array below — name, description,
 * pillar reference, color and keywords are all data, not code.
 */

import type { MissingItemRow } from "./queries";

export type BigStoneKey =
  | "insights"
  | "ai-build"
  | "gtm"
  | "decision-brain"
  | "ops-risk"
  | "financial";

export type BigStone = {
  key: BigStoneKey;
  num: number;
  name: string;
  description: string;
  /** Where it lives on /blueprint. */
  connectsTo: string;
  hex: string;
  keywords: string[];
};

export const BIG_STONES: BigStone[] = [
  {
    key: "insights",
    num: 1,
    name: "Stand up the B2C Insights Engine",
    description:
      "Always-on agents capturing market, user, support, social and competitor signal in one place.",
    connectsTo: "B2C Insights Engine",
    hex: "#22d3ee",
    keywords: [
      "market", "research", "customer", "voice", "voc",
      "signal", "listen", "review", "complaint", "feedback", "support",
      "competitor", "competition", "benchmark", "trend", "demand",
      "search demand", "sentiment", "social listening", "reddit",
      "tiktok", "linkedin", "insight",
    ],
  },
  {
    key: "ai-build",
    num: 2,
    name: "Adopt AI-Native Build",
    description:
      "MVP Mode plus Mini-Pods, running in no-sprints mode — for both legacy modernization and greenfield features.",
    connectsTo: "AI Build / MVP & Legacy",
    hex: "#3b82f6",
    keywords: [
      "build", "develop", "code", "engineer", "engineering", "technical",
      "mvp", "prototype", "ship", "deploy", "release", "refactor",
      "migrate", "rewrite", "legacy", "codegen", "copilot",
      "sprint", "scrum", "agile", "ticket", "story",
      "qa", "test", "regression", "bug",
      "design system", "component", "library", "wireframe",
    ],
  },
  {
    key: "gtm",
    num: 3,
    name: "Move to Agent-Driven GTM",
    description:
      "Launches and growth handled by an agent crew across every channel, with live KPI monitors feeding product back.",
    connectsTo: "GTM & Grow",
    hex: "#ef4444",
    keywords: [
      "launch", "campaign", "marketing", "advert", "ads ", "ad ",
      "channel", "distribution", "partner", "affiliate",
      "seo", "aso", "paid", "social media",
      "growth", "acquisition", "conversion", "funnel", "onboarding",
      "kpi", "retention", "churn", "ltv", "cac", "roas", "arpu",
      "email campaign", "push notification",
      "pricing", "monetization", "upsell", "cross-sell",
    ],
  },
  {
    key: "decision-brain",
    num: 4,
    name: "Build the B2C Organization Brain",
    description:
      "A living knowledge layer that captures and serves what the organization knows — for humans and AI agents.",
    connectsTo: "B2C Organization Brain",
    hex: "#a855f7",
    keywords: [
      "knowledge", "memory", "brain",
      "doc", "documentation", "wiki", "confluence", "notion",
      "prompt library", "playbook",
      "decision log", "context", "reasoning",
      "ai assist", "ai context", "ai agent",
      "source of truth", "single source",
      "learning", "lesson", "retro",
    ],
  },
  {
    key: "ops-risk",
    num: 5,
    name: "Ops, Risk & Governance AI Layer",
    description:
      "Cross-cutting visibility, ownership clarity, alerts and compliance handled by an AI ops layer.",
    connectsTo: "Cross-cutting · Ops, Risk & Governance",
    hex: "#7c5cff",
    keywords: [
      "ops ", "operations", "observability",
      "compliance", "regulatory", "gdpr", "privacy",
      "security", "audit", "policy", "governance",
      "dashboard", "monitoring", "alert", "alarm",
      "ownership", "owner", "accountability",
      "risk register", "risk", "mitigation",
      "quality gate", "threshold", "visibility",
    ],
  },
  {
    key: "financial",
    num: 6,
    name: "Financial Performance AI Layer",
    description:
      "Live revenue, cost and forecast modeling tied to decisions leadership can take this week.",
    connectsTo: "Cross-cutting · Financial Performance",
    hex: "#eab308",
    keywords: [
      "revenue", "sales report", "billing", "invoice",
      "cost", "expense", "spend", "budget",
      "finance", "financial", "p&l", "profit",
      "forecast", "scenario", "plan vs actual",
      "margin", "unit economics",
      "arr", "mrr", "payback",
      "profitability",
    ],
  },
];

/**
 * Smart Sort action score — copied from BacklogTable so this lib stays
 * self-contained (no client-component imports).
 *
 * Impact × Horizon × Effort, max 3·3·4 = 36, normalized to 0..100.
 * Effort is inverted (S=4, XL=1) so smaller effort scores higher.
 * Any unrated dimension → score = 0.
 */
export function actionScore(it: MissingItemRow) {
  const impact = it.roi === "high" ? 3 : it.roi === "mid" ? 2 : it.roi === "low" ? 1 : 0;
  const horizon =
    it.horizon === "short" ? 3 : it.horizon === "mid" ? 2 : it.horizon === "long" ? 1 : 0;
  const effort =
    it.effort === "s" ? 4 : it.effort === "m" ? 3 : it.effort === "l" ? 2 : it.effort === "xl" ? 1 : 0;
  const raw = impact * horizon * effort;
  const score = Math.round((raw / 36) * 100);
  const rated = impact > 0 && horizon > 0 && effort > 0;
  return { score, rated };
}

/**
 * Pick the stone whose keywords match the item's content best.
 * Returns null if no stone matched at all — that bucket becomes the
 * "needs alignment" list in the UI.
 */
export function classifyItem(item: MissingItemRow): BigStoneKey | null {
  const text = [
    item.content ?? "",
    item.stage_name ?? "",
    item.process_name ?? "",
    item.category ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let bestKey: BigStoneKey | null = null;
  let bestScore = 0;

  for (const stone of BIG_STONES) {
    let score = 0;
    for (const kw of stone.keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = stone.key;
    }
  }

  return bestKey;
}

export type StoneAnalysis = {
  stone: BigStone;
  itemCount: number;
  ratedCount: number;
  totalScore: number;
  quickWinCount: number;
  /** Top 3 rated items in this stone (score > 0), by score desc. */
  topItems: { item: MissingItemRow; score: number }[];
};

export type BacklogAnalysis = {
  stones: StoneAnalysis[];
  totalItems: number;
  mappedItems: number;
  unmappedItems: MissingItemRow[];
};

export function analyzeBacklog(items: MissingItemRow[]): BacklogAnalysis {
  const groups: Record<BigStoneKey, MissingItemRow[]> = {
    insights: [],
    "ai-build": [],
    gtm: [],
    "decision-brain": [],
    "ops-risk": [],
    financial: [],
  };
  const unmapped: MissingItemRow[] = [];

  for (const item of items) {
    const key = classifyItem(item);
    if (key) groups[key].push(item);
    else unmapped.push(item);
  }

  const stones: StoneAnalysis[] = BIG_STONES.map((stone) => {
    const stoneItems = groups[stone.key];
    const scored = stoneItems.map((item) => ({ item, ...actionScore(item) }));
    const ratedCount = scored.filter((s) => s.rated).length;
    const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
    const quickWinCount = scored.filter(
      (s) => s.item.roi === "high" && s.item.effort === "s"
    ).length;
    const topItems = [...scored]
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item, score }) => ({ item, score }));

    return {
      stone,
      itemCount: stoneItems.length,
      ratedCount,
      totalScore,
      quickWinCount,
      topItems,
    };
  });

  return {
    stones,
    totalItems: items.length,
    mappedItems: items.length - unmapped.length,
    unmappedItems: unmapped,
  };
}
