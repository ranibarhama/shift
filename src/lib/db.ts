import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shift.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  seedIfEmpty(db);
  _db = db;
  return db;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
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

  // Migration: if items table was created with the old CHECK constraint, rebuild it
  const tableSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='items'")
    .get() as { sql: string } | undefined;
  if (tableSql && !tableSql.sql.includes("'missing'")) {
    db.exec(`
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

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM processes").get() as { c: number };
  if (count.c > 0) return;

  const now = Date.now();
  const mainId = "main";
  db.prepare(
    "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'main', NULL, ?, ?)"
  ).run(mainId, "Main B2C Workflow", now);

  // Seed main stages as a starting skeleton — the user will edit these
  const mainStages = [
    { id: "s_discover", name: "Discover", desc: "Identify the user / market opportunity", x: 80, y: 200 },
    { id: "s_define", name: "Define", desc: "Frame the problem & success metrics", x: 380, y: 200 },
    { id: "s_design", name: "Design", desc: "Concepting, UX, prototypes", x: 680, y: 200 },
    { id: "s_build", name: "Build", desc: "Engineering & content production", x: 980, y: 200 },
    { id: "s_launch", name: "Launch", desc: "Go-to-market & rollout", x: 1280, y: 200 },
    { id: "s_measure", name: "Measure & Iterate", desc: "Analytics, learn, adjust", x: 1580, y: 200 },
  ];

  const insertStage = db.prepare(
    "INSERT INTO stages (id, process_id, name, description, x, y, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  mainStages.forEach((s, i) => insertStage.run(s.id, mainId, s.name, s.desc, s.x, s.y, i));

  const insertEdge = db.prepare(
    "INSERT INTO edges (id, process_id, source_stage_id, target_stage_id) VALUES (?, ?, ?, ?)"
  );
  for (let i = 0; i < mainStages.length - 1; i++) {
    insertEdge.run(`e_${i}`, mainId, mainStages[i].id, mainStages[i + 1].id);
  }

  // Create one process per department, empty
  const depts: Array<{ role: string; name: string }> = [
    { role: "ux", name: "UX Workflow" },
    { role: "marketing", name: "Marketing Workflow" },
    { role: "product", name: "Product Workflow" },
    { role: "ops", name: "Ops Workflow" },
    { role: "analyst", name: "Analytics Workflow" },
  ];
  const insertProc = db.prepare(
    "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'department', ?, ?, ?)"
  );
  depts.forEach((d) => insertProc.run(`dept_${d.role}`, d.role, d.name, now));
}
