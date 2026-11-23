import { NextResponse } from "next/server";
import { listEstimates } from "@/lib/taskPlanDb";

export const dynamic = "force-dynamic";

// Public route: Phase 2 has no roles (same as /api/building-blocks).
export async function GET() {
  const estimates = await listEstimates();
  return NextResponse.json({ estimates });
}
