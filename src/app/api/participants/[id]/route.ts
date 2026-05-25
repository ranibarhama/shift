import { NextResponse } from "next/server";
import { deleteParticipant } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await deleteParticipant(id);
  return NextResponse.json({ ok: true });
}
