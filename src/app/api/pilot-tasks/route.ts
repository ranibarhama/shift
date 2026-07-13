import { NextResponse } from "next/server";
import { createPilotTask } from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";
import { LEADER_NAMES } from "@/lib/stoneBriefs";

const OWNER_SET = new Set<string>(LEADER_NAMES);

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    title?: unknown;
    initiativeId?: unknown;
    owner?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const initiativeId =
    typeof body.initiativeId === "string" && body.initiativeId
      ? body.initiativeId
      : null;
  const owner =
    typeof body.owner === "string" && OWNER_SET.has(body.owner)
      ? body.owner
      : null;

  const task = await createPilotTask(title, initiativeId, owner);
  return NextResponse.json({ task });
}
