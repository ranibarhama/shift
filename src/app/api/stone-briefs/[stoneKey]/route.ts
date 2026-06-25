import { NextResponse } from "next/server";
import { upsertStoneBrief } from "@/lib/stoneBriefsDb";
import {
  type LeaderName,
  type KpiKey,
  type KpiRole,
  type CustomKpi,
  LEADER_NAMES,
  KPIS,
} from "@/lib/stoneBriefs";
import { getCurrentRole } from "@/lib/session";

const LEADER_SET = new Set<string>(LEADER_NAMES);
const KPI_SET = new Set<string>(KPIS.map((k) => k.key));

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ stoneKey: string }> }
) {
  const role = await getCurrentRole();
  if (role !== "product") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { stoneKey } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const patch: Parameters<typeof upsertStoneBrief>[1] = {};

  if (Array.isArray(body.leaders)) {
    patch.leaders = body.leaders.filter(
      (n): n is LeaderName => typeof n === "string" && LEADER_SET.has(n)
    );
  }

  if (body.kpis && typeof body.kpis === "object") {
    const out: Partial<Record<KpiKey, KpiRole>> = {};
    for (const [k, v] of Object.entries(body.kpis as Record<string, unknown>)) {
      if (KPI_SET.has(k) && (v === "primary" || v === "secondary")) {
        out[k as KpiKey] = v;
      }
    }
    patch.kpis = out;
  }

  if (Array.isArray(body.customKpis)) {
    const out: CustomKpi[] = [];
    for (const item of body.customKpis) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as { label?: unknown }).label === "string" &&
        ((item as { label: string }).label).trim() &&
        ((item as { role?: unknown }).role === "primary" ||
          (item as { role?: unknown }).role === "secondary")
      ) {
        out.push({
          label: ((item as { label: string }).label).trim(),
          role: (item as { role: KpiRole }).role,
        });
      }
    }
    patch.customKpis = out;
  }

  if (typeof body.outcome === "string") patch.outcome = body.outcome;
  if (typeof body.pilot === "string") patch.pilot = body.pilot;
  if (typeof body.people === "string") patch.people = body.people;
  if (typeof body.reviewDate === "string") patch.reviewDate = body.reviewDate;

  const brief = await upsertStoneBrief(stoneKey, patch);
  return NextResponse.json({ brief });
}
