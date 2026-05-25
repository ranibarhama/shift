/**
 * One-off script to initialize the Turso production database with the schema
 * and seed data. Reads credentials from .env.turso so it doesn't accidentally
 * interfere with Next.js local-dev env loading.
 *
 *   npm run init-turso
 *
 * Idempotent: schema uses CREATE TABLE IF NOT EXISTS, seed only runs when the
 * processes table is empty.
 */
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

function loadEnv(file: string) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnv(".env.turso");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error(
    "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Put them in .env.turso."
  );
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
  console.log("→ Connecting to", url);

  console.log("→ Creating schema");
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
      owner_role TEXT,
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

  console.log("→ Checking if seed needed");
  const count = await db.execute("SELECT COUNT(*) AS c FROM processes");
  const c = Number(count.rows[0]?.c ?? 0);
  if (c > 0) {
    console.log(`  ✓ DB already has ${c} processes — skipping seed.`);
    process.exit(0);
  }

  console.log("→ Seeding initial main process + empty department workflows");
  const now = Date.now();

  await db.execute({
    sql: "INSERT INTO processes (id, type, department_role, name, created_at) VALUES (?, 'main', NULL, ?, ?)",
    args: ["main", "Main B2C Workflow", now],
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
      args: [s.id, "main", s.name, s.desc, s.x, s.y, i],
    });
  }
  for (let i = 0; i < mainStages.length - 1; i++) {
    await db.execute({
      sql: "INSERT INTO edges (id, process_id, source_stage_id, target_stage_id) VALUES (?, ?, ?, ?)",
      args: [`e_${i}`, "main", mainStages[i].id, mainStages[i + 1].id],
    });
  }

  const depts = [
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

  console.log("  ✓ Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Init failed", err);
    process.exit(1);
  });
