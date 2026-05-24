"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  matchPrefix?: string;
};

export default function NavLink({ href, children, matchPrefix }: Props) {
  const pathname = usePathname() ?? "";
  const prefix = matchPrefix ?? href;
  const active = pathname === prefix || pathname.startsWith(prefix + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
          : "rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-fg"
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
          ? "rounded-md bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent"
          : "rounded-md px-3 py-1.5 text-sm text-muted hover:bg-line/40 hover:text-fg"
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
