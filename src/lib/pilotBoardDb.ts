/**
 * Pilot board — server-only DB queries.
 *
 * Kept separate from src/lib/pilotBoard.ts (types + constants only) so
 * the shared types can be pulled into a client component without
 * dragging node:fs (via ./db) into the client bundle.
 */

import { row, rows, run } from "./db";
import {
  PILOT_STAGES,
  parseGap,
  parseInitiative,
  parseTask,
  type PilotGap,
  type PilotGapPatch,
  type PilotGapRow,
  type PilotInitiative,
  type PilotInitiativePatch,
  type PilotInitiativeRow,
  type PilotTask,
  type PilotTaskPatch,
  type PilotTaskRow,
  type StageKey,
} from "./pilotBoard";

const VALID_STAGE_KEYS = new Set<string>(PILOT_STAGES.map((s) => s.key));

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ---------- Initiatives ---------- */

export async function getAllPilotInitiatives(): Promise<PilotInitiative[]> {
  const raw = await rows<PilotInitiativeRow>(
    "SELECT * FROM pilot_initiatives ORDER BY selected DESC, created_at ASC"
  );
  return raw.map(parseInitiative);
}

export async function createPilotInitiative(
  title: string,
  description: string,
  authorRole: string | null
): Promise<PilotInitiative> {
  const id = genId("ini");
  const now = Date.now();
  await run(
    `INSERT INTO pilot_initiatives
       (id, title, description, author_role, selected, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [id, title, description, authorRole, now, now]
  );
  const fresh = await row<PilotInitiativeRow>(
    "SELECT * FROM pilot_initiatives WHERE id = ?",
    [id]
  );
  return parseInitiative(fresh!);
}

export async function updatePilotInitiative(
  id: string,
  patch: PilotInitiativePatch
): Promise<PilotInitiative | null> {
  const existing = await row<PilotInitiativeRow>(
    "SELECT * FROM pilot_initiatives WHERE id = ?",
    [id]
  );
  if (!existing) return null;
  const existingParsed = parseInitiative(existing);

  const next = {
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description ?? "",
    selected:
      patch.selected === undefined ? existing.selected : patch.selected ? 1 : 0,
    kpis: JSON.stringify(patch.kpis ?? existingParsed.kpis),
    custom_kpis: JSON.stringify(patch.customKpis ?? existingParsed.customKpis),
    updated_at: Date.now(),
  };

  await run(
    `UPDATE pilot_initiatives
       SET title = ?, description = ?, selected = ?,
           kpis = ?, custom_kpis = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.title,
      next.description,
      next.selected,
      next.kpis,
      next.custom_kpis,
      next.updated_at,
      id,
    ]
  );

  const fresh = await row<PilotInitiativeRow>(
    "SELECT * FROM pilot_initiatives WHERE id = ?",
    [id]
  );
  return fresh ? parseInitiative(fresh) : null;
}

export async function deletePilotInitiative(id: string): Promise<void> {
  await run("DELETE FROM pilot_initiatives WHERE id = ?", [id]);
}

/* ---------- Gaps ---------- */

export async function getAllPilotGaps(): Promise<PilotGap[]> {
  const raw = await rows<PilotGapRow>(
    "SELECT * FROM pilot_gaps ORDER BY created_at ASC"
  );
  // Drop rows whose stage_key is no longer a valid pilot stage (e.g. gaps
  // logged against a stage that was later removed). Silently defaulting
  // them to another stage via parseGap would misrepresent where they live.
  return raw.filter((r) => VALID_STAGE_KEYS.has(r.stage_key)).map(parseGap);
}

export async function createPilotGap(
  initiativeId: string,
  stageKey: StageKey
): Promise<PilotGap> {
  const id = genId("gap");
  const now = Date.now();
  await run(
    `INSERT INTO pilot_gaps
       (id, initiative_id, stage_key, title, type, owner, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, '', 'tool', NULL, 'open', NULL, ?, ?)`,
    [id, initiativeId, stageKey, now, now]
  );
  const fresh = await row<PilotGapRow>(
    "SELECT * FROM pilot_gaps WHERE id = ?",
    [id]
  );
  return parseGap(fresh!);
}

