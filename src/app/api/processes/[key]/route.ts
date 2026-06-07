import { NextResponse } from "next/server";
import {
  getProcessByKey,
  getStagesForProcess,
  getEdgesForProcess,
  getItemsForStages,
} from "@/lib/queries";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const process = getProcessByKey(key);
  if (!process) return NextResponse.json({ error: "not found" }, { status: 404 });
  const stages = getStagesForProcess(process.id);
  const edges = getEdgesForProcess(process.id);
  const items = getItemsForStages(stages.map((s) => s.id));
  return NextResponse.json({ process, stages, edges, items });
}
