/**
 * Building blocks — server-only DB queries (see src/lib/buildingBlocks.ts).
 */

import { row, rows, run } from "./db";
import {
  MAX_MEMBER,
  MAX_MISSING,
  MAX_TARGET,
  MAX_TEXT,
  isBlockKey,
  isInputKind,
  parseBlockInput,
  type BlockInput,
  type BlockInputRow,
} from "./buildingBlocks";

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export async function listBlockInputs(): Promise<BlockInput[]> {
  const rs = await rows<BlockInputRow>(
    "SELECT * FROM block_inputs ORDER BY created_at ASC"
  );
  return rs.map(parseBlockInput);
}

export type AddResult = { ok: true; input: BlockInput } | { ok: false; error: string; status: number };

export async function addBlockInput(body: Record<string, unknown>): Promise<AddResult> {
  const { block, kind } = body;
  const member = typeof body.member === "string" ? body.member.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const rawTarget = typeof body.target === "string" ? body.target.trim() : "";

  if (!isBlockKey(block)) return { ok: false, error: "unknown building block", status: 400 };
  if (!isInputKind(kind)) return { ok: false, error: "unknown input type", status: 400 };
  if (!member || member.length > MAX_MEMBER) {
    return { ok: false, error: "pick your name first", status: 400 };
  }
  if (!text || text.length > MAX_TEXT) {
    return { ok: false, error: `write 1–${MAX_TEXT} characters`, status: 400 };
  }

  let target: string | null = null;
  if (kind === "connect") {
    if (!rawTarget || rawTarget.length > MAX_TARGET) {
      return { ok: false, error: "say where it needs to connect", status: 400 };
    }
    if (rawTarget === block) {
      return { ok: false, error: "pick a different block to connect to", status: 400 };
    }
    target = rawTarget;
  }

  if (kind === "missing") {
    const count = await row<{ n: number }>(
      "SELECT COUNT(*) AS n FROM block_inputs WHERE block = ? AND member = ? AND kind = 'missing'",
      [block, member]
    );
    if (Number(count?.n ?? 0) >= MAX_MISSING) {
      return {
        ok: false,
        error: `you already listed your top ${MAX_MISSING} — remove one first`,
        status: 409,
      };
    }
  }

  const id = genId("blk");
  await run(
    `INSERT INTO block_inputs (id, block, member, kind, text, target, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, block, member, kind, text, target, Date.now()]
  );
  const fresh = await row<BlockInputRow>("SELECT * FROM block_inputs WHERE id = ?", [id]);
  return { ok: true, input: parseBlockInput(fresh!) };
}

/** Deletes an entry — only its author (matched by name) can remove it. */
export async function deleteBlockInput(id: string, member: string): Promise<boolean> {
  const existing = await row<BlockInputRow>("SELECT * FROM block_inputs WHERE id = ?", [id]);
  if (!existing || existing.member !== member.trim()) return false;
  await run("DELETE FROM block_inputs WHERE id = ?", [id]);
  return true;
}
