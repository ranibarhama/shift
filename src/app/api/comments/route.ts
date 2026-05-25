import { NextResponse } from "next/server";
import { createComment, getStage } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

/**
 * Anyone signed in can comment on any stage they can view.
 * Authorship is recorded; deletion is gated by author / GM in the [id] route.
 */
export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const stageId = String(body.stageId ?? "");
  const content = String(body.content ?? "").trim();
  if (!stageId || !content) {
    return NextResponse.json({ error: "stageId and content required" }, { status: 400 });
  }

  const stage = await getStage(stageId);
  if (!stage) return NextResponse.json({ error: "no stage" }, { status: 404 });

  const comment = await createComment(stageId, content, role);
  return NextResponse.json({ comment });
}
