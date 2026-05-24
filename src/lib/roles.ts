export const ROLES = [
  { key: "gm", label: "GM / VP B2C", color: "gm", initials: "GM" },
  { key: "ux", label: "Director of UX", color: "ux", initials: "UX" },
  { key: "marketing", label: "Director of Marketing", color: "marketing", initials: "MK" },
  { key: "product", label: "Director of Product", color: "product", initials: "PR" },
  { key: "ops", label: "Director of Ops", color: "ops", initials: "OP" },
  { key: "analyst", label: "Director of Analyst", color: "analyst", initials: "AN" },
] as const;

export type RoleKey = (typeof ROLES)[number]["key"];

export function getRole(key: string | undefined | null) {
  return ROLES.find((r) => r.key === key);
}

export function canEditMain(role: RoleKey | null | undefined): boolean {
  return !!role; // every signed-in role can contribute to main
}

export function canEditDepartment(role: RoleKey | null | undefined, deptRole: RoleKey): boolean {
  if (!role) return false;
  if (role === "gm") return true;
  return role === deptRole;
}

export const ROLE_COLOR_HEX: Record<RoleKey, string> = {
  gm: "#e879f9",
  ux: "#f472b6",
  marketing: "#f59e0b",
  product: "#a78bfa",
  ops: "#34d399",
  analyst: "#60a5fa",
};
