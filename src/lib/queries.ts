import { nanoid } from "nanoid";
import { row, rows, run } from "./db";
import type { ItemKind, TagKey } from "./tags";
import type { RoleKey } from "./roles";

export type ProcessRow = {
  id: string;
  type: "main" | "department";
  department_role: RoleKey | null;
  name: string;
  created_at: number;
};

export type StageRow = {
  id: string;
  process_id: string;
  name: string;
  description: string;
  goal: string;
  x: number;
  y: number;
  tag: TagKey | null;
  owner_role: RoleKey | null;
  connected_main_stage_id: string | null;
  order_index: number;
};

export type CommentRow = {
  id: string;
  stage_id: string;
  author_role: RoleKey | null;
  content: string;
  created_at: number;
};

export type EdgeRow = {
  id: string;
  process_id: string;
  source_stage_id: string;
  target_stage_id: string;
};

export type ItemRow = {
  id: string;
  stage_id: string;
  kind: ItemKind;
  content: string;
  tag: TagKey | null;
  roi: string | null; // 'high' | 'mid' | 'low' — only meaningful for missing items
  horizon: string | null; // 'short' | 'mid' | 'long' — only meaningful for missing items
  author_role: RoleKey | null;
  order_index: number;
  created_at: number;
};

export type ParticipantRow = {
  id: string;
  label: string;
  created_at: number;
};

export type StageParticipantRow = {
  stage_id: string;
  participant_id: string;
  created_at: number;
};

export async function getProcessByKey(key: string): Promise<ProcessRow | null> {
  if (key === "main") {
    return row<ProcessRow>("SELECT * FROM processes WHERE id = 'main'");
  }
  return row<ProcessRow>(
    "SELECT * FROM processes WHERE type = 'department' AND department_role = ? ORDER BY created_at ASC LIMIT 1",
    [key]
  );
}

export async function getProcessById(id: string): Promise<ProcessRow | null> {
  return row<ProcessRow>("SELECT * FROM processes WHERE id = ?", [id]);
}

export async function getProcessesForRole(role: string): Promise<ProcessRow[]> {
  return rows<ProcessRow>(
    "SELECT * FROM processes WHERE type = 'department' AND department_role = ? ORDER BY created_at ASC",
    [role]
  );
}

export async function createDepartmentProcess(role: RoleKey, name: string): Promise<ProcessRow> {
  const id = `dept_${nanoid(8)}`;
  await run(
    "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'department', ?, ?, ?)",
    [id, role, name, Date.now()]
  );
  const created = await getProcessById(id);
  if (!created) throw new Error("Failed to create process");
  return created;
}

export async function updateProcessName(id: string, name: string): Promise<ProcessRow | null> {
  await run("UPDATE processes SET name = ? WHERE id = ?", [name, id]);
  return getProcessById(id);
}

export async function deleteProcess(id: string): Promise<void> {
  await run("DELETE FROM processes WHERE id = ?", [id]);
}

export async function listProcesses(): Promise<ProcessRow[]> {
  return rows<ProcessRow>("SELECT * FROM processes ORDER BY type DESC, name ASC");
}

export async function getStagesForProcess(processId: string): Promise<StageRow[]> {
  return rows<StageRow>(
    "SELECT * FROM stages WHERE process_id = ? ORDER BY order_index ASC, x ASC",
    [processId]
  );
}

export async function getEdgesForProcess(processId: string): Promise<EdgeRow[]> {
  return rows<EdgeRow>("SELECT * FROM edges WHERE process_id = ?", [processId]);
}

export async function getItemsForStages(stageIds: string[]): Promise<ItemRow[]> {
  if (stageIds.length === 0) return [];
  const placeholders = stageIds.map(() => "?").join(",");
  return rows<ItemRow>(
    `SELECT * FROM items WHERE stage_id IN (${placeholders}) ORDER BY order_index ASC, created_at ASC`,
    stageIds
  );
}

export async function getCommentsForStages(stageIds: string[]): Promise<CommentRow[]> {
  if (stageIds.length === 0) return [];
  const placeholders = stageIds.map(() => "?").join(",");
  return rows<CommentRow>(
    `SELECT * FROM comments WHERE stage_id IN (${placeholders}) ORDER BY created_at ASC`,
    stageIds
  );
}

export async function createComment(
  stageId: string,
  content: string,
  authorRole: RoleKey
): Promise<CommentRow> {
  const id = `cmt_${nanoid(8)}`;
  const now = Date.now();
  await run(
    "INSERT INTO comments (id, stage_id, author_role, content, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, stageId, authorRole, content, now]
  );
  const created = await row<CommentRow>("SELECT * FROM comments WHERE id = ?", [id]);
  if (!created) throw new Error("Failed to create comment");
  return created;
}

