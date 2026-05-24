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
 * Rounded-square tile with a purple → cyan gradient and two stacked bars —
 * top bar is shorter and offset to the right, suggesting movement / shift.
 * Hover slightly nudges the top bar further to underline the metaphor.
 */
function ShiftMark() {
  return (
    <span
      className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] shadow-card"
      style={{
        background:
          "linear-gradient(135deg, #7c5cff 0%, #6d8cff 45%, #38bdf8 100%)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="relative drop-shadow-sm"
        aria-hidden
      >
        {/* dot trail — three little dots tracing the motion */}
        <circle cx="3" cy="20" r="1" fill="rgba(255,255,255,0.5)" />
        <circle cx="6" cy="17" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="9" cy="14" r="1" fill="rgba(255,255,255,0.75)" />
        {/* arrow shaft */}
        <path
          d="M 8 16 L 18 6"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* arrow head */}
        <path
          d="M 13 6 L 18 6 L 18 11"
          stroke="white"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
