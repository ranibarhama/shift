import { NextResponse } from "next/server";
import { deleteComment, getComment } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const c = await getComment(id);
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Only the author or GM can delete a comment
  if (role !== "gm" && c.author_role !== role) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await deleteComment(id);
  return NextResponse.json({ ok: true });
}