export async function getComment(id: string): Promise<CommentRow | null> {
  return row<CommentRow>("SELECT * FROM comments WHERE id = ?", [id]);
}

export async function deleteComment(id: string): Promise<void> {
  await run("DELETE FROM comments WHERE id = ?", [id]);
}

export async function createStage(
  processId: string,
  name: string,
  x: number,
  y: number
): Promise<StageRow> {
  const id = `stg_${nanoid(8)}`;
  const orderR = await row<{ next: number }>(
    "SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM stages WHERE process_id = ?",
    [processId]
  );
  const next = Number(orderR?.next ?? 0);
  await run(
    "INSERT INTO stages (id, process_id, name, description, x, y, order_index) VALUES (?, ?, ?, '', ?, ?, ?)",
    [id, processId, name, x, y, next]
  );
  const created = await row<StageRow>("SELECT * FROM stages WHERE id = ?", [id]);
  if (!created) throw new Error("Failed to create stage");
  return created;
}

export async function updateStage(
  id: string,
  patch: Partial<Pick<StageRow, "name" | "description" | "goal" | "x" | "y" | "tag" | "owner_role" | "connected_main_stage_id">>
): Promise<StageRow | null> {
  const fields: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    vals.push(v as string | number | null);
  }
  if (!fields.length) return row<StageRow>("SELECT * FROM stages WHERE id = ?", [id]);
  vals.push(id);
  await run(`UPDATE stages SET ${fields.join(", ")} WHERE id = ?`, vals);
  return row<StageRow>("SELECT * FROM stages WHERE id = ?", [id]);
}

export async function deleteStage(id: string): Promise<void> {
  await run("DELETE FROM stages WHERE id = ?", [id]);
}

export async function createEdge(
  processId: string,
  source: string,
  target: string
): Promise<EdgeRow> {
  const existing = await row<EdgeRow>(
    "SELECT * FROM edges WHERE process_id = ? AND source_stage_id = ? AND target_stage_id = ?",
    [processId, source, target]
  );
  if (existing) return existing;
  const id = `edg_${nanoid(8)}`;
  await run(
    "INSERT INTO edges (id, process_id, source_stage_id, target_stage_id) VALUES (?, ?, ?, ?)",
    [id, processId, source, target]
  );
  const created = await row<EdgeRow>("SELECT * FROM edges WHERE id = ?", [id]);
  if (!created) throw new Error("Failed to create edge");
  return created;
}

export async function deleteEdge(id: string): Promise<void> {
  await run("DELETE FROM edges WHERE id = ?", [id]);
}

export async function createItem(
  stageId: string,
  kind: ItemKind,
  content: string,
  authorRole: RoleKey | null,
  initialTag: string | null = null
): Promise<ItemRow> {
  const id = `itm_${nanoid(8)}`;
  const orderR = await row<{ next: number }>(
    "SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM items WHERE stage_id = ? AND kind = ?",
    [stageId, kind]
  );
  const next = Number(orderR?.next ?? 0);
  await run(
    "INSERT INTO items (id, stage_id, kind, content, tag, author_role, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, stageId, kind, content, initialTag, authorRole, next, Date.now()]
  );
  const created = await row<ItemRow>("SELECT * FROM items WHERE id = ?", [id]);
  if (!created) throw new Error("Failed to create item");
  return created;
}

