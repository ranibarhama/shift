/**
 * Stone briefs — server-only DB queries.
 *
 * Kept separate from src/lib/stoneBriefs.ts (types + constants only) so the
 * shared types can be pulled into a client component without dragging
 * node:fs (via ./db) into the client bundle.
 */

import { row, rows, run } from "./db";
import {
  emptyBrief,
  parseBrief,
  type StoneBrief,
  type StoneBriefPatch,
  type StoneBriefRow,
} from "./stoneBriefs";

export async function getAllStoneBriefs(): Promise<StoneBrief[]> {
  const raw = await rows<StoneBriefRow>("SELECT * FROM stone_briefs");
  return raw.map(parseBrief);
}

export async function getStoneBrief(stoneKey: string): Promise<StoneBrief | null> {
  const raw = await row<StoneBriefRow>(
    "SELECT * FROM stone_briefs WHERE stone_key = ?",
    [stoneKey]
  );
  return raw ? parseBrief(raw) : null;
}

/**
 * Upsert one stone brief. Reads the existing row, merges the patch on top,
 * and writes it back so partial updates from the UI just touch the fields
 * they care about.
 */
export async function upsertStoneBrief(
  stoneKey: string,
  patch: StoneBriefPatch
): Promise<StoneBrief> {
  const existing = (await getStoneBrief(stoneKey)) ?? emptyBrief(stoneKey);
  const merged: StoneBrief = {
    ...existing,
    leaders: patch.leaders ?? existing.leaders,
    kpis: patch.kpis ?? existing.kpis,
    outcome: patch.outcome ?? existing.outcome,
    pilot: patch.pilot ?? existing.pilot,
    people: patch.people ?? existing.people,
    reviewDate: patch.reviewDate ?? existing.reviewDate,
    updatedAt: Date.now(),
  };

  await run(
    `INSERT INTO stone_briefs
       (stone_key, leaders, kpis, outcome, pilot, people, review_date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(stone_key) DO UPDATE SET
       leaders = excluded.leaders,
       kpis = excluded.kpis,
       outcome = excluded.outcome,
       pilot = excluded.pilot,
       people = excluded.people,
       review_date = excluded.review_date,
       updated_at = excluded.updated_at`,
    [
      stoneKey,
      JSON.stringify(merged.leaders),
      JSON.stringify(merged.kpis),
      merged.outcome,
      merged.pilot,
      merged.people,
      merged.reviewDate,
      merged.updatedAt,
    ]
  );

  return merged;
}
