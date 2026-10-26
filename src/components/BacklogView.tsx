"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  BUILDING_BLOCKS,
  CATEGORIES,
  blockDef,
  isBlockKey,
  isFoundation,
  type BlockInput,
  type BlockKey,
  type CategoryKey,
  type InputKind,
} from "@/lib/buildingBlocks";
import { CategoryTag } from "./BuildingBlocks";

/* -----------------------------------------------------------------------------
 * Phase 2 · 2 · Backlog — the gaps the team mapped in 1 · Gaps and Connections:
 * headline numbers, the backlog itself, then where things need to connect —
 * the stages in one row — pick one to see its connections on their own —
 * and the from → to grid underneath to show where the focus is.
 * -------------------------------------------------------------------------- */

const POLL_MS = 15_000;

/** A backlog item is something missing, or something we have that needs a connection.
 *  Things we have that need no connection are inventory — not backlog. */
type BacklogKind = "missing" | "connect";
type KindFilter = "all" | BacklogKind;
const isBacklogItem = (e: BlockInput) => e.kind === "missing" || e.kind === "connect";

type Target = { key: string; label: string; kind: "block" | "ext" | "unsure" };

const KIND_LABEL: Record<InputKind, string> = {
  missing: "Missing",
  connect: "Needs a connection",
  have: "Have",
};
const KIND_GLYPH: Record<InputKind, string> = { missing: "!", connect: "⇄", have: "✓" };
/** Same hues as the kind glyphs on the Gaps and Connections stages. */
const KIND_HEX: Record<InputKind, string> = { missing: "#f59e0b", connect: "#7c5cff", have: "#22c55e" };

/** The backlog Type column as a tag: glyph + label (+ the member's rank for missing items). */
function KindTag({ kind, rank }: { kind: InputKind; rank?: number }) {
  const hex = KIND_HEX[kind];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold text-fg"
      style={{ background: `${hex}1a`, borderColor: `${hex}66` }}
    >
      <span aria-hidden style={{ color: hex }}>
        {KIND_GLYPH[kind]}
      </span>
      {KIND_LABEL[kind]}
      {rank ? <span className="tabular-nums text-muted">#{rank}</span> : null}
    </span>
  );
}

function targetsOf(e: BlockInput): Target[] {
  if (e.kind === "have") return [];
  if (e.unsure) return [{ key: "unsure", label: "Not sure yet", kind: "unsure" }];
  return e.targets.map((t) =>
    isBlockKey(t)
      ? { key: t, label: blockDef(t)!.label, kind: "block" as const }
      : { key: `ext:${t.toLowerCase()}`, label: t, kind: "ext" as const }
  );
}

/** Missing items are a member's ranked top 3 per block (order added). */
function missingRanks(entries: BlockInput[]): Map<string, number> {
  const ranks = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const e of [...entries].sort((a, b) => a.createdAt - b.createdAt)) {
    if (e.kind !== "missing") continue;
    const k = `${e.block}|${e.member}`;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    ranks.set(e.id, n);
  }
  return ranks;
}

/* ============================== View ============================== */

