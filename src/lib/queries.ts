import { nanoid } from "nanoid";
import { getDb } from "./db";
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
  x: number;
  y: number;
  tag: TagKey | null;
  connected_main_stage_id: string | null;
  order_index: number;
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
  author_role: RoleKey | null;
  order_index: number;
  created_at: number;
};

export function getProcessByKey(key: string): ProcessRow | null {
  const db = getDb();
  if (key === "main") {
    return db.prepare("SELECT * FROM processes WHERE id = 'main'").get() as ProcessRow | null;
  }
  // Department lookup by role returns the first workflow (legacy callers).
  // Prefer getProcessesForRole / getProcessById for new code.
  return db
    .prepare(
      "SELECT * FROM processes WHERE type = 'department' AND department_role = ? ORDER BY created_at ASC LIMIT 1"
    )
    .get(key) as ProcessRow | null;
}

export function getProcessById(id: string): ProcessRow | null {
  return getDb().prepare("SELECT * FROM processes WHERE id = ?").get(id) as ProcessRow | null;
}

export function getProcessesForRole(role: string): ProcessRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM processes WHERE type = 'department' AND department_role = ? ORDER BY created_at ASC"
    )
    .all(role) as ProcessRow[];
}

export function createDepartmentProcess(role: RoleKey, name: string): ProcessRow {
  const db = getDb();
  const id = `dept_${nanoid(8)}`;
  db.prepare(
    "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'department', ?, ?, ?)"
  ).run(id, role, name, Date.now());
  return getProcessById(id)!;
}

export function updateProcessName(id: string, name: string): ProcessRow | null {
  getDb().prepare("UPDATE processes SET name = ? WHERE id = ?").run(name, id);
  return getProcessById(id);
}

export function deleteProcess(id: string) {
  getDb().prepare("DELETE FROM processes WHERE id = ?").run(id);
}

export function listProcesses(): ProcessRow[] {
  return getDb().prepare("SELECT * FROM processes ORDER BY type DESC, name ASC").all() as ProcessRow[];
}

export function getStagesForProcess(processId: string): StageRow[] {
  return getDb()
    .prepare("SELECT * FROM stages WHERE process_id = ? ORDER BY order_index ASC, x ASC")
    .all(processId) as StageRow[];
}

export function getEdgesForProcess(processId: string): EdgeRow[] {
  return getDb().prepare("SELECT * FROM edges WHERE process_id = ?").all(processId) as EdgeRow[];
}

export function getItemsForStages(stageIds: string[]): ItemRow[] {
  if (stageIds.length === 0) return [];
  const placeholders = stageIds.map(() => "?").join(",");
  return getDb()
    .prepare(`SELECT * FROM items WHERE stage_id IN (${placeholders}) ORDER BY order_index ASC, created_at ASC`)
    .all(...stageIds) as ItemRow[];
}

export function createStage(processId: string, name: string, x: number, y: number): StageRow {
  const db = getDb();
  const id = `stg_${nanoid(8)}`;
  const orderRow = db
    .prepare("SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM stages WHERE process_id = ?")
    .get(processId) as { next: number };
  db.prepare(
    "INSERT INTO stages (id, process_id, name, description, x, y, order_index) VALUES (?, ?, ?, '', ?, ?, ?)"
  ).run(id, processId, name, x, y, orderRow.next);
  return db.prepare("SELECT * FROM stages WHERE id = ?").get(id) as StageRow;
}

export function updateStage(
  id: string,
  patch: Partial<Pick<StageRow, "name" | "description" | "x" | "y" | "tag" | "connected_main_stage_id">>
): StageRow | null {
  const db = getDb();
  const fields: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    vals.push(v);
  }
  if (!fields.length) return db.prepare("SELECT * FROM stages WHERE id = ?").get(id) as StageRow;
  vals.push(id);
  db.prepare(`UPDATE stages SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
  return db.prepare("SELECT * FROM stages WHERE id = ?").get(id) as StageRow | null;
}

export function deleteStage(id: string) {
  getDb().prepare("DELETE FROM stages WHERE id = ?").run(id);
}

export function createEdge(processId: string, source: string, target: string): EdgeRow {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM edges WHERE process_id = ? AND source_stage_id = ? AND target_stage_id = ?")
    .get(processId, source, target) as EdgeRow | undefined;
  if (existing) return existing;
  const id = `edg_${nanoid(8)}`;
  db.prepare(
    "INSERT INTO edges (id, process_id, source_stage_id, target_stage_id) VALUES (?, ?, ?, ?)"
  ).run(id, processId, source, target);
  return db.prepare("SELECT * FROM edges WHERE id = ?").get(id) as EdgeRow;
}

export function deleteEdge(id: string) {
  getDb().prepare("DELETE FROM edges WHERE id = ?").run(id);
}

export function createItem(
  stageId: string,
  kind: ItemKind,
  content: string,
  authorRole: RoleKey | null,
  initialTag: string | null = null
): ItemRow {
  const db = getDb();
  const id = `itm_${nanoid(8)}`;
  const orderRow = db
    .prepare(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM items WHERE stage_id = ? AND kind = ?"
    )
    .get(stageId, kind) as { next: number };
  db.prepare(
    "INSERT INTO items (id, stage_id, kind, content, tag, author_role, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, stageId, kind, content, initialTag, authorRole, orderRow.next, Date.now());
  return db.prepare("SELECT * FROM items WHERE id = ?").get(id) as ItemRow;
}

export function updateItem(id: string, patch: Partial<Pick<ItemRow, "content" | "tag">>): ItemRow | null {
  const db = getDb();
  const fields: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    vals.push(v);
  }
  if (!fields.length) return db.prepare("SELECT * FROM items WHERE id = ?").get(id) as ItemRow;
  vals.push(id);
  db.prepare(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
  return db.prepare("SELECT * FROM items WHERE id = ?").get(id) as ItemRow | null;
}

export function deleteItem(id: string) {
  getDb().prepare("DELETE FROM items WHERE id = ?").run(id);
}

export function getStage(id: string): StageRow | null {
  return getDb().prepare("SELECT * FROM stages WHERE id = ?").get(id) as StageRow | null;
}

export function getMainStages(): StageRow[] {
  return getDb()
    .prepare("SELECT * FROM stages WHERE process_id = 'main' ORDER BY order_index ASC, x ASC")
    .all() as StageRow[];
}

export type MissingItemRow = {
  id: string;
  content: string;
  category: string | null; // 'tool' | 'infrastructure' | 'workflow' | null
  author_role: string | null;
  created_at: number;
  stage_id: string;
  stage_name: string;
  process_id: string;
  process_type: "main" | "department";
  process_name: string;
  department_role: string | null;
};

export type DropRow = {
  row_type: "stage" | "item";
  id: string;
  content: string;
  kind: string | null; // item kind, null for stages
  author_role: string | null;
  created_at: number | null;
  stage_id: string;
  stage_name: string;
  process_id: string;
  process_type: "main" | "department";
  process_name: string;
  department_role: string | null;
};

export function getAllDropItems(): DropRow[] {
  return getDb()
    .prepare(
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

       ORDER BY created_at DESC NULLS LAST`
    )
    .all() as DropRow[];
}

export function getAllMissingItems(): MissingItemRow[] {
  return getDb()
    .prepare(
      `SELECT
         i.id            AS id,
         i.content       AS content,
         i.tag           AS category,
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
    )
    .all() as MissingItemRow[];
}
