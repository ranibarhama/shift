/**
 * Building blocks — server-only DB queries (see src/lib/buildingBlocks.ts).
 */

import { row, rows, run } from "./db";
import {
  MAX_MEMBER,
  MAX_MISSING,
  MAX_TARGET,
  MAX_TARGETS,
  MAX_TEXT,
  isBlockKey,
  isCategoryKey,
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
  const { block, kind, category } = body;
  const member = typeof body.member === "string" ? body.member.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  // Where it needs to connect: `targets` (list), or the legacy single `target`.
  const rawTargets: unknown[] = Array.isArray(body.targets)
    ? body.targets
    : typeof body.target === "string"
      ? [body.target]
      : [];
  let targets = [
    ...new Set(
      rawTargets
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim())
        .filter(Boolean)
    ),
  ];
  let unsure = body.unsure === true;

  if (!isBlockKey(block)) return { ok: false, error: "unknown stage", status: 400 };
  if (!isInputKind(kind)) return { ok: false, error: "unknown input type", status: 400 };
  if (!member || member.length > MAX_MEMBER) {
    return { ok: false, error: "pick your name first", status: 400 };
  }
  if (!text || text.length > MAX_TEXT) {
    return { ok: false, error: `write 1–${MAX_TEXT} characters`, status: 400 };
  }
  if (!isCategoryKey(category)) {
    return {
      ok: false,
      error: "pick a category: system, tool, process or infrastructure",
      status: 400,
    };
  }

  if (kind === "have") {
    targets = [];
    unsure = false;
  } else {
    if (targets.some((t) => t.length > MAX_TARGET)) {
      return { ok: false, error: `keep each place under ${MAX_TARGET} characters`, status: 400 };
    }
    if (targets.length > MAX_TARGETS) {
      return { ok: false, error: `pick up to ${MAX_TARGETS} places`, status: 400 };
    }
    if (targets.includes(block)) {
      return { ok: false, error: "pick a different stage to connect to", status: 400 };
    }
    if (kind === "connect") {
      unsure = false;
      if (targets.length === 0) {
        return { ok: false, error: "say where it needs to connect", status: 400 };
      }
    } else {
      // missing: places, or "I'm not sure" — exactly one of the two.
      if (unsure && targets.length > 0) {
        return { ok: false, error: "choose places or “I'm not sure”, not both", status: 400 };
      }
      if (!unsure && targets.length === 0) {
        return {
          ok: false,
          error: "say where it should connect, or choose “I'm not sure”",
          status: 400,
        };
      }
    }
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
    `INSERT INTO block_inputs
       (id, block, member, kind, text, target, targets, unsure, category, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
      id,
      block,
      member,
      kind,
      text,
      targets.length ? JSON.stringify(targets) : null,
      unsure ? 1 : 0,
      category,
      Date.now(),
    ]
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
