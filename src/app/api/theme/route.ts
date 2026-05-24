import { NextResponse } from "next/server";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const theme = String((body as { theme?: string }).theme ?? "");
  if (!isValidTheme(theme)) {
    return NextResponse.json({ error: "invalid theme" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, theme });
  res.cookies.set(THEME_COOKIE, theme, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
