import { NextResponse } from "next/server";
import {
  deleteProcess,
  getEdgesForProcess,
  getItemsForStages,
  getProcessById,
  getProcessByKey,
  getStagesForProcess,
  updateProcessName,
} from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment } from "@/lib/roles";

async function loadProcess(id: string) {
  // Backwards-compat: also accept "main" or a role key
  return getProcessById(id) ?? getProcessByKey(id);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const process = await loadProcess(id);
  if (!process) return NextResponse.json({ error: "not found" }, { status: 404 });
  const stages = getStagesForProcess(process.id);
  const edges = getEdgesForProcess(process.id);
  const items = getItemsForStages(stages.map((s) => s.id));
  return NextResponse.json({ process, stages, edges, items });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const proc = getProcessById(id);
  if (!proc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (proc.type !== "department" || !proc.department_role) {
    return NextResponse.json({ error: "only department workflows can be edited" }, { status: 400 });
  }

  const role = await getCurrentRole();
  if (!role || !canEditDepartment(role, proc.department_role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const updated = updateProcessName(id, name);
  return NextResponse.json({ process: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const proc = getProcessById(id);
  if (!proc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (proc.type !== "department" || !proc.department_role) {
    return NextResponse.json({ error: "main process cannot be deleted" }, { status: 400 });
  }

  const role = await getCurrentRole();
  if (!role || !canEditDepartment(role, proc.department_role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  deleteProcess(id);
  return NextResponse.json({ ok: true });
}
