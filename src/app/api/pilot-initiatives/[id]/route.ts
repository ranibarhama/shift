import { NextResponse } from "next/server";
import {
  deletePilotInitiative,
  updatePilotInitiative,
} from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";
import type { PilotInitiativePatch } from "@/lib/pilotBoard";
import {
  KPIS,
  type CustomKpi,
  type KpiKey,
  type KpiRole,
} from "@/lib/stoneBriefs";

const KPI_KEY_SET = new Set<string>(KPIS.map((k) => k.key));

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const patch: PilotInitiativePatch = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.selected === "boolean") patch.selected = body.selected;

  if (body.kpis && typeof body.kpis === "object") {
    const out: Partial<Record<KpiKey, KpiRole>> = {};
    for (const [k, v] of Object.entries(body.kpis as Record<string, unknown>)) {
      if (KPI_KEY_SET.has(k) && (v === "primary" || v === "secondary")) {
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

  const initiative = await updatePilotInitiative(id, patch);
  if (!initiative) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ initiative });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await deletePilotInitiative(id);
  return NextResponse.json({ ok: true });
}
