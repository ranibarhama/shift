/**
 * One-off cleanup script — removes artifacts created during testing.
 *
 *   DRY_RUN=1 npx tsx scripts/cleanup-smoke.ts   # preview only
 *   npx tsx scripts/cleanup-smoke.ts             # actually delete
 *
 * Targets only obviously-test data (anything with "smoke" or starting with
 * "demo "); leaves real content alone.
 */
import { createClient, type Client } from "@libsql/client";
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
  console.error("Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN in .env.turso");
  process.exit(1);
}

const dry = process.env.DRY_RUN === "1";
const db: Client = createClient({ url, authToken });

async function main() {
  console.log(`Connected to ${url} ${dry ? "(DRY RUN — nothing will be deleted)" : ""}\n`);

  // 1. Items: anything with "smoke" or starts with "demo "
  const items = await db.execute(
    "SELECT id, kind, content FROM items WHERE LOWER(content) LIKE '%smoke%' OR LOWER(content) LIKE 'demo %'"
  );
  console.log(`Items to remove: ${items.rows.length}`);
  for (const r of items.rows) {
    const row = r as unknown as { id: string; kind: string; content: string };
    console.log(`  - [${row.kind}] ${row.content}`);
  }

  // 2. Participants: anything with "smoke" in label
  const parts = await db.execute(
    "SELECT id, label FROM participants WHERE LOWER(label) LIKE '%smoke%'"
  );
  console.log(`\nParticipants to remove: ${parts.rows.length}`);
  for (const r of parts.rows) {
    const row = r as unknown as { id: string; label: string };
    console.log(`  - ${row.label}`);
  }

  // 3. Comments: the two specific test ones I added
  const testCommentTexts = [
    "Should we split discovery into qualitative + quantitative?",
    "Good idea — let me draft a proposal",
  ];
  const placeholders = testCommentTexts.map(() => "?").join(",");
  const comments = await db.execute({
    sql: `SELECT id, content FROM comments WHERE content IN (${placeholders})`,
    args: testCommentTexts,
  });
  console.log(`\nComments to remove: ${comments.rows.length}`);
  for (const r of comments.rows) {
    const row = r as unknown as { id: string; content: string };
    console.log(`  - "${row.content}"`);
  }

  // 4. Stage-level drop tag on the main "Discover" stage I set for hit-list testing
  // Only clear if the stage is still tagged 'drop' AND it's the main process stage I touched
  const discoverDrop = await db.execute(
    "SELECT id, name, tag FROM stages WHERE id = 's_discover' AND tag = 'drop'"
  );
  console.log(`\nStage tags to clear: ${discoverDrop.rows.length}`);
  for (const r of discoverDrop.rows) {
    const row = r as unknown as { id: string; name: string; tag: string };
    console.log(`  - ${row.name} (tag=${row.tag} → null)`);
  }

  // 5. Owner_role on main "Discover" stage set to 'product' for testing
  const discoverOwner = await db.execute(
    "SELECT id, name, owner_role FROM stages WHERE id = 's_discover' AND owner_role IS NOT NULL"
  );
  console.log(`\nStage owners to clear: ${discoverOwner.rows.length}`);
  for (const r of discoverOwner.rows) {
    const row = r as unknown as { id: string; name: string; owner_role: string };
    console.log(`  - ${row.name} (owner=${row.owner_role} → null)`);
  }

  // 6. Goal set on main "Discover" for testing
  const discoverGoal = await db.execute(
    "SELECT id, name, goal FROM stages WHERE id = 's_discover' AND goal LIKE 'Reach 10k MQLs%'"
  );
  console.log(`\nStage goals to clear: ${discoverGoal.rows.length}`);
  for (const r of discoverGoal.rows) {
    const row = r as unknown as { id: string; name: string; goal: string };
    console.log(`  - ${row.name} (goal="${row.goal}" → "")`);
  }

  if (dry) {
    console.log("\n[DRY RUN] No changes made. Re-run without DRY_RUN=1 to apply.");
    process.exit(0);
  }

  console.log("\nApplying deletes…");

  for (const r of items.rows) {
    const row = r as unknown as { id: string };
    await db.execute({ sql: "DELETE FROM items WHERE id = ?", args: [row.id] });
  }
  for (const r of parts.rows) {
    const row = r as unknown as { id: string };
    await db.execute({ sql: "DELETE FROM participants WHERE id = ?", args: [row.id] });
  }
  for (const r of comments.rows) {
    const row = r as unknown as { id: string };
    await db.execute({ sql: "DELETE FROM comments WHERE id = ?", args: [row.id] });
  }
  if (discoverDrop.rows.length) {
    await db.execute("UPDATE stages SET tag = NULL WHERE id = 's_discover' AND tag = 'drop'");
  }
  if (discoverOwner.rows.length) {
    await db.execute("UPDATE stages SET owner_role = NULL WHERE id = 's_discover'");
  }
  if (discoverGoal.rows.length) {
    await db.execute("UPDATE stages SET goal = '' WHERE id = 's_discover' AND goal LIKE 'Reach 10k MQLs%'");
  }

  console.log("\n✓ Cleanup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Cleanup failed", err);
    process.exit(1);
  });
