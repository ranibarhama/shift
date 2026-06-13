"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MISSING_CATEGORIES,
  ROI_LEVELS,
  HORIZON_LEVELS,
  EFFORT_LEVELS,
  type MissingCategory,
  type RoiLevel,
  type HorizonLevel,
  type EffortLevel,
  getMissingCategory,
  parseMissingCategories,
  serializeMissingCategories,
  getRoi,
  getHorizon,
  getEffort,
} from "@/lib/tags";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import type { MissingItemRow } from "@/lib/queries";
import { useConfirm } from "./ConfirmProvider";

type SortKey =
  | "content"
  | "category"
  | "roi"
  | "horizon"
  | "effort"
  | "context"
  | "author"
  | "created"
  | "smart";
type SortDir = "asc" | "desc";

const ROI_ORDER: Record<string, number> = { high: 0, mid: 1, low: 2, "": 3 };
const HORIZON_ORDER: Record<string, number> = { short: 0, mid: 1, long: 2, "": 3 };
const EFFORT_ORDER: Record<string, number> = { s: 0, m: 1, l: 2, xl: 3, "": 4 };

/**
 * Action Score — what the Smart Sort uses.
 *
 *   Impact   (H=3, M=2, L=1, none=0)
 *   Horizon  (S=3, M=2, L=1, none=0)
 *   Effort   (S=4, M=3, L=2, XL=1, none=0)  // inverted — smaller effort scores higher
 *
 * Raw = Impact × Horizon × Effort, max 3·3·4 = 36, normalized to 0..100.
 * Any unrated dimension produces 0; those items are surfaced separately under
 * "unrated" rather than mixed in with rated items.
 */
function actionScore(it: MissingItemRow) {
  const impact = it.roi === "high" ? 3 : it.roi === "mid" ? 2 : it.roi === "low" ? 1 : 0;
  const horizon = it.horizon === "short" ? 3 : it.horizon === "mid" ? 2 : it.horizon === "long" ? 1 : 0;
  const effort = it.effort === "s" ? 4 : it.effort === "m" ? 3 : it.effort === "l" ? 2 : it.effort === "xl" ? 1 : 0;
  const raw = impact * horizon * effort;
  const score = Math.round((raw / 36) * 100);
  const rated = impact > 0 && horizon > 0 && effort > 0;
  return { score, impact, horizon, effort, rated };
}

type Props = {
  items: MissingItemRow[];
};

