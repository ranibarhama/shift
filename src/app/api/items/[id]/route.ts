import { NextResponse } from "next/server";
import { deleteItem, updateItem } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("content" in body) patch.content = body.content;
  if ("tag" in body) patch.tag = body.tag;
  const item = updateItem(id, patch);
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  deleteItem(id);
  return NextResponse.json({ ok: true });
}
