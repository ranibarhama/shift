import { NextResponse } from "next/server";
import {
  deletePilotInitiative,
  updatePilotInitiative,
} from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";
import type { PilotInitiativePatch } from "@/lib/pilotBoard";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const patch: PilotInitiativePatch = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.selected === "boolean") patch.selected = body.selected;

  const initiative = await updatePilotInitiative(id, patch);
  if (!initiative) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ initiative });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await deletePilotInitiative(id);
  return NextResponse.json({ ok: true });
}
