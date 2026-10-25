"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  matchPrefix?: string;
  /** Only active on this exact path, not on its sub-pages. */
  exact?: boolean;
};

export default function NavLink({ href, children, matchPrefix, exact }: Props) {
  const pathname = usePathname() ?? "";
  const prefix = matchPrefix ?? href;
  const active = exact
    ? pathname === prefix
    : pathname === prefix || pathname.startsWith(prefix + "/");
  const ref = useRef<HTMLAnchorElement>(null);

  // In a nav that scrolls sideways, bring the current page's link into view
  // (adjusts only the nav's own scroll — never the page).
  useEffect(() => {
    const el = ref.current;
    const nav = el?.closest("nav");
    if (!active || !el || !nav || nav.scrollWidth <= nav.clientWidth) return;
    const r = el.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    nav.scrollLeft += r.left + r.width / 2 - (n.left + n.width / 2);
  }, [active]);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "whitespace-nowrap rounded-md bg-accent/15 px-2 py-1.5 text-xs font-medium text-accent"
          : "whitespace-nowrap rounded-md px-2 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
      }
    >
      {children}
    </Link>
  );
}

export function NavDropdownButton({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "whitespace-nowrap rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
          : "whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-fg"
      }
    >
      {children}
    </button>
  );
}

export function useActive(prefix: string): boolean {
  const pathname = usePathname() ?? "";
  return pathname === prefix || pathname.startsWith(prefix + "/");
}
