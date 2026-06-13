"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  MISSING_CATEGORIES,
  ROI_LEVELS,
  HORIZON_LEVELS,
  type MissingCategory,
  type RoiLevel,
  type HorizonLevel,
  getMissingCategory,
  parseMissingCategories,
  getRoi,
  getHorizon,
} from "@/lib/tags";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import type { MissingItemRow } from "@/lib/queries";

type SortKey = "content" | "category" | "roi" | "horizon" | "context" | "author" | "created" | "good";
type SortDir = "asc" | "desc";

const ROI_ORDER: Record<string, number> = { high: 0, mid: 1, low: 2, "": 3 };
const HORIZON_ORDER: Record<string, number> = { short: 0, mid: 1, long: 2, "": 3 };

/**
 * "What good looks like" — 5 signals each worth 1 point.
 * Returns a 0..5 score plus which of the 5 checks the item passed.
 */
function completeness(it: MissingItemRow) {
  const hasImpact = !!it.roi;
  const hasHorizon = !!it.horizon;
  const hasCategory = parseMissingCategories(it.category).length > 0;
  const hasOwner = !!it.stage_owner_role;
  const hasDecision = !!it.stage_decision_tag;
  const score =
    (hasImpact ? 1 : 0) +
    (hasHorizon ? 1 : 0) +
    (hasCategory ? 1 : 0) +
    (hasOwner ? 1 : 0) +
    (hasDecision ? 1 : 0);
  return { score, hasImpact, hasHorizon, hasCategory, hasOwner, hasDecision };
}

type Props = {
  items: MissingItemRow[];
};

