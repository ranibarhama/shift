import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/stage-1", req.url));
  res.cookies.delete(COOKIE_NAME);
  return res;
}
