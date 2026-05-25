import { NextResponse } from "next/server";
import { linkParticipant, unlinkParticipant } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const stageId = String(body.stageId ?? "");
  const participantId = String(body.participantId ?? "");
  if (!stageId || !participantId) {
    return NextResponse.json({ error: "stageId and participantId required" }, { status: 400 });
  }
  await linkParticipant(stageId, participantId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const stageId = url.searchParams.get("stageId") ?? "";
  const participantId = url.searchParams.get("participantId") ?? "";
  if (!stageId || !participantId) {
    return NextResponse.json({ error: "stageId and participantId required" }, { status: 400 });
  }
  await unlinkParticipant(stageId, participantId);
  return NextResponse.json({ ok: true });
}
