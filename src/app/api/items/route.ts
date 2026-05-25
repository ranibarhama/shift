import { NextResponse } from "next/server";
import { createItem, getProcessById, getStage } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";
import type { ItemKind } from "@/lib/tags";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { stageId, kind, content, tag, roi, horizon } = body as {
    stageId: string;
    kind: ItemKind;
    content: string;
    tag?: string | null;
    roi?: string | null;
    horizon?: string | null;
  };
  const stage = await getStage(stageId);
  if (!stage) return NextResponse.json({ error: "no stage" }, { status: 404 });
  const proc = await getProcessById(stage.process_id);
  if (!proc) return NextResponse.json({ error: "no process" }, { status: 404 });
  if (proc.type === "main" && !canEditMain(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (proc.type === "department" && !canEditDepartment(role, proc.department_role!)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const item = await createItem(stageId, kind, content, role, tag ?? null);
  // For missing-kind items, optionally set roi/horizon in a follow-up update
  if (kind === "missing" && (roi || horizon)) {
    const { updateItem } = await import("@/lib/queries");
    const patched = await updateItem(item.id, { roi: roi ?? null, horizon: horizon ?? null });
    return NextResponse.json({ item: patched ?? item });
  }
  return NextResponse.json({ item });
}
