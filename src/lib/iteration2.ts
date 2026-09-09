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
  data: {
    title: string;
    owner?: string;
    system?: string;
    details?: string;
    inputs?: string;
    outputs?: string;
    color?: string;
    size?: "s" | "m" | "l";
    shape?: "square" | "circle" | "rect";
  };
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
  /** true = arrows on both ends (two-way); false/undefined = one-way. */
  bidirectional?: boolean;
  /** line + arrow color, e.g. "#8b9cff". Falls back to the default. */
  color?: string;
};

export type I2Graph = {
  nodes: I2Node[];
  edges: I2Edge[];
};

/** The continuous product loop — USE → LEARN → BUILD → SHIP → USE. */
export const SEED_GRAPH: I2Graph = {
  nodes: [
    { id: "use", position: { x: 420, y: 40 }, data: { title: "Use" } },
    { id: "learn", position: { x: 660, y: 260 }, data: { title: "Learn" } },
    { id: "build", position: { x: 420, y: 480 }, data: { title: "Build" } },
    { id: "ship", position: { x: 180, y: 260 }, data: { title: "Ship" } },
  ],
  edges: [
    {
      id: "e-use-learn",
      source: "use",
      target: "learn",
      sourceHandle: "s-right",
      targetHandle: "t-top",
      animated: true,
      dashed: true,
    },
    {
      id: "e-learn-build",
      source: "learn",
      target: "build",
      sourceHandle: "s-bottom",
      targetHandle: "t-right",
      animated: true,
      dashed: true,
    },
    {
      id: "e-build-ship",
      source: "build",
      target: "ship",
      sourceHandle: "s-left",
      targetHandle: "t-bottom",
      animated: true,
      dashed: true,
    },
    {
      id: "e-ship-use",
      source: "ship",
      target: "use",
      sourceHandle: "s-top",
      targetHandle: "t-left",
      animated: true,
      dashed: true,
    },
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
    const data = n.data as {
      title?: unknown;
      owner?: unknown;
      system?: unknown;
      details?: unknown;
      inputs?: unknown;
      outputs?: unknown;
      color?: unknown;
      size?: unknown;
      shape?: unknown;
    } | undefined;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
    const color =
      typeof data?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(data.color)
        ? data.color
        : undefined;
    const size =
      data?.size === "s" || data?.size === "m" || data?.size === "l"
        ? data.size
        : undefined;
    const shape =
      data?.shape === "square" || data?.shape === "circle" || data?.shape === "rect"
        ? data.shape
        : undefined;
    nodes.push({
      id: n.id,
      position: {
        x: Number(pos?.x) || 0,
        y: Number(pos?.y) || 0,
      },
      data: {
        title: typeof data?.title === "string" ? data.title : "",
        owner: str(data?.owner),
        system: str(data?.system),
        details: str(data?.details),
        inputs: str(data?.inputs),
        outputs: str(data?.outputs),
        color,
        size,
        shape,
      },
    });
  }

  const edges: I2Edge[] = [];
  for (const e of obj.edges as Record<string, unknown>[]) {
    if (!e || typeof e.id !== "string" || typeof e.source !== "string" || typeof e.target !== "string") {
      continue;
    }
    const edgeColor =
      typeof e.color === "string" && /^#[0-9a-fA-F]{6}$/.test(e.color)
        ? e.color
        : undefined;
    edges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: typeof e.sourceHandle === "string" ? e.sourceHandle : null,
      targetHandle: typeof e.targetHandle === "string" ? e.targetHandle : null,
      label: typeof e.label === "string" ? e.label : undefined,
      animated: !!e.animated,
      dashed: !!e.dashed,
      bidirectional: !!e.bidirectional,
      color: edgeColor,
    });
  }

  return { nodes, edges };
}
