import { NextResponse } from "next/server";
import { createPilotGap } from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";
import { PILOT_STAGES, type StageKey } from "@/lib/pilotBoard";

const STAGE_KEY_SET = new Set<string>(PILOT_STAGES.map((s) => s.key));

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    initiativeId?: unknown;
    stageKey?: unknown;
  };
  const initiativeId =
    typeof body.initiativeId === "string" ? body.initiativeId : "";
  const stageKey =
    typeof body.stageKey === "string" && STAGE_KEY_SET.has(body.stageKey)
      ? (body.stageKey as StageKey)
      : null;

  if (!initiativeId || !stageKey) {
    return NextResponse.json(
      { error: "initiativeId + stageKey required" },
      { status: 400 }
    );
  }

  const gap = await createPilotGap(initiativeId, stageKey);
  return NextResponse.json({ gap });
}
