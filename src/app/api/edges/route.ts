import { NextResponse } from "next/server";
import { createEdge, getProcessById, getProcessByKey } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { processId, processKey, source, target } = body as {
    processId?: string;
    processKey?: string;
    source: string;
    target: string;
  };
  const proc = processId
    ? getProcessById(processId) ?? (processKey ? getProcessByKey(processKey) : null)
    : processKey
    ? getProcessByKey(processKey)
    : null;
  if (!proc) return NextResponse.json({ error: "no process" }, { status: 404 });
  if (proc.type === "main" && !canEditMain(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (proc.type === "department" && !canEditDepartment(role, proc.department_role!)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const edge = createEdge(proc.id, source, target);
  return NextResponse.json({ edge });
}
