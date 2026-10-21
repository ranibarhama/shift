import { NextResponse } from "next/server";
import { deleteBlockInput } from "@/lib/buildingBlocksDb";

// Public route, but an entry can only be removed by the member who added it.
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { member?: unknown };
  const member = typeof body.member === "string" ? body.member : "";
  const ok = await deleteBlockInput(id, member);
  if (!ok) {
    return NextResponse.json({ error: "not found or not yours" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