export async function updatePilotGap(
  id: string,
  patch: PilotGapPatch
): Promise<PilotGap | null> {
  const existing = await row<PilotGapRow>(
    "SELECT * FROM pilot_gaps WHERE id = ?",
    [id]
  );
  if (!existing) return null;

  const next = {
    title: patch.title ?? existing.title ?? "",
    type: patch.type ?? existing.type,
    type_other: patch.typeOther ?? existing.type_other ?? "",
    owner: patch.owner === undefined ? existing.owner : patch.owner,
    status: patch.status ?? existing.status,
    due_date: patch.dueDate ?? existing.due_date ?? "",
    notes: patch.notes ?? existing.notes ?? "",
    updated_at: Date.now(),
  };

  await run(
    `UPDATE pilot_gaps
       SET title = ?, type = ?, type_other = ?, owner = ?, status = ?, due_date = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.title,
      next.type,
      next.type_other,
      next.owner,
      next.status,
      next.due_date,
      next.notes,
      next.updated_at,
      id,
    ]
  );

  const fresh = await row<PilotGapRow>(
    "SELECT * FROM pilot_gaps WHERE id = ?",
    [id]
  );
  return fresh ? parseGap(fresh) : null;
}

export async function deletePilotGap(id: string): Promise<void> {
  await run("DELETE FROM pilot_gaps WHERE id = ?", [id]);
}

/* ---------- Standalone pilot tasks ---------- */

export async function getAllPilotTasks(): Promise<PilotTask[]> {
  const raw = await rows<PilotTaskRow>(
    "SELECT * FROM pilot_tasks ORDER BY created_at ASC"
  );
  return raw.map(parseTask);
}

export async function createPilotTask(
  title: string,
  initiativeId: string | null,
  owner: string | null
): Promise<PilotTask> {
  const id = genId("tsk");
  const now = Date.now();
  await run(
    `INSERT INTO pilot_tasks
       (id, initiative_id, title, owner, status, due_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', NULL, NULL, ?, ?)`,
    [id, initiativeId, title, owner, now, now]
  );
  const fresh = await row<PilotTaskRow>(
    "SELECT * FROM pilot_tasks WHERE id = ?",
    [id]
  );
  return parseTask(fresh!);
}

export async function updatePilotTask(
  id: string,
  patch: PilotTaskPatch
): Promise<PilotTask | null> {
  const existing = await row<PilotTaskRow>(
    "SELECT * FROM pilot_tasks WHERE id = ?",
    [id]
  );
  if (!existing) return null;

  const next = {
    title: patch.title ?? existing.title,
    initiative_id:
      patch.initiativeId === undefined
        ? existing.initiative_id
        : patch.initiativeId,
    owner: patch.owner === undefined ? existing.owner : patch.owner,
    status: patch.status ?? existing.status,
    due_date: patch.dueDate ?? existing.due_date ?? "",
    notes: patch.notes ?? existing.notes ?? "",
    updated_at: Date.now(),
  };

  await run(
    `UPDATE pilot_tasks
       SET title = ?, initiative_id = ?, owner = ?, status = ?, due_date = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.title,
      next.initiative_id,
      next.owner,
      next.status,
      next.due_date,
      next.notes,
      next.updated_at,
      id,
    ]
  );

  const fresh = await row<PilotTaskRow>(
    "SELECT * FROM pilot_tasks WHERE id = ?",
    [id]
  );
  return fresh ? parseTask(fresh) : null;
}

export async function deletePilotTask(id: string): Promise<void> {
  await run("DELETE FROM pilot_tasks WHERE id = ?", [id]);
}
