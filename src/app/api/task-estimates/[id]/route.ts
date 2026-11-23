import { NextResponse } from "next/server";
import { saveEstimate } from "@/lib/taskPlanDb";

// Public route: anyone on the team can fill in or correct a task's estimate.
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const res = await saveEstimate(id, body);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ estimate: res.estimate });
}
