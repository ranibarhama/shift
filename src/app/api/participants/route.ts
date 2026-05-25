import { NextResponse } from "next/server";
import { createParticipant, listParticipants } from "@/lib/queries";
import { getCurrentRole } from "@/lib/session";

export async function GET() {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const participants = await listParticipants();
  return NextResponse.json({ participants });
}

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const label = String(body.label ?? "").trim();
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  const participant = await createParticipant(label);
  return NextResponse.json({ participant });
}
