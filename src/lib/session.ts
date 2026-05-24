import { cookies } from "next/headers";
import { ROLES, type RoleKey, getRole } from "./roles";

export const COOKIE_NAME = "shift_role";

export async function getCurrentRole(): Promise<RoleKey | null> {
  const c = await cookies();
  const v = c.get(COOKIE_NAME)?.value;
  const r = getRole(v ?? undefined);
  return (r?.key as RoleKey | undefined) ?? null;
}

export async function requireRole(): Promise<RoleKey> {
  const r = await getCurrentRole();
  if (!r) throw new Error("Not signed in");
  return r;
}

export function isValidRole(v: string): v is RoleKey {
  return ROLES.some((r) => r.key === v);
}
