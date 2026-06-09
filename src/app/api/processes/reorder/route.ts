import { NextResponse } from "next/server";
import { reorderProcessesForRole } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";
import { canEditDepartment, ROLES, type RoleKey } from "@/lib/roles";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const targetRole = String(body.role ?? "") as RoleKey;
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];

  if (!ROLES.some((r) => r.key === targetRole && r.key !== "gm")) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  if (!canEditDepartment(role, targetRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  await reorderProcessesForRole(targetRole, ids);
  return NextResponse.json({ ok: true });
}