export default function BacklogView({ initial }: { initial: BlockInput[] }) {
  const [entries, setEntries] = useState<BlockInput[]>(initial);
  const [kind, setKind] = useState<KindFilter>("all");
  const [block, setBlock] = useState<BlockKey | "all">("all");
  const [category, setCategory] = useState<CategoryKey | "all">("all");
  const [person, setPerson] = useState<string>("all");
  const [q, setQ] = useState("");

  // Keep up with the team while session 1 is still running.
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/building-blocks", { cache: "no-store" });
        if (r.ok) setEntries(((await r.json()) as { inputs: BlockInput[] }).inputs);
      } catch {
        /* keep the current view */
      }
    };
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", load);
    };
  }, []);

  const backlog = useMemo(() => entries.filter(isBacklogItem), [entries]);
  const people = useMemo(
    () => [...new Set(backlog.map((e) => e.member))].sort((a, b) => a.localeCompare(b)),
    [backlog]
  );
  const ranks = useMemo(() => missingRanks(backlog), [backlog]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return backlog.filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (block !== "all" && e.block !== block) return false;
      if (category !== "all" && e.category !== category) return false;
      if (person !== "all" && e.member !== person) return false;
      if (needle) {
        const hay = [e.text, e.member, ...targetsOf(e).map((t) => t.label)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [backlog, kind, block, category, person, q]);

  const anyFilter = kind !== "all" || block !== "all" || category !== "all" || person !== "all" || !!q;

  if (backlog.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card/40 px-6 py-16 text-center">
        <div className="text-sm font-semibold text-fg">The backlog is empty — for now</div>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          It fills up as the team maps today&apos;s status: anything that&apos;s missing, and
          anything we have that still needs a connection. Things we have that need no
          connection aren&apos;t backlog items.
        </p>
        <a
          href="/stage-2/session-1#blocks"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-ink transition hover:brightness-110"
        >
          Go to 1 · Gaps and Connections →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* One filter row — scopes everything below it */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card/60 px-4 py-3">
        <div role="radiogroup" aria-label="Type" className="flex rounded-full border border-line bg-bg p-0.5">
          {(["all", "missing", "connect"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={
                "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
                (kind === k ? "bg-accent text-ink" : "text-muted hover:text-fg")
              }
            >
              {k === "all" ? "All" : KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <Select label="Stage" value={block} onChange={(v) => setBlock(v as BlockKey | "all")}>
          <option value="all">All stages</option>
          {BUILDING_BLOCKS.map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </Select>
        <Select label="Category" value={category} onChange={(v) => setCategory(v as CategoryKey | "all")}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Person" value={person} onChange={setPerson}>
          <option value="all">Everyone</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search items…"
          aria-label="Search items"
          className="min-w-[160px] flex-1 rounded-full border border-line bg-bg px-3 py-1.5 text-[12px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setKind("all");
              setBlock("all");
              setCategory("all");
              setPerson("all");
              setQ("");
            }}
            className="text-[11px] font-semibold text-accent hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <Kpis items={filtered} />

      <BacklogList items={filtered} ranks={ranks} total={backlog.length} />

      <Connections items={filtered} kind={kind} onKind={setKind} />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-line bg-bg px-3 py-1.5 text-[12px] text-fg focus:border-accent focus:outline-none"
    >
      {children}
    </select>
  );
}

/* ============================== KPIs ============================== */

function Kpis({ items }: { items: BlockInput[] }) {
  const n = (k: InputKind) => items.filter((e) => e.kind === k).length;
  const unsure = items.filter((e) => e.kind === "missing" && e.unsure).length;
  const tiles = [
    { label: "Backlog items", value: items.length },
    { label: "Missing", value: n("missing") },
    { label: "Have it, need a connection", value: n("connect") },
    { label: "Not sure where to connect", value: unsure },
    { label: "Contributors", value: new Set(items.map((e) => e.member)).size },
  ];
  const uncategorized = items.filter((e) => !e.category).length;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-card/60 px-4 py-3">
            <div className="text-[11px] text-muted">{t.label}</div>
            <div className="mt-0.5 text-2xl font-semibold text-fg">{t.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
          By category
        </span>
        {CATEGORIES.map((c) => {
          const v = items.filter((e) => e.category === c.key).length;
          const pct = items.length ? Math.round((v / items.length) * 100) : 0;
          return (
            <span
              key={c.key}
              className="inline-flex items-baseline gap-1.5 rounded-xl border border-line bg-card/60 px-3 py-1.5"
            >
              <span className="text-[12px] text-muted">{c.label}</span>
              <span className="text-sm font-semibold text-fg">{v}</span>
              <span className="text-[11px] text-muted">{pct}%</span>
            </span>
          );
        })}
        {uncategorized > 0 && (
          <span className="inline-flex items-baseline gap-1.5 rounded-xl border border-dashed border-line px-3 py-1.5">
            <span className="text-[12px] text-muted">Uncategorized</span>
            <span className="text-sm font-semibold text-fg">{uncategorized}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Block identity: a colored dot beside ink text. */
function BlockDot({ block }: { block: string }) {
  const b = blockDef(block);
  if (!b) return <>{block}</>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.hex }} aria-hidden />
      {b.label}
    </span>
  );
}

/* ============================== Backlog list ============================== */

function BacklogList({
  items,
  ranks,
  total,
}: {
  items: BlockInput[];
  ranks: Map<string, number>;
  total: number;
}) {
  const order: Record<InputKind, number> = { missing: 0, connect: 1, have: 2 }; // have never reaches here
  const groups = BUILDING_BLOCKS.map((b) => ({
    b,
    list: items
      .filter((e) => e.block === b.key)
      .sort(
        (x, y) =>
          order[x.kind] - order[y.kind] ||
          x.member.localeCompare(y.member) ||
          (ranks.get(x.id) ?? 0) - (ranks.get(y.id) ?? 0) ||
          x.createdAt - y.createdAt
      ),
  })).filter((g) => g.list.length);

  function exportCsv() {
    const cell = (v: string) => {
      const safe = /^[=+\-@]/.test(v) ? `'${v}` : v; // no spreadsheet formulas
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      ["Stage", "Owners", "Type", "Rank", "Category", "Item", "Connects to", "Added by", "Added at"],
      ...groups.flatMap(({ b, list }) =>
        list.map((e) => [
          b.label,
          b.owners.join(", "),
          KIND_LABEL[e.kind],
          e.kind === "missing" ? String(ranks.get(e.id) ?? "") : "",
          CATEGORIES.find((c) => c.key === e.category)?.label ?? "Uncategorized",
          e.text,
          e.unsure ? "Not sure" : targetsOf(e).map((t) => t.label).join("; "),
          e.member,
          new Date(e.createdAt).toISOString(),
        ])
      ),
    ];
    const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shift-phase2-backlog.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Backlog</h2>
          <p className="text-[12px] text-muted">
            {`${items.length} of ${total} items · grouped by stage · missing first, ranked by each person's top 3`}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!items.length}
          className="rounded-full border border-line bg-bg px-3 py-1.5 text-[11px] font-semibold text-fg transition hover:border-accent/50 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">No items match these filters.</p>
      ) : (
        <div className="space-y-5">
          {groups.map(({ b, list }) => (
            <div key={b.key}>
              <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line pb-1.5">
                <span className="text-sm font-semibold text-fg">
                  <BlockDot block={b.key} />
                </span>
                <span className="text-[11px] text-muted">
                  {b.owners.length > 1 ? "Owners" : "Owner"} · {b.owners.length ? b.owners.join(", ") : "not set yet"}
                </span>
                <span className="ml-auto text-[11px] text-muted">
                  {(["missing", "connect"] as const)
                    .map((k) => `${list.filter((e) => e.kind === k).length} ${KIND_LABEL[k].toLowerCase()}`)
                    .join(" · ")}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] table-fixed text-left text-[12.5px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.12em] text-muted">
                      <th className="w-40 px-2 py-1 font-semibold">Type</th>
                      <th className="w-[34%] px-2 py-1 font-semibold">Item</th>
                      <th className="w-32 px-2 py-1 font-semibold">Category</th>
                      <th className="px-2 py-1 font-semibold">Connects to</th>
                      <th className="w-24 px-2 py-1 font-semibold">Added by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((e) => (
                      <tr key={e.id} className="border-t border-line/50 align-top">
                        <td className="whitespace-nowrap px-2 py-1.5">
                          <KindTag kind={e.kind} rank={e.kind === "missing" ? ranks.get(e.id) : undefined} />
                        </td>
                        <td className="px-2 py-1.5 text-fg">{e.text}</td>
                        <td className="px-2 py-1.5">
                          <CategoryTag category={e.category} />
                        </td>
                        <td className="px-2 py-1.5 text-fg">
                          {e.unsure ? (
                            <span className="italic text-muted">Not sure where</span>
                          ) : (
                            <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {e.targets.map((t) => (
                                <Fragment key={t}>
                                  {isBlockKey(t) ? <BlockDot block={t} /> : <span>{t}</span>}
                                </Fragment>
                              ))}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-fg">{e.member}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================== Where things need to connect ============================== */

/** `key` / `to` are stage keys, or "outside" / "unsure" columns in the grid. */
type Focus = { type: "node"; key: string } | { type: "pair"; from: BlockKey; to: string };

const UNSURE = "unsure";

/** One line in the stage view: a place the selected stage connects with, and the items behind it. */
type Conn = { key: string; label: string; hex: string | null; muted?: boolean; items: BlockInput[] };

/** The selected stage's connections: what it needs to connect to, and who needs it. */
function connectionsOf(sel: BlockKey, items: BlockInput[]) {
  const out = new Map<string, Conn>();
  const inc = new Map<string, Conn>();
  const put = (m: Map<string, Conn>, c: Omit<Conn, "items">, e: BlockInput) => {
    const cur = m.get(c.key);
    if (cur) cur.items.push(e);
    else m.set(c.key, { ...c, items: [e] });
  };
  for (const e of items) {
    if (!isBacklogItem(e)) continue;
    if (e.block === sel) {
      if (e.unsure) put(out, { key: UNSURE, label: "Not sure yet", hex: null, muted: true }, e);
      for (const t of new Set(e.targets)) {
        const b = isBlockKey(t) ? blockDef(t)! : null;
        put(out, b ? { key: b.key, label: b.label, hex: b.hex } : { key: `ext:${t.toLowerCase()}`, label: t, hex: null, muted: true }, e);
      }
    } else if (e.targets.includes(sel)) {
      const b = blockDef(e.block)!;
      put(inc, { key: b.key, label: b.label, hex: b.hex }, e);
    }
  }
  const sort = (m: Map<string, Conn>) =>
    [...m.values()].sort((a, b) => connRank(a.key) - connRank(b.key) || a.label.localeCompare(b.label));
  return { out: sort(out), inc: sort(inc) };
}

/** Stages in process order, then places outside the stages, then "not sure". */
function connRank(key: string) {
  const i = BUILDING_BLOCKS.findIndex((b) => b.key === key);
  return i >= 0 ? i : key === UNSURE ? 99 : 50;
}

/**
 * Where things need to connect: the stages in one row; pick one to see its
 * connections on their own — what it needs to connect to, and which stages need
 * it. Built / missing is a filter (shared with the page's type filter), not a
 * line style. The from → to grid underneath shows where the focus is.
 */
function Connections({
  items,
  kind,
  onKind,
}: {
  items: BlockInput[];
  kind: KindFilter;
  onKind: (k: KindFilter) => void;
}) {
  // Lines touching each stage (going out + coming in) — the same lines its view draws.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    const bump = (k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    for (const e of items) {
      if (!isBacklogItem(e)) continue;
      if (e.unsure) bump(e.block);
      for (const t of new Set(e.targets)) {
        bump(e.block);
        if (isBlockKey(t)) bump(t);
      }
    }
    return m;
  }, [items]);

  const busiest = useMemo(
    () =>
      [...BUILDING_BLOCKS].sort((a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0))[0]
        .key as BlockKey,
    [counts]
  );
  const [view, setView] = useState<"stage" | "all">("stage");
  const [picked, setPicked] = useState<BlockKey | null>(null);
  const selected = picked ?? busiest;
  const [hover, setHover] = useState<Focus | null>(null);
  const gridActive: Focus | null = hover ?? (view === "stage" ? { type: "node", key: selected } : null);

  function open(k: BlockKey) {
    setPicked(k);
    setView("stage");
  }

  const seg = (on: boolean) =>
    "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
    (on ? "bg-accent text-ink" : "text-muted hover:text-fg");

  const flow = BUILDING_BLOCKS.filter((b) => !isFoundation(b.key));
  const spanning = BUILDING_BLOCKS.filter((b) => isFoundation(b.key));

  function chip(b: (typeof BUILDING_BLOCKS)[number]) {
    const on = view === "stage" && b.key === selected;
    const n = counts.get(b.key) ?? 0;
    return (
      <button
        key={b.key}
        type="button"
        aria-pressed={on}
        onClick={() => open(b.key)}
        title={`${n} connection${n === 1 ? "" : "s"}`}
        className={
          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition " +
          (on ? "text-fg" : n ? "border-line text-fg hover:border-fg/30" : "border-line text-muted")
        }
        style={on ? { borderColor: b.hex, background: `${b.hex}1f`, boxShadow: `0 0 0 1px ${b.hex}` } : undefined}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: b.hex }} aria-hidden />
        {b.label}
        <span className="tabular-nums font-normal text-muted">{n}</span>
      </button>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Where things need to connect</h2>
          <p className="text-[12px] text-muted">
            {view === "stage"
              ? "Pick a stage to see what it needs to connect to — and which stages need it."
              : "Every connection at once. Hover to follow one; click a stage to open it on its own."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="View" className="flex rounded-full border border-line bg-bg p-0.5">
            <button type="button" role="radio" aria-checked={view === "stage"} onClick={() => setView("stage")} className={seg(view === "stage")}>
              One stage
            </button>
            <button type="button" role="radio" aria-checked={view === "all"} onClick={() => setView("all")} className={seg(view === "all")}>
              All at once
            </button>
          </div>
          <div role="radiogroup" aria-label="Show" className="flex rounded-full border border-line bg-bg p-0.5">
            {(["all", "connect", "missing"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => onKind(k)}
                className={seg(kind === k)}
              >
                {k === "all" ? "All" : k === "connect" ? "Built" : "Missing"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The stages, in one row */}
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max items-center gap-1">
          {flow.map((b, i) => (
            <Fragment key={b.key}>
              {chip(b)}
              {i < flow.length - 1 && (
                <span aria-hidden className="text-[11px] text-[#f97316]">
                  →
                </span>
              )}
            </Fragment>
          ))}
          <span aria-hidden className="mx-2 h-5 w-px bg-line" />
          {spanning.map(chip)}
        </div>
      </div>

      {view === "stage" ? (
        <StageConnections key={selected} stage={selected} items={items} />
      ) : (
        <AllConnections items={items} onPick={open} />
      )}

      <FocusGrid
        items={items}
        active={gridActive}
        onHover={setHover}
        onToggle={(f) => {
          const k = f.type === "node" ? f.key : f.from;
          if (isBlockKey(k)) open(k);
        }}
      />
    </section>
  );
}

/* Stage view geometry (viewBox units). */
const S_W = 900;
const S_PW = 240; // side pill width — fits "Planning & Prioritisations" + its count
const S_PH = 34;
const S_ROW = 46;
const S_CW = 230; // centre box width
const S_CH = 58;
const S_LX = 10; // left pills
const S_RX = S_W - 10 - S_PW; // right pills
const S_CX = (S_W - S_CW) / 2; // centre box

function StageConnections({ stage, items }: { stage: BlockKey; items: BlockInput[] }) {
  const b = blockDef(stage)!;
  const { out, inc } = useMemo(() => connectionsOf(stage, items), [stage, items]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; conn: Conn; dir: "out" | "in" } | null>(null);
  const [hot, setHot] = useState<string | null>(null);

  const rows = Math.max(out.length, inc.length, 2);
  const H = rows * S_ROW + 40;
  const cy = 20 + (rows * S_ROW) / 2;
  const pillY = (n: number, i: number) => 20 + ((rows - n) * S_ROW) / 2 + i * S_ROW + (S_ROW - S_PH) / 2;

  function showTip(ev: React.PointerEvent, conn: Conn, dir: "out" | "in") {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r)
      setTip({
        // Keep the 280px tooltip inside the view's width.
        x: Math.min(ev.clientX - r.left + 14, r.width - 290),
        y: ev.clientY - r.top + 14,
        conn,
        dir,
      });
  }

  function side(list: Conn[], dir: "out" | "in") {
    return list.map((c, i) => {
      const y = pillY(list.length, i);
      const py = y + S_PH / 2;
      const id = `${dir}:${c.key}`;
      const dim = hot !== null && hot !== id;
      // Lines run left → right: needed-by → stage → needs-to-connect-to.
      const [x1, y1, x2, y2] =
        dir === "out" ? [S_CX + S_CW, cy, S_RX - 4, py] : [S_LX + S_PW, py, S_CX - 4, cy];
      const xm = (x1 + x2) / 2;
      const px = dir === "out" ? S_RX : S_LX;
      return (
        <g
          key={id}
          className="cursor-default"
          style={{ opacity: dim ? 0.25 : 1, transition: "opacity 120ms" }}
          onPointerEnter={(ev) => {
            setHot(id);
            showTip(ev, c, dir);
          }}
          onPointerMove={(ev) => showTip(ev, c, dir)}
          onPointerLeave={() => {
            setHot(null);
            setTip(null);
          }}
        >
          <path
            d={`M${x1},${y1} C${xm},${y1} ${xm},${y2} ${x2},${y2}`}
            fill="none"
            stroke={b.hex}
            strokeWidth={2}
            strokeLinecap="round"
            markerEnd="url(#sc-arrow)"
          />
          <path d={`M${x1},${y1} C${xm},${y1} ${xm},${y2} ${x2},${y2}`} fill="none" stroke="transparent" strokeWidth={14} />
          <SvgPill x={px} y={y} conn={c} count={c.items.length} />
        </g>
      );
    });
  }

  const head = { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", style: { fill: "rgb(var(--muted))" } };
  const none = (x: number) => (
    <text x={x} y={cy + 4} textAnchor="middle" fontSize="12" fontStyle="italic" style={{ fill: "rgb(var(--muted))" }}>
      Nothing yet
    </text>
  );

  return (
    <div
      ref={wrapRef}
      className="relative rounded-2xl border bg-card/60 p-3 sm:p-4"
      style={{ borderColor: `${b.hex}55` }}
      onPointerLeave={() => setTip(null)}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${S_W} ${H}`}
          className="mx-auto w-full min-w-[680px] max-w-[1000px]"
          role="img"
          aria-label={`${b.label}: needs to connect to ${out.map((c) => c.label).join(", ") || "nothing yet"}; needed by ${inc.map((c) => c.label).join(", ") || "no stage yet"}`}
        >
          <defs>
            <marker id="sc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill={b.hex} />
            </marker>
          </defs>

          <text x={S_LX + S_PW / 2} y={12} textAnchor="middle" {...head}>
            NEEDED BY
          </text>
          <text x={S_RX + S_PW / 2} y={12} textAnchor="middle" {...head}>
            NEEDS TO CONNECT TO
          </text>

          {inc.length ? side(inc, "in") : none(S_LX + S_PW / 2)}
          {out.length ? side(out, "out") : none(S_RX + S_PW / 2)}

          {/* The selected stage */}
          <rect
            x={S_CX}
            y={cy - S_CH / 2}
            width={S_CW}
            height={S_CH}
            rx="14"
            fill={b.hex}
            fillOpacity="0.14"
            stroke={b.hex}
            strokeWidth="2"
          />
          <text x={S_W / 2} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" style={{ fill: "rgb(var(--fg))" }}>
            {b.label}
          </text>
        </svg>
      </div>

      {tip && (
        <ItemsTip
          x={tip.x}
          y={tip.y}
          title={tip.dir === "out" ? `${b.label} → ${tip.conn.label}` : `${tip.conn.label} → ${b.label}`}
          items={tip.conn.items}
        />
      )}
    </div>
  );
}

/** Every connection on one screen: all the stages on the left (greyed with 0 until they
 *  have input), where things need to connect on the right. Click a stage to open it on its own. */
function AllConnections({ items, onPick }: { items: BlockInput[]; onPick: (k: BlockKey) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; from: BlockKey; conn: Conn } | null>(null);
  const [hot, setHot] = useState<{ side: "from" | "to" | "line"; key: string } | null>(null);

  const { left, right } = useMemo(() => {
    const left = BUILDING_BLOCKS.map((b) => ({ b, out: connectionsOf(b.key, items).out }));
    const totals = new Map<string, Conn>();
    for (const s of left)
      for (const c of s.out) {
        const cur = totals.get(c.key);
        if (cur) cur.items = [...cur.items, ...c.items];
        else totals.set(c.key, { ...c, items: [...c.items] });
      }
    const right = [...totals.values()].sort(
      (a, b) => connRank(a.key) - connRank(b.key) || a.label.localeCompare(b.label)
    );
    return { left, right };
  }, [items]);

  const rows = Math.max(left.length, right.length, 2);
  const H = rows * S_ROW + 40;
  const pillY = (n: number, i: number) => 20 + ((rows - n) * S_ROW) / 2 + i * S_ROW + (S_ROW - S_PH) / 2;
  const leftY = new Map(left.map((s, i) => [s.b.key as string, pillY(left.length, i) + S_PH / 2]));
  const rightY = new Map(right.map((c, i) => [c.key, pillY(right.length, i) + S_PH / 2]));

  const lit = (from: string, to: string) =>
    !hot ||
    (hot.side === "from" && hot.key === from) ||
    (hot.side === "to" && hot.key === to) ||
    (hot.side === "line" && hot.key === `${from}|${to}`);
  const pillLit = (side: "from" | "to", key: string) =>
    !hot ||
    (hot.side === side && hot.key === key) ||
    left.some((s) => s.out.some((c) => lit(s.b.key, c.key) && (side === "from" ? s.b.key : c.key) === key));

  function showTip(ev: React.PointerEvent, from: BlockKey, conn: Conn) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r)
      setTip({
        x: Math.min(ev.clientX - r.left + 14, r.width - 290),
        y: ev.clientY - r.top + 14,
        from,
        conn,
      });
  }

  const head = { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", style: { fill: "rgb(var(--muted))" } };

  return (
    <div
      ref={wrapRef}
      className="relative rounded-2xl border border-line bg-card/60 p-3 sm:p-4"
      onPointerLeave={() => setTip(null)}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${S_W} ${H}`}
          className="mx-auto w-full min-w-[680px] max-w-[1000px]"
          role="img"
          aria-label={`All connections: ${left
            .map((s) => `${s.b.label} to ${s.out.map((c) => c.label).join(", ")}`)
            .join("; ")}`}
        >
          <defs>
            {BUILDING_BLOCKS.map((b) => (
              <marker
                key={b.key}
                id={`ac-arrow-${b.key}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 Z" fill={b.hex} />
              </marker>
            ))}
          </defs>

          <text x={S_LX + S_PW / 2} y={12} textAnchor="middle" {...head}>
            COMES FROM
          </text>
          <text x={S_RX + S_PW / 2} y={12} textAnchor="middle" {...head}>
            NEEDS TO CONNECT TO
          </text>

          {/* Lines */}
          {left.map((s) =>
            s.out.map((c) => {
              const y1 = leftY.get(s.b.key)!;
              const y2 = rightY.get(c.key)!;
              const x1 = S_LX + S_PW;
              const x2 = S_RX - 4;
              const xm = (x1 + x2) / 2;
              const d = `M${x1},${y1} C${xm},${y1} ${xm},${y2} ${x2},${y2}`;
              return (
                <g
                  key={`${s.b.key}|${c.key}`}
                  style={{ opacity: lit(s.b.key, c.key) ? 1 : 0.12, transition: "opacity 120ms" }}
                  onPointerEnter={(ev) => {
                    setHot({ side: "line", key: `${s.b.key}|${c.key}` });
                    showTip(ev, s.b.key, c);
                  }}
                  onPointerMove={(ev) => showTip(ev, s.b.key, c)}
                  onPointerLeave={() => {
                    setHot(null);
                    setTip(null);
                  }}
                >
                  <path
                    d={d}
                    fill="none"
                    stroke={s.b.hex}
                    strokeWidth={2}
                    strokeLinecap="round"
                    markerEnd={`url(#ac-arrow-${s.b.key})`}
                  />
                  <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
                </g>
              );
            })
          )}

          {/* Comes from */}
          {left.map((s, i) => (
            <g
              key={s.b.key}
              role="button"
              tabIndex={0}
              aria-label={`Open ${s.b.label}${s.out.length ? "" : " (nothing yet)"}`}
              className="cursor-pointer outline-none"
              style={{
                // No input yet: greyed, so it's clear which stages are still waiting.
                opacity: !pillLit("from", s.b.key) ? 0.3 : s.out.length ? 1 : 0.45,
                filter: s.out.length ? undefined : "grayscale(1)",
                transition: "opacity 120ms",
              }}
              onPointerEnter={() => setHot({ side: "from", key: s.b.key })}
              onPointerLeave={() => setHot(null)}
              onClick={() => onPick(s.b.key)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onPick(s.b.key);
                }
              }}
            >
              <SvgPill
                x={S_LX}
                y={pillY(left.length, i)}
                conn={{ key: s.b.key, label: s.b.label, hex: s.b.hex }}
                count={s.out.reduce((n, c) => n + c.items.length, 0)}
              />
            </g>
          ))}

          {/* Needs to connect to */}
          {right.length === 0 && (
            <text
              x={S_RX + S_PW / 2}
              y={20 + (rows * S_ROW) / 2 + 4}
              textAnchor="middle"
              fontSize="12"
              fontStyle="italic"
              style={{ fill: "rgb(var(--muted))" }}
            >
              Nothing yet
            </text>
          )}
          {right.map((c, i) => {
            const stage = isBlockKey(c.key) ? c.key : null;
            return (
              <g
                key={c.key}
                role={stage ? "button" : undefined}
                tabIndex={stage ? 0 : undefined}
                aria-label={stage ? `Open ${c.label}` : c.label}
                className={stage ? "cursor-pointer outline-none" : "outline-none"}
                style={{ opacity: pillLit("to", c.key) ? 1 : 0.3, transition: "opacity 120ms" }}
                onPointerEnter={() => setHot({ side: "to", key: c.key })}
                onPointerLeave={() => setHot(null)}
                onClick={() => stage && onPick(stage)}
                onKeyDown={(ev) => {
                  if (stage && (ev.key === "Enter" || ev.key === " ")) {
                    ev.preventDefault();
                    onPick(stage);
                  }
                }}
              >
                <SvgPill x={S_RX} y={pillY(right.length, i)} conn={c} count={c.items.length} />
              </g>
            );
          })}
        </svg>
      </div>

      {tip && (
        <ItemsTip
          x={tip.x}
          y={tip.y}
          title={`${blockDef(tip.from)!.label} → ${tip.conn.label}`}
          items={tip.conn.items}
        />
      )}
    </div>
  );
}

/** A stage (or other place) as a rounded box in the connection views. */
function SvgPill({
  x,
  y,
  conn: c,
  count,
}: {
  x: number;
  y: number;
  conn: Omit<Conn, "items">;
  count: number;
}) {
  const py = y + S_PH / 2;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={S_PW}
        height={S_PH}
        rx={S_PH / 2}
        style={{
          fill: c.hex ? `${c.hex}14` : "rgb(var(--bg))",
          stroke: c.hex ? `${c.hex}88` : "rgb(var(--line))",
        }}
        strokeDasharray={c.muted ? "4 3" : undefined}
      />
      {c.hex && <circle cx={x + 16} cy={py} r={4.5} fill={c.hex} />}
      <text x={x + (c.hex ? 28 : 14)} y={py + 4.5} fontSize="12.5">
        <tspan
          fontWeight="600"
          fontStyle={c.muted ? "italic" : undefined}
          style={{ fill: c.muted ? "rgb(var(--muted))" : "rgb(var(--fg))" }}
        >
          {c.label.length > 28 ? `${c.label.slice(0, 27)}…` : c.label}
        </tspan>
        <tspan dx="6" style={{ fill: "rgb(var(--muted))" }}>
          {count}
        </tspan>
      </text>
    </>
  );
}

/** Hover card listing the items behind a line. */
function ItemsTip({ x, y, title, items }: { x: number; y: number; title: string; items: BlockInput[] }) {
  return (
    <div
      className="pointer-events-none absolute z-10 w-[280px] rounded-lg border border-line bg-card px-3 py-2 shadow-card"
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <div className="text-sm font-semibold text-fg">{title}</div>
      <div className="text-[11px] text-muted">
        {items.length} item{items.length === 1 ? "" : "s"}
      </div>
      <ul className="mt-1.5 space-y-0.5 text-[12px] text-fg">
        {items.slice(0, 5).map((e) => (
          <li key={e.id} className="truncate">
            · {e.text} <span className="text-muted">({e.member})</span>
          </li>
        ))}
        {items.length > 5 && <li className="text-muted">+{items.length - 5} more</li>}
      </ul>
    </div>
  );
}

/* ---------- The blocks grid: where the focus is ---------- */

function FocusGrid({
  items,
  active,
  onHover,
  onToggle,
}: {
  items: BlockInput[];
  active: Focus | null;
  onHover: (f: Focus | null) => void;
  onToggle: (f: Focus) => void;
}) {
  const cols = [
    ...BUILDING_BLOCKS.map((b) => ({ key: b.key as string, label: b.label, block: true })),
    { key: "outside", label: "Outside the stages", block: false },
    { key: "unsure", label: "Not sure yet", block: false },
  ];

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of items) {
      for (const t of targetsOf(e)) {
        const col = t.kind === "ext" ? "outside" : t.key;
        const k = `${e.block}|${col}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
    }
    return m;
  }, [items]);

  const cell = (r: string, c: string) => counts.get(`${r}|${c}`) ?? 0;
  const rowTotal = (r: string) => cols.reduce((s, c) => s + cell(r, c.key), 0);
  const colTotal = (c: string) => BUILDING_BLOCKS.reduce((s, b) => s + cell(b.key, c), 0);
  const grand = BUILDING_BLOCKS.reduce((s, b) => s + rowTotal(b.key), 0);
  const max = Math.max(0, ...counts.values());
  const step = (n: number) => (n <= 0 || max === 0 ? 0 : Math.max(1, Math.ceil((n / max) * 6)));

  const inFocus = (r: string, c: string) =>
    !!active &&
    (active.type === "node"
      ? active.key === r || active.key === c
      : active.from === r && active.to === c);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">Where the focus is</h3>
          <p className="text-[12px] text-muted">
            Rows: where the need comes from. Columns: where it needs to connect. Darker = more
            backlog items.
          </p>
        </div>
        {max > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted" aria-hidden>
            Fewer
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <span key={s} className="h-3 w-5 rounded-sm" style={{ background: `var(--hm-${s})` }} />
            ))}
            More
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate text-[12px]" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                From \ To
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-1 py-1.5 align-bottom font-semibold text-fg">
                  <span className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight">
                    {c.block && (
                      <span className="h-2 w-2 rounded-full" style={{ background: blockDef(c.key)!.hex }} aria-hidden />
                    )}
                    <span className={c.block ? "" : "italic text-muted"}>{c.label}</span>
                  </span>
                </th>
              ))}
              <th scope="col" className="px-2 py-1.5 align-bottom text-[11px] font-semibold text-fg">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {BUILDING_BLOCKS.map((r) => (
              <tr key={r.key}>
                <th
                  scope="row"
                  className="cursor-pointer whitespace-nowrap px-2 py-1 text-left font-semibold text-fg"
                  onPointerEnter={() => onHover({ type: "node", key: r.key })}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onToggle({ type: "node", key: r.key })}
                >
                  <BlockDot block={r.key} />
                </th>
                {cols.map((c) => {
                  if (c.key === r.key) {
                    return (
                      <td key={c.key} className="rounded bg-line/30 text-center text-muted" aria-label="same stage">
                        —
                      </td>
                    );
                  }
                  const n = cell(r.key, c.key);
                  const s = step(n);
                  const pair: Focus | null =
                    n ? { type: "pair", from: r.key, to: c.key } : null;
                  return (
                    <td
                      key={c.key}
                      tabIndex={n ? 0 : -1}
                      aria-label={`${r.label} to ${c.label}: ${n}`}
                      onPointerEnter={() => pair && onHover(pair)}
                      onPointerLeave={() => onHover(null)}
                      onFocus={() => pair && onHover(pair)}
                      onBlur={() => onHover(null)}
                      onClick={() => pair && onToggle(pair)}
                      className={
                        "h-9 rounded text-center font-semibold outline-none transition-shadow " +
                        (n ? (pair ? "cursor-pointer" : "") : "text-muted/50") +
                        (inFocus(r.key, c.key) && n ? " ring-2 ring-fg" : "")
                      }
                      style={s ? { background: `var(--hm-${s})`, color: `var(--hm-${s}-ink)` } : undefined}
                    >
                      {n || "·"}
                    </td>
                  );
                })}
                <td className="rounded bg-line/40 px-2 text-center font-bold text-fg">{rowTotal(r.key)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-2 py-1 text-left text-[11px] font-semibold text-fg">
                Total
              </th>
              {cols.map((c) => (
                <td key={c.key} className="h-9 rounded bg-line/40 text-center font-bold text-fg">
                  {colTotal(c.key)}
                </td>
              ))}
              <td className="rounded bg-line/60 px-2 text-center font-bold text-fg">{grand}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
