import { createClient, type Client, type InValue } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

/**
 * Database client.
 *
 * In production (Vercel) we use a remote Turso database via:
 *   - TURSO_DATABASE_URL (libsql://…)
 *   - TURSO_AUTH_TOKEN
 *
 * In local dev (no env vars) we fall back to a local libsql file at data/shift.db
 * so devs can hack without touching production data.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "shift.db");

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function buildClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && url.trim()) {
    return createClient({ url, authToken });
  }

  // Local fallback — file-backed libsql
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return createClient({ url: `file:${LOCAL_DB_PATH}` });
}

/** Returns the libsql client and ensures schema + seed have run (once per process). */
export async function getDb(): Promise<Client> {
  if (!_client) _client = buildClient();
  if (!_initPromise) {
    _initPromise = ensureSchema(_client).then(() => seedIfEmpty(_client!));
  }
  await _initPromise;
  return _client;
}

/* -------------------- query helpers -------------------- */

/**
 * Convert a libsql Row (which has a custom prototype) into a plain JS object
 * so it can safely cross Server → Client component boundaries in Next 15.
 */
function plain<T>(r: unknown): T {
  return Object.fromEntries(Object.entries(r as Record<string, unknown>)) as T;
}

export async function row<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = []
): Promise<T | null> {
  const db = await getDb();
  const r = await db.execute({ sql, args });
  return r.rows[0] ? plain<T>(r.rows[0]) : null;
}

export async function rows<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = []
): Promise<T[]> {
  const db = await getDb();
  const r = await db.execute({ sql, args });
  return r.rows.map((row) => plain<T>(row));
}

export async function run(sql: string, args: InValue[] = []): Promise<void> {
  const db = await getDb();
  await db.execute({ sql, args });
}

/* -------------------- schema + seed -------------------- */

async function ensureSchema(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS processes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('main','department')),
      department_role TEXT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stages (
      id TEXT PRIMARY KEY,
      process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      tag TEXT,
      connected_main_stage_id TEXT REFERENCES stages(id) ON DELETE SET NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
      source_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      target_stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('participant','task','pain_point','missing')),
      content TEXT NOT NULL,
      tag TEXT,
      author_role TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stages_process ON stages(process_id);
    CREATE INDEX IF NOT EXISTS idx_edges_process ON edges(process_id);
    CREATE INDEX IF NOT EXISTS idx_items_stage ON items(stage_id);
  `);

  // Migration: if items.kind CHECK is the old 3-value version, rebuild the table.
  const tableSql = await db.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='items'"
  );
  const sql = (tableSql.rows[0]?.sql as string | undefined) ?? "";
  if (sql && !sql.includes("'missing'")) {
    await db.executeMultiple(`
      BEGIN;
      CREATE TABLE items_new (
        id TEXT PRIMARY KEY,
        stage_id TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('participant','task','pain_point','missing')),
        content TEXT NOT NULL,
        tag TEXT,
        author_role TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      INSERT INTO items_new (id, stage_id, kind, content, tag, author_role, order_index, created_at)
        SELECT id, stage_id, kind, content, tag, author_role, order_index, created_at FROM items;
      DROP TABLE items;
      ALTER TABLE items_new RENAME TO items;
      CREATE INDEX IF NOT EXISTS idx_items_stage ON items(stage_id);
      COMMIT;
    `);
  }
}

async function seedIfEmpty(db: Client) {
  const countR = await db.execute("SELECT COUNT(*) AS c FROM processes");
  const c = Number(countR.rows[0]?.c ?? 0);
  if (c > 0) return;

  const now = Date.now();
  const mainId = "main";

  await db.execute({
    sql: "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'main', NULL, ?, ?)",
    args: [mainId, "Main B2C Workflow", now],
  });

  const mainStages = [
    { id: "s_discover", name: "Discover", desc: "Identify the user / market opportunity", x: 80, y: 200 },
    { id: "s_define", name: "Define", desc: "Frame the problem & success metrics", x: 380, y: 200 },
    { id: "s_design", name: "Design", desc: "Concepting, UX, prototypes", x: 680, y: 200 },
    { id: "s_build", name: "Build", desc: "Engineering & content production", x: 980, y: 200 },
    { id: "s_launch", name: "Launch", desc: "Go-to-market & rollout", x: 1280, y: 200 },
    { id: "s_measure", name: "Measure & Iterate", desc: "Analytics, learn, adjust", x: 1580, y: 200 },
  ];

  for (let i = 0; i < mainStages.length; i++) {
    const s = mainStages[i];
    await db.execute({
      sql: "INSERT INTO stages (id, process_id, name, description, x, y, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [s.id, mainId, s.name, s.desc, s.x, s.y, i],
    });
  }

  for (let i = 0; i < mainStages.length - 1; i++) {
    await db.execute({
      sql: "INSERT INTO edges (id, process_id, source_stage_id, target_stage_id) VALUES (?, ?, ?, ?)",
      args: [`e_${i}`, mainId, mainStages[i].id, mainStages[i + 1].id],
    });
  }

  const depts: Array<{ role: string; name: string }> = [
    { role: "ux", name: "UX Workflow" },
    { role: "marketing", name: "Marketing Workflow" },
    { role: "product", name: "Product Workflow" },
    { role: "ops", name: "Ops Workflow" },
    { role: "analyst", name: "Analytics Workflow" },
  ];
  for (const d of depts) {
    await db.execute({
      sql: "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'department', ?, ?, ?)",
      args: [`dept_${d.role}`, d.role, d.name, now],
    });
  }
}
