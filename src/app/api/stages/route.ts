import { NextResponse } from "next/server";
import { createStage, getProcessById, getProcessByKey } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, canEditMain } from "@/lib/roles";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { processId, processKey, name, x, y } = body as {
    processId?: string;
    processKey?: string;
    name: string;
    x: number;
    y: number;
  };

  const proc =
    (processId ? await getProcessById(processId) : null) ??
    (processKey ? await getProcessByKey(processKey) : null);
  if (!proc) return NextResponse.json({ error: "no process" }, { status: 404 });

  if (proc.type === "main" && !canEditMain(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (proc.type === "department" && !canEditDepartment(role, proc.department_role!)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const stage = await createStage(proc.id, name || "New stage", x ?? 200, y ?? 200);
  return NextResponse.json({ stage });
}
