"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLES, ROLE_COLOR_HEX, type RoleKey } from "@/lib/roles";

type Props = {
  /** If set, the dropdown highlights this department as the viewer's own. */
  ownRole?: RoleKey | null;
};

export default function DepartmentsDropdown({ ownRole }: Props) {
  const pathname = usePathname() ?? "";
  const active = pathname.startsWith("/department/");
  const otherRoles = ROLES.filter((r) => r.key !== "gm");

  return (
    <div className="group relative">
      <button
        aria-current={active ? "page" : undefined}
        className={
          active
            ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
            : "rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-fg"
        }
      >
        Departments ▾
      </button>
      {/*
        The wrapper sits flush against the button's bottom (no margin) so the
        cursor never crosses an unhovered gap on its way from the button into
        the menu. The visible gap is created by pt-1 on the wrapper instead.
      */}
      <div className="invisible absolute left-0 top-full z-30 w-64 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="rounded-md border border-line bg-card p-1 shadow-card">
          {ownRole && (
            <>
              <DeptItem role={ownRole} pathname={pathname} badge="Yours" />
              <div className="mx-2 my-1 h-px bg-line/60" />
            </>
          )}
          {otherRoles
            .filter((r) => !ownRole || r.key !== ownRole)
            .map((r) => (
              <DeptItem key={r.key} role={r.key as RoleKey} pathname={pathname} />
            ))}
          <div className="mx-2 my-1 h-px bg-line/60" />
          <OverviewItem pathname={pathname} />
        </div>
      </div>
    </div>
  );
}

function OverviewItem({ pathname }: { pathname: string }) {
  const isHere = pathname === "/overview";
  return (
    <Link
      href="/overview"
      className={
        "flex items-center gap-2 rounded px-2 py-1.5 text-sm " +
        (isHere
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-line/40 hover:text-fg")
      }
    >
      <span className="grid h-2 w-2 place-items-center text-accent" aria-hidden>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      </span>
      <span className="flex-1 truncate">Overview (A–Z)</span>
    </Link>
  );
}

function DeptItem({
  role,
  pathname,
  badge,
}: {
  role: RoleKey;
  pathname: string;
  badge?: string;
}) {
  const roleDef = ROLES.find((x) => x.key === role)!;
  const isHere = pathname === `/department/${role}`;
  return (
    <Link
      href={`/department/${role}`}
      className={
        "flex items-center gap-2 rounded px-2 py-1.5 text-sm " +
        (isHere
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-line/40 hover:text-fg")
      }
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: ROLE_COLOR_HEX[role] }}
      />
      <span className="flex-1 truncate">{roleDef.label.replace(/^Director of\s+/i, "")}</span>
      {badge && (
        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
          {badge}
        </span>
      )}
    </Link>
  );
}
