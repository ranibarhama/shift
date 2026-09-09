import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/session";
import { saveIteration2Graph } from "@/lib/iteration2Db";
import { sanitizeGraph } from "@/lib/iteration2";

export async function PUT(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const graph = sanitizeGraph(body);
  if (!graph) {
    return NextResponse.json({ error: "invalid graph" }, { status: 400 });
  }
  await saveIteration2Graph(graph);
  return NextResponse.json({ ok: true });
}
