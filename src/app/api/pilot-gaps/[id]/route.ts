import { NextResponse } from "next/server";
import { deletePilotGap, updatePilotGap } from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";
import {
  GAP_STATUSES,
  GAP_TYPES,
  type GapStatus,
  type GapType,
  type PilotGapPatch,
} from "@/lib/pilotBoard";
import { LEADER_NAMES } from "@/lib/stoneBriefs";

const TYPE_SET = new Set<string>(GAP_TYPES.map((t) => t.key));
const STATUS_SET = new Set<string>(GAP_STATUSES.map((s) => s.key));
const OWNER_SET = new Set<string>(LEADER_NAMES);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const patch: PilotGapPatch = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.type === "string" && TYPE_SET.has(body.type)) {
    patch.type = body.type as GapType;
  }
  if (typeof body.typeOther === "string") patch.typeOther = body.typeOther;
  if (body.owner === null) {
    patch.owner = null;
  } else if (typeof body.owner === "string" && OWNER_SET.has(body.owner)) {
    patch.owner = body.owner;
  }
  if (typeof body.status === "string" && STATUS_SET.has(body.status)) {
    patch.status = body.status as GapStatus;
  }
  if (typeof body.notes === "string") patch.notes = body.notes;

  const gap = await updatePilotGap(id, patch);
  if (!gap) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ gap });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await deletePilotGap(id);
  return NextResponse.json({ ok: true });
}
