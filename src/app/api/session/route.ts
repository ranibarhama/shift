import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { isValidRole } from "@/lib/session";

export async function POST(req: Request) {
  const form = await req.formData();
  const role = String(form.get("role") ?? "");
  if (!isValidRole(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const res = NextResponse.redirect(new URL("/main", req.url));
  res.cookies.set(COOKIE_NAME, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete(COOKIE_NAME);
  return res;
}
