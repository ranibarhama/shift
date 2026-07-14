import { NextResponse } from "next/server";
import { deletePilotTask, updatePilotTask } from "@/lib/pilotBoardDb";
import {
  GAP_STATUSES,
  type GapStatus,
  type PilotTaskPatch,
} from "@/lib/pilotBoard";
import { LEADER_NAMES } from "@/lib/stoneBriefs";

const STATUS_SET = new Set<string>(GAP_STATUSES.map((s) => s.key));
const OWNER_SET = new Set<string>(LEADER_NAMES);

// Public route: the Pilot Tracker is shareable by link, so task edits
// don't require a signed-in role.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const patch: PilotTaskPatch = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (body.initiativeId === null) {
    patch.initiativeId = null;
  } else if (typeof body.initiativeId === "string") {
    patch.initiativeId = body.initiativeId;
  }
  if (body.owner === null) {
    patch.owner = null;
  } else if (typeof body.owner === "string" && OWNER_SET.has(body.owner)) {
    patch.owner = body.owner;
  }
  if (typeof body.status === "string" && STATUS_SET.has(body.status)) {
    patch.status = body.status as GapStatus;
  }
  if (typeof body.dueDate === "string") patch.dueDate = body.dueDate;
  if (typeof body.notes === "string") patch.notes = body.notes;

  const task = await updatePilotTask(id, patch);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await deletePilotTask(id);
  return NextResponse.json({ ok: true });
}
