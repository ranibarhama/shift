/**
 * Task plan estimates — server-only DB queries (see src/lib/taskPlan.ts).
 */

import { row, rows, run } from "./db";
import { MAX_MEMBER } from "./buildingBlocks";
import { isArchTaskId, parseEstimateInput, type Estimate, type Estimates } from "./taskPlan";

type EstimateRow = {
  task_id: string;
  data: string;
  updated_by: string | null;
  updated_at: number;
};

function parseRow(r: EstimateRow): Estimate | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(r.data) as Record<string, unknown>;
  } catch {
    return null;
  }
  // Rows were cleaned on the way in; cleaning again keeps old rows valid if the roles change.
  const parsed = parseEstimateInput(data, true);
  if (!parsed.ok) return null;
  return { ...parsed.value, updatedBy: r.updated_by ?? "", updatedAt: Number(r.updated_at) };
}

export async function listEstimates(): Promise<Estimates> {
  const rs = await rows<EstimateRow>("SELECT * FROM task_estimates");
  const out: Estimates = {};
  for (const r of rs) {
    const e = parseRow(r);
    if (e) out[r.task_id] = e;
  }
  return out;
}

export type SaveResult = { ok: true; estimate: Estimate } | { ok: false; error: string; status: number };

/** Saves (creates or replaces) the estimate of one task. */
export async function saveEstimate(taskId: string, body: Record<string, unknown>): Promise<SaveResult> {
  const isBacklogItem = !isArchTaskId(taskId);
  if (isBacklogItem) {
    const input = await row<{ id: string }>(
      "SELECT id FROM block_inputs WHERE id = ? AND kind IN ('missing', 'connect')",
      [taskId]
    );
    if (!input) return { ok: false, error: "unknown task", status: 404 };
  }
  const parsed = parseEstimateInput(body, isBacklogItem);
  if (!parsed.ok) return { ok: false, error: parsed.error, status: 400 };

  const member = typeof body.member === "string" ? body.member.trim().slice(0, MAX_MEMBER) : "";
  const now = Date.now();
  await run(
    `INSERT INTO task_estimates (task_id, data, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(task_id) DO UPDATE SET
       data = excluded.data, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    [taskId, JSON.stringify(parsed.value), member || null, now]
  );
  return { ok: true, estimate: { ...parsed.value, updatedBy: member, updatedAt: now } };
}
