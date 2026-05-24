import { NextResponse } from "next/server";
import { deleteStage, getStage, updateStage } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";
import type { ProcessRow } from "@/lib/queries";

async function authorize(stageId: string) {
  const role = await getCurrentRole();
  if (!role) return { ok: false as const, status: 401, error: "unauthorized" };
  const stage = getStage(stageId);
  if (!stage) return { ok: false as const, status: 404, error: "not found" };
  const proc = getDb().prepare("SELECT * FROM processes WHERE id = ?").get(stage.process_id) as ProcessRow;
  if (proc.type === "main" && !canEditMain(role)) {
    return { ok: false as const, status: 403, error: "forbidden" };
  }
  if (proc.type === "department" && !canEditDepartment(role, proc.department_role!)) {
    return { ok: false as const, status: 403, error: "forbidden" };
  }
  return { ok: true as const, role, stage, proc };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const allowed = ["name", "description", "x", "y", "tag", "connected_main_stage_id"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  const updated = updateStage(id, patch);
  return NextResponse.json({ stage: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  deleteStage(id);
  return NextResponse.json({ ok: true });
}
