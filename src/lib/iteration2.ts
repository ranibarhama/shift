/**
 * Iteration 2 canvas — types, seed graph, and validation.
 *
 * Client-safe (no DB imports). The whole canvas is one JSON document:
 * a list of nodes (boxes) and edges (connections). The DB queries live
 * in src/lib/iteration2Db.ts.
 */

export type I2Node = {
  id: string;
  position: { x: number; y: number };
  data: { title: string; body?: string };
};

export type I2Edge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
};

export type I2Graph = {
  nodes: I2Node[];
  edges: I2Edge[];
};

/** The whiteboard sketch, as the starting point. */
export const SEED_GRAPH: I2Graph = {
  nodes: [
    { id: "roles", position: { x: 720, y: -30 }, data: { title: "PM · UX · TL" } },
    { id: "data-hub", position: { x: 40, y: 150 }, data: { title: "Data HUB" } },
    {
      id: "gate",
      position: { x: 360, y: 120 },
      data: {
        title: "GATE",
        body: "HL validation\nRICE optimization\nApprove for work",
      },
    },
    {
      id: "ignis",
      position: { x: 680, y: 120 },
      data: { title: "Ignis", body: "Ticket\nVibe coding" },
    },
    { id: "mr", position: { x: 1000, y: 150 }, data: { title: "MR" } },
    { id: "prod", position: { x: 1180, y: 150 }, data: { title: "Prod" } },
    {
      id: "pod-pilot",
      position: { x: 400, y: 360 },
      data: {
        title: "Pod Pilot",
        body: "Current roadmap\nCurrent capacity\nPast cases intel\nAny other data",
      },
    },
    { id: "ops-hub", position: { x: 1000, y: 360 }, data: { title: "OPS HUB" } },
    { id: "gtm", position: { x: 660, y: 560 }, data: { title: "GTM" } },
    {
      id: "tracking",
      position: { x: 80, y: 560 },
      data: { title: "Ongoing post-launch tracking" },
    },
  ],
  edges: [
    {
      id: "e-datahub-gate",
      source: "data-hub",
      target: "gate",
      sourceHandle: "s-right",
      targetHandle: "t-left",
      label: "North Star · Pillars · Insights · Problems",
    },
    { id: "e-gate-ignis", source: "gate", target: "ignis", sourceHandle: "s-right", targetHandle: "t-left" },
    { id: "e-ignis-mr", source: "ignis", target: "mr", sourceHandle: "s-right", targetHandle: "t-left" },
    { id: "e-mr-prod", source: "mr", target: "prod", sourceHandle: "s-right", targetHandle: "t-left" },
    { id: "e-pod-gate", source: "pod-pilot", target: "gate", sourceHandle: "s-top", targetHandle: "t-bottom" },
    {
      id: "e-datahub-pod",
      source: "data-hub",
      target: "pod-pilot",
      sourceHandle: "s-bottom",
      targetHandle: "t-left",
      dashed: true,
    },
    { id: "e-ops-ignis", source: "ops-hub", target: "ignis", sourceHandle: "s-top", targetHandle: "t-bottom" },
    { id: "e-ops-gtm", source: "ops-hub", target: "gtm", sourceHandle: "s-bottom", targetHandle: "t-right" },
    { id: "e-gtm-tracking", source: "gtm", target: "tracking", sourceHandle: "s-left", targetHandle: "t-right" },
    {
      id: "e-tracking-datahub",
      source: "tracking",
      target: "data-hub",
      sourceHandle: "s-top",
      targetHandle: "t-bottom",
      dashed: true,
      animated: true,
    },
    { id: "e-roles-ignis", source: "roles", target: "ignis", sourceHandle: "s-bottom", targetHandle: "t-top" },
  ],
};

/** Parse + sanitize an arbitrary object into a valid graph, or null. */
export function sanitizeGraph(input: unknown): I2Graph | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return null;

  const nodes: I2Node[] = [];
  for (const n of obj.nodes as Record<string, unknown>[]) {
    if (!n || typeof n.id !== "string") continue;
    const pos = n.position as { x?: unknown; y?: unknown } | undefined;
    const data = n.data as { title?: unknown; body?: unknown } | undefined;
    nodes.push({
      id: n.id,
      position: {
        x: Number(pos?.x) || 0,
        y: Number(pos?.y) || 0,
      },
      data: {
        title: typeof data?.title === "string" ? data.title : "",
        body: typeof data?.body === "string" ? data.body : undefined,
      },
    });
  }

  const edges: I2Edge[] = [];
  for (const e of obj.edges as Record<string, unknown>[]) {
    if (!e || typeof e.id !== "string" || typeof e.source !== "string" || typeof e.target !== "string") {
      continue;
    }
    edges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: typeof e.sourceHandle === "string" ? e.sourceHandle : null,
      targetHandle: typeof e.targetHandle === "string" ? e.targetHandle : null,
      label: typeof e.label === "string" ? e.label : undefined,
      animated: !!e.animated,
      dashed: !!e.dashed,
    });
  }

  return { nodes, edges };
}