export async function updateItem(
  id: string,
  patch: Partial<Pick<ItemRow, "content" | "tag" | "roi" | "horizon">>
): Promise<ItemRow | null> {
  const fields: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    vals.push(v as string | number | null);
  }
  if (!fields.length) return row<ItemRow>("SELECT * FROM items WHERE id = ?", [id]);
  vals.push(id);
  await run(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`, vals);
  return row<ItemRow>("SELECT * FROM items WHERE id = ?", [id]);
}

export async function deleteItem(id: string): Promise<void> {
  await run("DELETE FROM items WHERE id = ?", [id]);
}

/* ---------- Participants (global dictionary) ---------- */

export async function listParticipants(): Promise<ParticipantRow[]> {
  return rows<ParticipantRow>("SELECT * FROM participants ORDER BY label COLLATE NOCASE ASC");
}

export async function createParticipant(label: string): Promise<ParticipantRow> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Empty label");
  // Idempotent: if a participant with this label already exists, return it
  const existing = await row<ParticipantRow>(
    "SELECT * FROM participants WHERE label = ? COLLATE NOCASE",
    [trimmed]
  );
  if (existing) return existing;
  const id = `prt_${nanoid(8)}`;
  await run(
    "INSERT INTO participants (id, label, created_at) VALUES (?, ?, ?)",
    [id, trimmed, Date.now()]
  );
  const created = await row<ParticipantRow>("SELECT * FROM participants WHERE id = ?", [id]);
  if (!created) throw new Error("Failed to create participant");
  return created;
}

export async function deleteParticipant(id: string): Promise<void> {
  await run("DELETE FROM participants WHERE id = ?", [id]);
}

export async function getStageParticipants(stageIds: string[]): Promise<StageParticipantRow[]> {
  if (stageIds.length === 0) return [];
  const placeholders = stageIds.map(() => "?").join(",");
  return rows<StageParticipantRow>(
    `SELECT * FROM stage_participants WHERE stage_id IN (${placeholders})`,
    stageIds
  );
}

export async function linkParticipant(stageId: string, participantId: string): Promise<void> {
  await run(
    "INSERT OR IGNORE INTO stage_participants (stage_id, participant_id, created_at) VALUES (?, ?, ?)",
    [stageId, participantId, Date.now()]
  );
}

export async function unlinkParticipant(stageId: string, participantId: string): Promise<void> {
  await run(
    "DELETE FROM stage_participants WHERE stage_id = ? AND participant_id = ?",
    [stageId, participantId]
  );
}

export async function getStage(id: string): Promise<StageRow | null> {
  return row<StageRow>("SELECT * FROM stages WHERE id = ?", [id]);
}

export async function getMainStages(): Promise<StageRow[]> {
  return rows<StageRow>(
    "SELECT * FROM stages WHERE process_id = 'main' ORDER BY order_index ASC, x ASC"
  );
}

/* -------- Aggregations for Backlog / Hit List -------- */

export type MissingItemRow = {
  id: string;
  content: string;
  category: string | null;
  roi: string | null;
  horizon: string | null;
  author_role: string | null;
  created_at: number;
  stage_id: string;
  stage_name: string;
  process_id: string;
  process_type: "main" | "department";
  process_name: string;
  department_role: string | null;
};

export async function getAllMissingItems(): Promise<MissingItemRow[]> {
  return rows<MissingItemRow>(
    `SELECT
       i.id            AS id,
       i.content       AS content,
       i.tag           AS category,
       i.roi           AS roi,
       i.horizon       AS horizon,
       i.author_role   AS author_role,
       i.created_at    AS created_at,
       s.id            AS stage_id,
       s.name          AS stage_name,
       p.id            AS process_id,
       p.type          AS process_type,
       p.name          AS process_name,
       p.department_role AS department_role
     FROM items i
     JOIN stages s ON i.stage_id = s.id
     JOIN processes p ON s.process_id = p.id
     WHERE i.kind = 'missing'
     ORDER BY i.created_at DESC`
  );
}

export type DropRow = {
  row_type: "stage" | "item";
  id: string;
  content: string;
  kind: string | null;
  author_role: string | null;
  created_at: number | null;
  stage_id: string;
  stage_name: string;
  process_id: string;
  process_type: "main" | "department";
  process_name: string;
  department_role: string | null;
};

export async function getAllDropItems(): Promise<DropRow[]> {
  return rows<DropRow>(
    `SELECT
       'stage' AS row_type,
       s.id           AS id,
       s.name         AS content,
       NULL           AS kind,
       NULL           AS author_role,
       NULL           AS created_at,
       s.id           AS stage_id,
       s.name         AS stage_name,
       p.id           AS process_id,
       p.type         AS process_type,
       p.name         AS process_name,
       p.department_role AS department_role
     FROM stages s
     JOIN processes p ON s.process_id = p.id
     WHERE s.tag = 'drop'

     UNION ALL

     SELECT
       'item'         AS row_type,
       i.id           AS id,
       i.content      AS content,
       i.kind         AS kind,
       i.author_role  AS author_role,
       i.created_at   AS created_at,
       s.id           AS stage_id,
       s.name         AS stage_name,
       p.id           AS process_id,
       p.type         AS process_type,
       p.name         AS process_name,
       p.department_role AS department_role
     FROM items i
     JOIN stages s ON i.stage_id = s.id
     JOIN processes p ON s.process_id = p.id
     WHERE i.tag = 'drop' AND i.kind <> 'missing'

     ORDER BY created_at DESC`
  );
}
