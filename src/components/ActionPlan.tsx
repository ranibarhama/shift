"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MISSING_CATEGORIES,
  getMissingCategory,
  getRoi,
  getHorizon,
  parseMissingCategories,
} from "@/lib/tags";
import { ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import type { MissingItemRow } from "@/lib/queries";

type Props = {
  items: MissingItemRow[];
};

/**
 * Reframes the Backlog as a workshop-ready action list.
 *
 *   Quick wins   = Impact: High + Horizon: Short
 *   Big bets     = Impact: High + Horizon: Mid or Long
 *   Park         = everything else (collapsed by default)
 */
export default function ActionPlan({ items }: Props) {
  const [parkOpen, setParkOpen] = useState(false);

  const { quickWins, bigBets, park } = useMemo(() => {
    const quickWins: MissingItemRow[] = [];
    const bigBets: MissingItemRow[] = [];
    const park: MissingItemRow[] = [];
    for (const i of items) {
      if (i.roi === "high" && i.horizon === "short") quickWins.push(i);
      else if (i.roi === "high" && (i.horizon === "mid" || i.horizon === "long")) bigBets.push(i);
      else park.push(i);
    }
    // Stable ordering: most recently added first within each bucket
    const byCreatedDesc = (a: MissingItemRow, b: MissingItemRow) => b.created_at - a.created_at;
    return {
      quickWins: quickWins.sort(byCreatedDesc),
      bigBets: bigBets.sort(byCreatedDesc),
      park: park.sort(byCreatedDesc),
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        A workshop-ready cut of the same backlog. <b className="text-fg">Quick wins</b> are
        High-impact items we can do this month; <b className="text-fg">big bets</b> are
        High-impact items that need planning; everything else is parked but still searchable in
        the Backlog tab.
      </p>

      <Section
        title="Quick wins"
        subtitle="Do this month — High impact, short horizon."
        accent="#16a34a"
        count={quickWins.length}
        emptyMessage="No quick wins yet. Mark High impact + Short horizon on backlog items to land them here."
      >
        {quickWins.map((it) => (
          <ActionCard key={it.id} item={it} accent="#16a34a" />
        ))}
      </Section>

      <Section
        title="Big bets"
        subtitle="Plan now — High impact, longer horizon."
        accent="#7c5cff"
        count={bigBets.length}
        emptyMessage="No big bets yet. Mark High impact + Mid/Long horizon on backlog items."
      >
        {bigBets.map((it) => (
          <ActionCard key={it.id} item={it} accent="#7c5cff" />
        ))}
      </Section>

      {/* Park — collapsed by default to keep the focus on what matters */}
      <div className="rounded-xl border border-line bg-card/40">
        <button
          type="button"
          onClick={() => setParkOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">
              {parkOpen ? "▾" : "▸"} Park
            </div>
            <div className="text-sm text-fg">
              Everything else — {park.length} item{park.length === 1 ? "" : "s"}
            </div>
          </div>
          <span className="text-[11px] text-muted">
            Low / Mid impact or unrated. Hidden by default so they don&apos;t crowd the room.
          </span>
        </button>
        {parkOpen && (
          <div className="space-y-2 border-t border-line/60 p-4">
            {park.length === 0 ? (
              <p className="text-sm text-muted">Nothing here.</p>
            ) : (
              park.map((it) => <ActionCard key={it.id} item={it} accent="#5b6489" />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  accent,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2
            className="text-base font-semibold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            {title}
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${accent}22`, color: accent }}
          >
            {count}
          </span>
        </div>
        <span className="text-[11px] text-muted">{subtitle}</span>
      </div>
      {count === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-card/40 p-4 text-sm text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

function ActionCard({ item: it, accent }: { item: MissingItemRow; accent: string }) {
  const cats = parseMissingCategories(it.category)
    .map((k) => getMissingCategory(k))
    .filter((c): c is NonNullable<ReturnType<typeof getMissingCategory>> => !!c);
  const author = it.author_role ? getRole(it.author_role) : null;
  const roi = getRoi(it.roi);
  const horizon = getHorizon(it.horizon);
  const linkHref =
    it.process_type === "main"
      ? "/main"
      : `/department/${it.department_role}?w=${it.process_id}`;

  return (
    <div
      className="rounded-xl border bg-card p-3 transition hover:-translate-y-0.5"
      style={{ borderColor: `${accent}44`, boxShadow: `inset 3px 0 0 0 ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-fg">{it.content}</div>
          <Link
            href={linkHref}
            className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-accent"
          >
            {it.process_type === "main" ? (
              <span className="text-accent">Main process</span>
            ) : (
              <>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: ROLE_COLOR_HEX[it.department_role as RoleKey] }}
                />
                {it.process_name}
              </>
            )}
            <span>·</span>
            <span>{it.stage_name}</span>
          </Link>
        </div>
        {author && (
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-ink"
              style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
              title={author.label}
            >
              {author.initials}
            </span>
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {cats.map((c) => (
          <span
            key={c.key}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: `${c.hex}22`, color: c.hex, border: `1px solid ${c.hex}55` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.hex }} />
            {c.label}
          </span>
        ))}
        {roi && (
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: `${roi.hex}22`, color: roi.hex, border: `1px solid ${roi.hex}55` }}
          >
            Impact: {roi.label}
          </span>
        )}
        {horizon && (
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: `${horizon.hex}22`,
              color: horizon.hex,
              border: `1px solid ${horizon.hex}55`,
            }}
          >
            {horizon.label}
          </span>
        )}
      </div>
    </div>
  );
}