export default function BacklogTable({ items: initialItems }: Props) {
  // Local mirror so user edits update the table optimistically.
  const [items, setItems] = useState<MissingItemRow[]>(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MissingCategory | "all">("all");
  const [roiFilter, setRoiFilter] = useState<RoiLevel | "all">("all");
  const [horizonFilter, setHorizonFilter] = useState<HorizonLevel | "all">("all");
  const [effortFilter, setEffortFilter] = useState<EffortLevel | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "main" | RoleKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Inline content edit state
  const [editingContentFor, setEditingContentFor] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState("");

  // Optional toggle: show unrated items in Smart-sort mode
  const [showUnrated, setShowUnrated] = useState(false);

  /* ---------- Mutations (optimistic) ---------- */

  function localPatch(id: string, patch: Partial<MissingItemRow>) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function fireApiPatch(id: string, body: Record<string, unknown>) {
    void fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.warn("[Shift] backlog patch failed", err));
  }

  async function deleteItem(id: string, content: string) {
    const ok = await confirm({
      title: "Delete backlog item?",
      message: `Remove "${content}" everywhere — the stage drawer, this list, and any reports. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setItems((arr) => arr.filter((i) => i.id !== id));
    try {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[Shift] backlog delete failed", err);
    }
  }

  function toggleCategory(id: string, key: MissingCategory) {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const next = new Set(parseMissingCategories(target.category));
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const serialized = serializeMissingCategories(next) || null;
    localPatch(id, { category: serialized });
    fireApiPatch(id, { tag: serialized });
  }

  function setRoi(id: string, key: RoiLevel | null) {
    localPatch(id, { roi: key });
    fireApiPatch(id, { roi: key });
  }

  function setHorizonValue(id: string, key: HorizonLevel | null) {
    localPatch(id, { horizon: key });
    fireApiPatch(id, { horizon: key });
  }

  function setEffortValue(id: string, key: EffortLevel | null) {
    localPatch(id, { effort: key });
    fireApiPatch(id, { effort: key });
  }

  function commitContent(id: string) {
    const v = contentDraft.trim();
    setEditingContentFor(null);
    if (!v) return;
    const target = items.find((i) => i.id === id);
    if (!target || target.content === v) return;
    localPatch(id, { content: v });
    fireApiPatch(id, { content: v });
  }

  /* ---------- Filter + sort ---------- */

  const filteredAll = useMemo(() => {
    let list = items;
    if (catFilter !== "all") {
      list = list.filter((i) => parseMissingCategories(i.category).includes(catFilter));
    }
    if (roiFilter !== "all") list = list.filter((i) => i.roi === roiFilter);
    if (horizonFilter !== "all") list = list.filter((i) => i.horizon === horizonFilter);
    if (effortFilter !== "all") list = list.filter((i) => i.effort === effortFilter);
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
    return list;
  }, [items, search, catFilter, roiFilter, horizonFilter, effortFilter, scopeFilter]);

  const smartActive = sortKey === "smart";

  const filtered = useMemo(() => {
    const cmp = (a: MissingItemRow, b: MissingItemRow) => {
      let r = 0;
      switch (sortKey) {
        case "content":
          r = a.content.localeCompare(b.content);
          break;
        case "category": {
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
        case "effort":
          r = (EFFORT_ORDER[a.effort ?? ""] ?? 4) - (EFFORT_ORDER[b.effort ?? ""] ?? 4);
          break;
        case "context":
          r =
            a.process_name.localeCompare(b.process_name) ||
            a.stage_name.localeCompare(b.stage_name);
          break;
        case "author":
          r = (a.author_role ?? "").localeCompare(b.author_role ?? "");
          break;
        case "smart": {
          // Always highest score first — sortDir is ignored for Smart mode.
          const aScore = actionScore(a).score;
          const bScore = actionScore(b).score;
          r = bScore - aScore;
          if (r === 0) r = b.created_at - a.created_at;
          return r;
        }
        case "created":
        default:
          r = a.created_at - b.created_at;
      }
      return sortDir === "asc" ? r : -r;
    };
    return [...filteredAll].sort(cmp);
  }, [filteredAll, sortKey, sortDir]);

  // Smart mode splits rated vs unrated so the team focuses on actionable items
  const { rated, unrated } = useMemo(() => {
    if (!smartActive) return { rated: filtered, unrated: [] as MissingItemRow[] };
    const r: MissingItemRow[] = [];
    const u: MissingItemRow[] = [];
    for (const it of filtered) {
      if (actionScore(it).rated) r.push(it);
      else u.push(it);
    }
    return { rated: r, unrated: u };
  }, [filtered, smartActive]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = { tool: 0, infrastructure: 0, workflow: 0, _untagged: 0 };
    for (const i of items) {
      const cats = parseMissingCategories(i.category);
      if (cats.length === 0) m._untagged += 1;
      else for (const c of cats) m[c] = (m[c] ?? 0) + 1;
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

  /* ---------- Render ---------- */

  const visibleRows = smartActive ? (showUnrated ? [...rated, ...unrated] : rated) : filtered;
  const totalCols = 9 + (smartActive ? 1 : 0); // visible columns including Actions

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      {/* Header + Smart Sort button */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
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
            if (smartActive) {
              setSortKey("created");
              setSortDir("desc");
            } else {
              setSortKey("smart");
            }
          }}
          className={
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition " +
            (smartActive
              ? "border-accent bg-accent text-ink shadow-card hover:brightness-110"
              : "border-accent bg-accent/15 text-accent hover:bg-accent/25")
          }
        >
          <span aria-hidden>✨</span>
          {smartActive ? "Back to default order" : "Smart sort"}
        </button>
      </div>

      {/* Workshop-facing explanation panel — only when Smart sort is active */}
      {smartActive && (
        <div className="mb-5 overflow-hidden rounded-2xl border border-accent/40 bg-accent/10">
          <div className="border-b border-accent/30 bg-accent/15 px-5 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Smart sort by Action Score
            </div>
            <div className="mt-1 text-base font-semibold text-fg">
              We multiplied three things: Impact × Horizon × Effort. The smallest,
              highest-impact, soonest items rise to the top.
            </div>
          </div>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2 text-sm text-fg">
              <ul className="ml-1 space-y-1.5 text-sm">
                <FormulaRow label="Impact">
                  <Pill hex="#16a34a">High = 3</Pill>
                  <Pill hex="#f59e0b">Mid = 2</Pill>
                  <Pill hex="#ef4444">Low = 1</Pill>
                </FormulaRow>
                <FormulaRow label="Horizon">
                  <Pill hex="#38bdf8">Short = 3</Pill>
                  <Pill hex="#818cf8">Mid = 2</Pill>
                  <Pill hex="#6366f1">Long = 1</Pill>
                </FormulaRow>
                <FormulaRow label="Effort">
                  <Pill hex="#22c55e">S = 4</Pill>
                  <Pill hex="#eab308">M = 3</Pill>
                  <Pill hex="#f97316">L = 2</Pill>
                  <Pill hex="#ef4444">XL = 1</Pill>
                </FormulaRow>
              </ul>
              <p className="mt-3 text-muted">
                Score is normalized to <b className="text-fg">0–100</b>. Higher = act on
                this first. Items where any of the three is still unrated are hidden under{" "}
                <b className="text-fg">"Show unrated"</b> at the bottom — rate them on the
                row and they'll fold into the ranked list.
              </p>
            </div>
            <div className="rounded-lg border border-accent/30 bg-card/60 p-3 text-xs text-muted sm:max-w-xs">
              <div className="text-[10px] uppercase tracking-wider text-accent">Examples</div>
              <div className="mt-2 space-y-1.5 text-fg">
                <ExampleRow score={100} formula="High · Short · S" />
                <ExampleRow score={67} formula="High · Short · M" />
                <ExampleRow score={50} formula="High · Mid · M" />
                <ExampleRow score={25} formula="High · Short · XL" />
                <ExampleRow score={6} formula="Low · Long · L" />
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
        <select
          value={effortFilter}
          onChange={(e) => setEffortFilter(e.target.value as typeof effortFilter)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          title="Filter by effort"
        >
          <option value="all">Any effort</option>
          {EFFORT_LEVELS.map((e) => (
            <option key={e.key} value={e.key}>
              Effort: {e.label}
            </option>
          ))}
        </select>
        {(search ||
          catFilter !== "all" ||
          scopeFilter !== "all" ||
          roiFilter !== "all" ||
          horizonFilter !== "all" ||
          effortFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setCatFilter("all");
              setScopeFilter("all");
              setRoiFilter("all");
              setHorizonFilter("all");
              setEffortFilter("all");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          Showing {smartActive ? rated.length : filtered.length} of {items.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {smartActive && (
                <th className="px-4 py-2 font-medium">
                  <span className="text-accent">Score</span>
                </th>
              )}
              <Th sortKey="content" current={sortKey} dir={sortDir} onClick={toggleSort}>Item</Th>
              <Th sortKey="category" current={sortKey} dir={sortDir} onClick={toggleSort}>Type</Th>
              <Th sortKey="roi" current={sortKey} dir={sortDir} onClick={toggleSort}>Impact</Th>
              <Th sortKey="horizon" current={sortKey} dir={sortDir} onClick={toggleSort}>Horizon</Th>
              <Th sortKey="effort" current={sortKey} dir={sortDir} onClick={toggleSort}>Effort</Th>
              <Th sortKey="context" current={sortKey} dir={sortDir} onClick={toggleSort}>Stage · Workflow</Th>
              <Th sortKey="author" current={sortKey} dir={sortDir} onClick={toggleSort}>Created by</Th>
              <Th sortKey="created" current={sortKey} dir={sortDir} onClick={toggleSort}>Added</Th>
              <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="px-4 py-12 text-center text-sm text-muted">
                  {items.length === 0
                    ? "No backlog items yet. Open a stage and add something under \"What's missing\"."
                    : "No items match these filters."}
                </td>
              </tr>
            )}
            {visibleRows.map((it, idx) => {
              const isFirstUnrated =
                smartActive && showUnrated && idx === rated.length && unrated.length > 0;
              const isBenchmark = smartActive && idx === 0 && actionScore(it).rated;
              return (
                <RowFragment
                  key={it.id}
                  it={it}
                  smartActive={smartActive}
                  isBenchmark={isBenchmark}
                  isFirstUnrated={isFirstUnrated}
                  editing={editingContentFor === it.id}
                  contentDraft={contentDraft}
                  setContentDraft={setContentDraft}
                  startEdit={(id, content) => {
                    setEditingContentFor(id);
                    setContentDraft(content);
                  }}
                  commitContent={commitContent}
                  cancelContent={() => setEditingContentFor(null)}
                  onToggleCategory={toggleCategory}
                  onSetRoi={setRoi}
                  onSetHorizon={setHorizonValue}
                  onSetEffort={setEffortValue}
                  onDelete={() => deleteItem(it.id, it.content)}
                />
              );
            })}
            {smartActive && unrated.length > 0 && !showUnrated && (
              <tr className="border-t border-line/60 bg-line/10">
                <td colSpan={totalCols} className="px-4 py-3 text-center text-sm text-muted">
                  <button
                    type="button"
                    onClick={() => setShowUnrated(true)}
                    className="rounded-md border border-line bg-card px-3 py-1.5 text-xs text-fg hover:border-accent hover:text-accent"
                  >
                    Show {unrated.length} unrated item{unrated.length === 1 ? "" : "s"}
                  </button>
                </td>
              </tr>
            )}
            {smartActive && showUnrated && unrated.length > 0 && (
              <tr className="border-t border-line/60 bg-line/10">
                <td colSpan={totalCols} className="px-4 py-3 text-center text-sm text-muted">
                  <button
                    type="button"
                    onClick={() => setShowUnrated(false)}
                    className="rounded-md border border-line bg-card px-3 py-1.5 text-xs text-fg hover:border-accent hover:text-accent"
                  >
                    Hide unrated
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Row (broken out so the main render stays readable) ---------- */

function RowFragment({
  it,
  smartActive,
  isBenchmark,
  isFirstUnrated,
  editing,
  contentDraft,
  setContentDraft,
  startEdit,
  commitContent,
  cancelContent,
  onToggleCategory,
  onSetRoi,
  onSetHorizon,
  onSetEffort,
  onDelete,
}: {
  it: MissingItemRow;
  smartActive: boolean;
  isBenchmark: boolean;
  isFirstUnrated: boolean;
  editing: boolean;
  contentDraft: string;
  setContentDraft: (v: string) => void;
  startEdit: (id: string, content: string) => void;
  commitContent: (id: string) => void;
  cancelContent: () => void;
  onToggleCategory: (id: string, key: MissingCategory) => void;
  onSetRoi: (id: string, key: RoiLevel | null) => void;
  onSetHorizon: (id: string, key: HorizonLevel | null) => void;
  onSetEffort: (id: string, key: EffortLevel | null) => void;
  onDelete: () => void;
}) {
  const author = it.author_role ? getRole(it.author_role) : null;
  const linkHref =
    it.process_type === "main"
      ? "/main"
      : `/department/${it.department_role}?w=${it.process_id}`;
  const selectedCatKeys = new Set(parseMissingCategories(it.category));
  const score = actionScore(it);

  const rowStyle = isBenchmark
    ? { boxShadow: "inset 3px 0 0 0 rgb(124 92 255)" }
    : undefined;

  return (
    <>
      {isFirstUnrated && (
        <tr>
          <td
            colSpan={smartActive ? 10 : 9}
            className="border-t border-line/60 bg-line/20 px-4 py-2 text-[11px] uppercase tracking-wider text-muted"
          >
            Unrated — score 0 because at least one of Impact / Horizon / Effort is empty
          </td>
        </tr>
      )}
      <tr
        className={
          "border-t border-line/60 hover:bg-line/15 " +
          (isBenchmark ? "bg-accent/10" : "")
        }
        style={rowStyle}
      >
        {smartActive && (
          <td className="w-[120px] whitespace-nowrap px-4 py-2.5 align-top">
            {score.rated ? (
              <div className="flex flex-col items-start gap-1">
                <span
                  className="inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: score.score >= 80 ? "rgb(124 92 255 / 0.22)" : "rgb(var(--line) / 0.5)",
                    color: score.score >= 80 ? "rgb(124 92 255)" : "rgb(var(--fg))",
                  }}
                >
                  {score.score} / 100
                </span>
                <div className="whitespace-nowrap font-mono text-[10px] text-muted">
                  {roiLetter(it.roi)} · {horizonLetter(it.horizon)} · {effortLetter(it.effort)}
                </div>
                {isBenchmark && (
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-accent">
                    ← top of list
                  </span>
                )}
              </div>
            ) : (
              <span className="whitespace-nowrap text-[11px] text-muted">— unrated —</span>
            )}
          </td>
        )}
        <td className="px-4 py-2.5 align-top text-fg">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitContent(it.id);
              }}
            >
              <input
                autoFocus
                value={contentDraft}
                onChange={(e) => setContentDraft(e.target.value)}
                onBlur={() => commitContent(it.id)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancelContent();
                }}
                className="w-full rounded border border-accent/60 bg-card px-2 py-1 text-sm text-fg focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => startEdit(it.id, it.content)}
              className="-mx-2 rounded px-2 py-0.5 text-left hover:bg-line/30"
              title="Click to edit"
            >
              {it.content}
            </button>
          )}
        </td>
        <td className="px-4 py-2.5 align-top">
          <span className="flex flex-wrap gap-1">
            {MISSING_CATEGORIES.map((c) => {
              const active = selectedCatKeys.has(c.key);
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => onToggleCategory(it.id, c.key)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium transition"
                  style={{
                    background: active ? `${c.hex}22` : "transparent",
                    color: active ? c.hex : "#5b6489",
                    border: `1px solid ${active ? c.hex : "#2a3358"}`,
                  }}
                  aria-pressed={active}
                  title={active ? `Remove "${c.label}"` : `Add "${c.label}"`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: active ? c.hex : "transparent",
                      border: active ? "none" : `1px solid ${c.hex}88`,
                    }}
                  />
                  {c.label}
                </button>
              );
            })}
          </span>
        </td>
        <td className="px-4 py-2.5 align-top">
          <span className="flex flex-wrap gap-1">
            {ROI_LEVELS.map((r) => {
              const active = it.roi === r.key;
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => onSetRoi(it.id, active ? null : r.key)}
                  className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium transition"
                  style={{
                    background: active ? `${r.hex}22` : "transparent",
                    color: active ? r.hex : "#5b6489",
                    border: `1px solid ${active ? r.hex : "#2a3358"}`,
                  }}
                  aria-pressed={active}
                  title={active ? `Clear ${r.label}` : `Set ${r.label}`}
                >
                  {r.label}
                </button>
              );
            })}
          </span>
        </td>
        <td className="px-4 py-2.5 align-top">
          <span className="flex flex-wrap gap-1">
            {HORIZON_LEVELS.map((h) => {
              const active = it.horizon === h.key;
              return (
                <button
                  type="button"
                  key={h.key}
                  onClick={() => onSetHorizon(it.id, active ? null : h.key)}
                  className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium transition"
                  style={{
                    background: active ? `${h.hex}22` : "transparent",
                    color: active ? h.hex : "#5b6489",
                    border: `1px solid ${active ? h.hex : "#2a3358"}`,
                  }}
                  aria-pressed={active}
                  title={active ? `Clear ${h.label}` : `Set ${h.label}`}
                >
                  {h.label}
                </button>
              );
            })}
          </span>
        </td>
        <td className="px-4 py-2.5 align-top">
          <span className="flex flex-wrap gap-1">
            {EFFORT_LEVELS.map((e) => {
              const active = it.effort === e.key;
              return (
                <button
                  type="button"
                  key={e.key}
                  onClick={() => onSetEffort(it.id, active ? null : e.key)}
                  className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium transition"
                  style={{
                    background: active ? `${e.hex}22` : "transparent",
                    color: active ? e.hex : "#5b6489",
                    border: `1px solid ${active ? e.hex : "#2a3358"}`,
                  }}
                  aria-pressed={active}
                  title={`${e.label} — ${e.description}`}
                >
                  {e.label}
                </button>
              );
            })}
          </span>
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
        <td
          className="px-4 py-2.5 align-top text-xs text-muted"
          title={new Date(it.created_at).toLocaleString()}
        >
          {relative(it.created_at)}
        </td>
        <td className="px-4 py-2.5 align-top text-right">
          <button
            type="button"
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-full border border-drop/40 text-drop transition hover:bg-drop/15"
            aria-label="Delete this item"
            title="Delete this item everywhere"
          >
            <CloseIcon />
          </button>
        </td>
      </tr>
    </>
  );
}

/* ---------- Helpers ---------- */

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
        {active && <span className="ml-1 text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
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
      <span className="h-2 w-2 rounded-full" style={{ background: hex }} />
    </button>
  );
}

function FormulaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="flex flex-wrap gap-1.5">{children}</span>
    </li>
  );
}

function Pill({ hex, children }: { hex: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}
    >
      {children}
    </span>
  );
}

function ExampleRow({ score, formula }: { score: number; formula: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span
        className="grid h-5 min-w-[28px] place-items-center rounded-full px-1 text-[10px] font-bold"
        style={{
          background: score >= 80 ? "rgb(124 92 255 / 0.22)" : "rgb(var(--line) / 0.4)",
          color: score >= 80 ? "rgb(124 92 255)" : "rgb(var(--fg))",
        }}
      >
        {score}
      </span>
      <span className="font-mono text-muted">{formula}</span>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
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

function roiLetter(roi: string | null) {
  if (roi === "high") return "High";
  if (roi === "mid") return "Mid";
  if (roi === "low") return "Low";
  return "—";
}
function horizonLetter(horizon: string | null) {
  if (horizon === "short") return "Short";
  if (horizon === "mid") return "Mid";
  if (horizon === "long") return "Long";
  return "—";
}
function effortLetter(effort: string | null) {
  if (!effort) return "—";
  return effort.toUpperCase();
}
