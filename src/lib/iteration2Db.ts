/**
 * Iteration 2 canvas — server-only DB queries.
 * Kept separate from src/lib/iteration2.ts so the shared types can be
 * pulled into a client component without dragging node:fs into the bundle.
 */

import { row, run } from "./db";
import { SEED_GRAPH, sanitizeGraph, type I2Graph } from "./iteration2";

const CANVAS_ID = "canvas";

export async function getIteration2Graph(): Promise<I2Graph> {
  const r = await row<{ graph: string | null }>(
    "SELECT graph FROM iteration2 WHERE id = ?",
    [CANVAS_ID]
  );
  if (!r || !r.graph) return SEED_GRAPH;
  try {
    const parsed = sanitizeGraph(JSON.parse(r.graph));
    return parsed ?? SEED_GRAPH;
  } catch {
    return SEED_GRAPH;
  }
}

export async function saveIteration2Graph(graph: I2Graph): Promise<void> {
  await run(
    `INSERT INTO iteration2 (id, graph, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       graph = excluded.graph,
       updated_at = excluded.updated_at`,
    [CANVAS_ID, JSON.stringify(graph), Date.now()]
  );
}