export default function BacklogTable({ items }: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MissingCategory | "all">("all");
  const [roiFilter, setRoiFilter] = useState<RoiLevel | "all">("all");
  const [horizonFilter, setHorizonFilter] = useState<HorizonLevel | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "main" | RoleKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = items;
    if (catFilter !== "all") {
      list = list.filter((i) => parseMissingCategories(i.category).includes(catFilter));
    }
    if (roiFilter !== "all") list = list.filter((i) => i.roi === roiFilter);
    if (horizonFilter !== "all") list = list.filter((i) => i.horizon === horizonFilter);
    if (scopeFilter === "main") list = list.filter((i) => i.process_type === "main");
    else if (scopeFilter !== "all")
      list = list.filter((i) => i.department_role === scopeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.content.toLowerCase().includes(q) ||
          i.stage_name.toLowerCase().includes(q) ||
          i.process_name.toLowerCase().includes(q)
      );
    }
    const cmp = (a: MissingItemRow, b: MissingItemRow) => {
      let r = 0;
      switch (sortKey) {
        case "content":
          r = a.content.localeCompare(b.content);
          break;
        case "category": {
          // Sort by the first canonical category each item has
          const aFirst = parseMissingCategories(a.category)[0] ?? "";
          const bFirst = parseMissingCategories(b.category)[0] ?? "";
          r = aFirst.localeCompare(bFirst);
          break;
        }
        case "roi":
          r = (ROI_ORDER[a.roi ?? ""] ?? 3) - (ROI_ORDER[b.roi ?? ""] ?? 3);
          break;
        case "horizon":
          r = (HORIZON_ORDER[a.horizon ?? ""] ?? 3) - (HORIZON_ORDER[b.horizon ?? ""] ?? 3);
          break;
        case "context":
          r =
            a.process_name.localeCompare(b.process_name) ||
            a.stage_name.localeCompare(b.stage_name);
          break;
        case "author":
          r = (a.author_role ?? "").localeCompare(b.author_role ?? "");
          break;
        case "good": {
          // Sort by completeness score descending. Tiebreak by Impact=High first.
          // Always desc — "good" is meaningless ascending, so we ignore sortDir
          // for this mode below.
          const aScore = completeness(a).score;
          const bScore = completeness(b).score;
          r = bScore - aScore;
          if (r === 0) {
            r = (ROI_ORDER[a.roi ?? ""] ?? 3) - (ROI_ORDER[b.roi ?? ""] ?? 3);
          }
          if (r === 0) r = b.created_at - a.created_at;
          // Force descending regardless of sortDir
          return r;
        }
        case "created":
        default:
          r = a.created_at - b.created_at;
      }
      return sortDir === "asc" ? r : -r;
    };
    return [...list].sort(cmp);
  }, [items, search, catFilter, roiFilter, horizonFilter, scopeFilter, sortKey, sortDir]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = { tool: 0, infrastructure: 0, workflow: 0, _untagged: 0 };
    // An item with multiple categories counts under each of them — so a "Tool +
    // Workflow" item is included in both the Tool and Workflow chip counts.
    for (const i of items) {
      const cats = parseMissingCategories(i.category);
      if (cats.length === 0) {
        m._untagged += 1;
      } else {
        for (const c of cats) m[c] = (m[c] ?? 0) + 1;
      }
    }
    return m;
  }, [items]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const goodActive = sortKey === "good";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Todo Backlog</h1>
          <p className="mt-1 text-sm text-muted">
            Every "What's missing" item logged on a stage across the main process and all
            department workflows. {items.length} total.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (goodActive) {
              setSortKey("created");
              setSortDir("desc");
            } else {
              setSortKey("good");
            }
          }}
          className={
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition " +
            (goodActive
              ? "border-accent bg-accent text-ink shadow-card hover:brightness-110"
              : "border-accent bg-accent/15 text-accent hover:bg-accent/25")
          }
        >
          <span aria-hidden>✨</span>
          {goodActive ? "Back to default order" : "Show what good looks like"}
        </button>
      </div>

      {/* Workshop-facing explanation — only when the "good" sort is active */}
      {goodActive && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-accent/40 bg-accent/10">
          <div className="border-b border-accent/30 bg-accent/15 px-5 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              How this list is sorted
            </div>
            <div className="mt-1 text-base font-semibold text-fg">
              We sorted every item by how completely it was filled in.
            </div>
          </div>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2 text-sm text-fg">
              <p>
                Each item is scored <b>0 out of 5</b>. It gets one point for every box
                below it ticks:
              </p>
              <ul className="ml-1 space-y-1.5 text-sm">
                <ExplainRow>
                  Has an <b>Impact</b> rating (High, Mid, or Low)
                </ExplainRow>
                <ExplainRow>
                  Has a <b>Horizon</b> rating (Short, Mid, or Long term)
                </ExplainRow>
                <ExplainRow>
                  Has at least one <b>Type</b> tag (Tool / Infrastructure / Workflow)
                </ExplainRow>
                <ExplainRow>
                  The <b>parent stage has an owner</b> assigned
                </ExplainRow>
                <ExplainRow>
                  The <b>parent stage has a decision</b> (Drop / Automate / Hybrid / Own)
                </ExplainRow>
              </ul>
              <p className="mt-3 text-muted">
                The items at the top scored 5/5 — <b className="text-fg">that's the standard</b>.
                For every row below, ask the team:{" "}
                <em className="text-fg">"What would it take to make this one look like the top?"</em>
              </p>
            </div>
            <div className="rounded-lg border border-accent/30 bg-card/60 p-3 text-xs text-muted sm:max-w-xs">
              <div className="text-[10px] uppercase tracking-wider text-accent">
                What good looks like
              </div>
              <div className="mt-2 space-y-1.5 text-fg">
                <ScoreLegend />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary chips */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryChip
          label="All"
          count={items.length}
          active={catFilter === "all"}
          onClick={() => setCatFilter("all")}
          hex="#7c5cff"
        />
        {MISSING_CATEGORIES.map((c) => (
          <SummaryChip
            key={c.key}
            label={c.label}
            count={byCat[c.key] ?? 0}
            active={catFilter === c.key}
            onClick={() => setCatFilter(c.key)}
            hex={c.hex}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items, stages, workflows…"
          className="min-w-[240px] flex-1 rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as typeof scopeFilter)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">All sources</option>
          <option value="main">Main process</option>
          {ROLES.filter((r) => r.key !== "gm").map((r) => (
            <option key={r.key} value={r.key}>
              {r.label.replace("Director of ", "")}
            </option>
          ))}
        </select>
        <select
          value={roiFilter}
          onChange={(e) => setRoiFilter(e.target.value as typeof roiFilter)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          title="Filter by impact"
        >
          <option value="all">Any impact</option>
          {ROI_LEVELS.map((r) => (
            <option key={r.key} value={r.key}>
              Impact: {r.label}
            </option>
          ))}
        </select>
        <select
          value={horizonFilter}
          onChange={(e) => setHorizonFilter(e.target.value as typeof horizonFilter)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          title="Filter by horizon"
        >
          <option value="all">Any horizon</option>
          {HORIZON_LEVELS.map((h) => (
            <option key={h.key} value={h.key}>
              {h.label}
            </option>
          ))}
        </select>
        {(search || catFilter !== "all" || scopeFilter !== "all" || roiFilter !== "all" || horizonFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setCatFilter("all");
              setScopeFilter("all");
              setRoiFilter("all");
              setHorizonFilter("all");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          Showing {filtered.length} of {items.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {goodActive && (
                <th className="px-4 py-2 font-medium">
                  <span className="text-accent">Score</span>
                </th>
              )}
              <Th sortKey="content" current={sortKey} dir={sortDir} onClick={toggleSort}>Item</Th>
              <Th sortKey="category" current={sortKey} dir={sortDir} onClick={toggleSort}>Type</Th>
              <Th sortKey="roi" current={sortKey} dir={sortDir} onClick={toggleSort}>Impact</Th>
              <Th sortKey="horizon" current={sortKey} dir={sortDir} onClick={toggleSort}>Horizon</Th>
              <Th sortKey="context" current={sortKey} dir={sortDir} onClick={toggleSort}>Stage · Workflow</Th>
              <Th sortKey="author" current={sortKey} dir={sortDir} onClick={toggleSort}>Created by</Th>
              <Th sortKey="created" current={sortKey} dir={sortDir} onClick={toggleSort}>Added</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={goodActive ? 8 : 7} className="px-4 py-12 text-center text-sm text-muted">
                  {items.length === 0
                    ? "No backlog items yet. Open a stage and add something under \"What's missing\"."
                    : "No items match these filters."}
                </td>
              </tr>
            )}
            {filtered.map((it, idx) => {
              const cats = parseMissingCategories(it.category)
                .map((key) => getMissingCategory(key))
                .filter((c): c is NonNullable<ReturnType<typeof getMissingCategory>> => !!c);
              const author = it.author_role ? getRole(it.author_role) : null;
              const linkHref =
                it.process_type === "main"
                  ? `/main`
                  : `/department/${it.department_role}?w=${it.process_id}`;
              const c = completeness(it);
              const isBenchmark = goodActive && idx === 0 && c.score === 5;
              return (
                <tr
                  key={it.id}
                  className={
                    "border-t border-line/60 hover:bg-line/15 " +
                    (isBenchmark ? "bg-accent/10" : "")
                  }
                  style={
                    isBenchmark
                      ? { boxShadow: "inset 3px 0 0 0 rgb(124 92 255)" }
                      : undefined
                  }
                >
                  {goodActive && (
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{
                            background: c.score === 5 ? "rgb(124 92 255 / 0.18)" : "rgb(var(--line) / 0.4)",
                            color: c.score === 5 ? "rgb(124 92 255)" : "rgb(var(--fg))",
                          }}
                        >
                          {c.score} / 5
                        </span>
                        <div className="flex gap-0.5" aria-hidden>
                          <Dot ok={c.hasImpact} title="Impact set" />
                          <Dot ok={c.hasHorizon} title="Horizon set" />
                          <Dot ok={c.hasCategory} title="Type tag set" />
                          <Dot ok={c.hasOwner} title="Stage owner set" />
                          <Dot ok={c.hasDecision} title="Stage decision set" />
                        </div>
                        {isBenchmark && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                            ← benchmark
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2.5 align-top text-fg">{it.content}</td>
                  <td className="px-4 py-2.5 align-top">
                    {cats.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {cats.map((c) => (
                          <span
                            key={c.key}
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: `${c.hex}22`,
                              color: c.hex,
                              border: `1px solid ${c.hex}55`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: c.hex }}
                            />
                            {c.label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">— uncategorized —</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    {(() => {
                      const r = getRoi(it.roi);
                      return r ? (
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: `${r.hex}22`, color: r.hex, border: `1px solid ${r.hex}55` }}
                        >
                          {r.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    {(() => {
                      const h = getHorizon(it.horizon);
                      return h ? (
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: `${h.hex}22`, color: h.hex, border: `1px solid ${h.hex}55` }}
                        >
                          {h.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <Link href={linkHref} className="text-fg hover:text-accent">
                      {it.stage_name}
                    </Link>
                    <div className="text-[11px] text-muted">
                      {it.process_type === "main" ? (
                        <span className="text-accent">Main process</span>
                      ) : (
                        <>
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                            style={{ background: ROLE_COLOR_HEX[it.department_role as RoleKey] }}
                          />
                          {it.process_name}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    {author ? (
                      <span className="inline-flex items-center gap-1.5 text-fg">
                        <span
                          className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-ink"
                          style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
                        >
                          {author.initials}
                        </span>
                        <span className="text-xs">{author.label}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top text-xs text-muted" title={new Date(it.created_at).toLocaleString()}>
                    {relative(it.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  sortKey,
  current,
  dir,
  onClick,
  children,
}: {
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  children: React.ReactNode;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="cursor-pointer select-none px-4 py-2 font-medium hover:text-fg"
    >
      <span className={active ? "text-fg" : ""}>
        {children}
        {active && (
          <span className="ml-1 text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>
        )}
      </span>
    </th>
  );
}

function SummaryChip({
  label,
  count,
  active,
  onClick,
  hex,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  hex: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition"
      style={{
        background: active ? `${hex}1a` : "transparent",
        borderColor: active ? hex : "rgb(var(--line))",
      }}
    >
      <div>
        <div
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ color: active ? hex : undefined }}
        >
          {label}
        </div>
        <div className="text-2xl font-semibold text-fg">{count}</div>
      </div>
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: hex }}
      />
    </button>
  );
}

function relative(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ---------- Helpers for the "what good looks like" explanation panel ---------- */

function ExplainRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent"
        aria-hidden
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function ScoreLegend() {
  return (
    <>
      <LegendRow score={5} label="Top of the list — every box ticked." />
      <LegendRow score={4} label="One thing missing — fix it and it's a 5." />
      <LegendRow score={3} label="Half-built — needs a couple of decisions." />
      <LegendRow score={2} label="Raw input — needs the team to weigh in." />
      <LegendRow score={1} label="Just a name — start the conversation." />
      <LegendRow score={0} label="Empty — drop it or rewrite it." />
    </>
  );
}

function LegendRow({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
        style={{
          background: score === 5 ? "rgb(124 92 255 / 0.22)" : "rgb(var(--line) / 0.4)",
          color: score === 5 ? "rgb(124 92 255)" : "rgb(var(--fg))",
        }}
      >
        {score}
      </span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

function Dot({ ok, title }: { ok: boolean; title: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: ok ? "rgb(124 92 255)" : "transparent",
        border: ok ? "none" : "1px solid rgb(var(--muted) / 0.6)",
      }}
      title={title + (ok ? " ✓" : " — missing")}
      aria-label={title + (ok ? " set" : " missing")}
    />
  );
}
