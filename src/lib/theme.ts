import { cookies } from "next/headers";

export const THEME_COOKIE = "shift_theme";
export type Theme = "light" | "dark";

export async function getCurrentTheme(): Promise<Theme> {
  const c = await cookies();
  const v = c.get(THEME_COOKIE)?.value;
  return v === "light" ? "light" : "dark";
}

export function isValidTheme(v: string): v is Theme {
  return v === "light" || v === "dark";
}
