import { NextResponse } from "next/server";
import { createItem, getStage } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";
import type { ProcessRow } from "@/lib/queries";
import type { ItemKind } from "@/lib/tags";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { stageId, kind, content, tag } = body as {
    stageId: string;
    kind: ItemKind;
    content: string;
    tag?: string | null;
  };
  const stage = getStage(stageId);
  if (!stage) return NextResponse.json({ error: "no stage" }, { status: 404 });
  const proc = getDb().prepare("SELECT * FROM processes WHERE id = ?").get(stage.process_id) as ProcessRow;
  if (proc.type === "main" && !canEditMain(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (proc.type === "department" && !canEditDepartment(role, proc.department_role!)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const item = createItem(stageId, kind, content, role, tag ?? null);
  return NextResponse.json({ item });
}
