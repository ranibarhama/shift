import { NextResponse } from "next/server";
import { createPilotInitiative } from "@/lib/pilotBoardDb";
import { getCurrentRole } from "@/lib/session";

export async function POST(req: Request) {
  const role = await getCurrentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { title?: unknown; description?: unknown };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const initiative = await createPilotInitiative(title, description, role);
  return NextResponse.json({ initiative });
}
