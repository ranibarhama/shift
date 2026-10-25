import { NextResponse } from "next/server";
import { addBlockInput, listBlockInputs } from "@/lib/buildingBlocksDb";

export const dynamic = "force-dynamic";

// Public route: Phase 2 has no roles, so team members add input by name.
export async function GET() {
  const inputs = await listBlockInputs();
  return NextResponse.json({ inputs });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const res = await addBlockInput(body);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ input: res.input });
}
