import { NextResponse } from "next/server";
import { deleteStage, getProcessById, getStage, updateStage } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";
import type { StageRow } from "@/lib/queries";

async function authorize(stageId: string) {
  const role = await getCurrentRole();
  if (!role) return { ok: false as const, status: 401, error: "unauthorized" };
  const stage = await getStage(stageId);
  if (!stage) return { ok: false as const, status: 404, error: "not found" };
  const proc = await getProcessById(stage.process_id);
  if (!proc) return { ok: false as const, status: 404, error: "no process" };
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
  const allowed = ["name", "description", "x", "y", "tag", "owner_role", "connected_main_stage_id"] as const;
  const patch: Partial<Pick<StageRow, (typeof allowed)[number]>> = {};
  for (const k of allowed) if (k in body) (patch as Record<string, unknown>)[k] = body[k];
  const updated = await updateStage(id, patch);
  return NextResponse.json({ stage: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await deleteStage(id);
  return NextResponse.json({ ok: true });
}
