import Link from "next/link";
import { getCurrentRole } from "@/lib/session";
import { ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import { getCurrentTheme } from "@/lib/theme";
import ThemeToggle from "./ThemeToggle";
import NavLink from "./NavLink";
import DepartmentsDropdown from "./DepartmentsDropdown";

export default async function Topbar() {
  const roleKey = await getCurrentRole();
  const role = roleKey ? getRole(roleKey) : null;
  const theme = await getCurrentTheme();
  const userRole: RoleKey | null = role ? (role.key as RoleKey) : null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line/70 bg-bg/80 px-5 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link
          href="/main"
          className="group flex items-center gap-2.5 text-fg"
          aria-label="Shift — B2C AI Implementation Playbook"
        >
          <ShiftMark />
          <span className="text-sm font-semibold tracking-tight">
            Shift
            <span className="ml-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:inline">
              · B2C
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/main">B2C main workflow</NavLink>
          {role && (
            <DepartmentsDropdown
              ownRole={role.key !== "gm" ? userRole : null}
            />
          )}
          <NavLink href="/overview">Overview (A–Z)</NavLink>
          <NavLink href="/backlog">Todo Backlog</NavLink>
          <NavLink href="/hit-list">Hit List</NavLink>
          <NavLink href="/blueprint">How good looks like</NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle initial={theme} />
        {role ? (
          <>
            <div className="flex items-center gap-2 rounded-full border border-line bg-card/60 py-1 pl-1 pr-3 text-xs">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-ink"
                style={{ background: ROLE_COLOR_HEX[role.key] }}
              >
                {role.initials}
              </span>
              <span className="text-fg">{role.label}</span>
            </div>
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
            >
              <HomeIcon />
              Home
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function HomeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

/**
 * Stylized Shift mark.
 * Dark rounded-square tile with a double chevron in purple → blue → cyan,
 * motion trails on the left and a sparkle bottom-right.
 * Matches the favicon at /public/icon.svg.
 */
function ShiftMark() {
  return (
    <span
      className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] shadow-card"
      style={{ background: "linear-gradient(180deg, #0e1638 0%, #04081a 100%)" }}
    >
      <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="topbar-chev" x1="0%" y1="15%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* motion trails */}
        <g fill="url(#topbar-chev)">
          <rect x="4" y="28" width="13" height="3" rx="1.5" opacity="0.55" />
          <rect x="2" y="34" width="20" height="3" rx="1.5" opacity="0.9" />
          <rect x="6" y="40" width="11" height="3" rx="1.5" opacity="0.55" />
        </g>
        {/* back chevron */}
        <path
          d="M 20 14 L 40 32 L 20 50"
          stroke="url(#topbar-chev)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
        {/* front chevron */}
        <path
          d="M 30 14 L 50 32 L 30 50"
          stroke="url(#topbar-chev)"
          strokeWidth="6.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* sparkle */}
        <path
          d="M 53 47 L 54.6 50.4 L 58 52 L 54.6 53.6 L 53 57 L 51.4 53.6 L 48 52 L 51.4 50.4 Z"
          fill="white"
        />
      </svg>
    </span>
  );
}
