"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  BUILDING_BLOCKS,
  CATEGORIES,
  blockDef,
  isBlockKey,
  type BlockInput,
  type BlockKey,
  type CategoryKey,
  type InputKind,
} from "@/lib/buildingBlocks";
import { CategoryTag } from "./BuildingBlocks";

/* -----------------------------------------------------------------------------
 * Phase 2 · 2 · Backlog — the gaps the team mapped in 1 · Gaps and Connections:
 * headline numbers, the backlog itself, then where things need to connect —
 * a simple map of the blocks (exists-needs-connecting above, missing below)
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

      <Connections items={filtered} />
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
                        <td className="whitespace-nowrap px-2 py-1.5 text-muted">
                          <span className="mr-1" aria-hidden>
                            {KIND_GLYPH[e.kind]}
                          </span>
                          {KIND_LABEL[e.kind]}
                          {e.kind === "missing" && ranks.get(e.id) ? (
                            <span className="ml-1 tabular-nums text-fg">#{ranks.get(e.id)}</span>
                          ) : null}
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

type Focus = { type: "node"; key: BlockKey } | { type: "pair"; from: BlockKey; to: BlockKey };

type Arc = { id: string; from: BlockKey; to: BlockKey; kind: BacklogKind; items: BlockInput[] };

/**
 * A simple map of the blocks (in process order) and the links between them,
 * with the from → to grid underneath to show where the focus is. Hovering a
 * block, a line or a grid cell highlights the same thing in both.
 */
function Connections({ items }: { items: BlockInput[] }) {
  const [hover, setHover] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const active = hover ?? pinned;

  function toggle(f: Focus) {
    setPinned((p) => (p && JSON.stringify(p) === JSON.stringify(f) ? null : f));
  }

  return (
    <section className="space-y-4 rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Where things need to connect</h2>
          <p className="text-[12px] text-muted">
            Hover a stage or a line to see its connections. Click to keep it highlighted.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden>
              <line x1="1" y1="4" x2="27" y2="4" style={{ stroke: "rgb(var(--fg))" }} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Exists — needs connecting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="28" height="8" aria-hidden>
              <line x1="1" y1="4" x2="27" y2="4" style={{ stroke: "rgb(var(--fg))" }} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />
            </svg>
            Missing — needed
          </span>
          <span>Thicker line = more items</span>
          {pinned && (
            <button
              type="button"
              onClick={() => setPinned(null)}
              className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg hover:border-accent/50"
            >
              Clear highlight ✕
            </button>
          )}
        </div>
      </div>

      <SimpleMap items={items} active={active} onHover={setHover} onToggle={toggle} />
      <FocusGrid items={items} active={active} onHover={setHover} onToggle={toggle} />
    </section>
  );
}

const M_PW = 124;
const M_PH = 62;
const M_GAP = 140;
const M_X0 = 76;
/** Canvas grows with the number of blocks so nodes keep their size and spacing. */
const M_W = 2 * M_X0 + (BUILDING_BLOCKS.length - 1) * M_GAP;
const mx = (i: number) => M_X0 + i * M_GAP;
const mIndex = (k: string) => BUILDING_BLOCKS.findIndex((b) => b.key === k);
const mArcH = (d: number) => 22 + d * 18;
const mPort = (d: number) => 12 + d * 6.5; // stays inside the node edge for every distance
const mStroke = (n: number) => 1.75 + Math.min(n, 6) * 1.1;

function arcMatches(a: Arc, f: Focus) {
  return f.type === "node" ? a.from === f.key || a.to === f.key : a.from === f.from && a.to === f.to;
}

function SimpleMap({
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; arc: Arc } | null>(null);

  const { arcs, outside, unsure } = useMemo(() => {
    const m = new Map<string, Arc>();
    const outside = new Map<string, number>();
    const unsure = new Map<string, number>();
    for (const e of items) {
      if (e.kind !== "missing" && e.kind !== "connect") continue;
      if (e.unsure) {
        unsure.set(e.block, (unsure.get(e.block) ?? 0) + 1);
        continue;
      }
      for (const t of e.targets) {
        if (!isBlockKey(t)) {
          outside.set(e.block, (outside.get(e.block) ?? 0) + 1);
          continue;
        }
        const id = `${e.kind}|${e.block}|${t}`;
        const cur = m.get(id);
        if (cur) cur.items.push(e);
        else m.set(id, { id, from: e.block, to: t, kind: e.kind, items: [e] });
      }
    }
    return { arcs: [...m.values()], outside, unsure };
  }, [items]);

  const top = arcs.filter((a) => a.kind === "connect");
  const bottom = arcs.filter((a) => a.kind === "missing");
  const topH = Math.max(0, ...top.map((a) => mArcH(Math.abs(mIndex(a.to) - mIndex(a.from)))));
  const botH = Math.max(0, ...bottom.map((a) => mArcH(Math.abs(mIndex(a.to) - mIndex(a.from)))));
  const Y0 = 34 + topH;
  const H = Y0 + M_PH + botH + 34;

  const related = (a: Arc) => (active ? arcMatches(a, active) : false);
  const involved = (k: string) =>
    !active ||
    (active.type === "node"
      ? active.key === k || arcs.some((a) => arcMatches(a, active) && (a.from === k || a.to === k))
      : active.from === k || active.to === k);
  const focusColor = (a: Arc) =>
    active?.type === "node" ? blockDef(active.key)!.hex : blockDef(a.from)!.hex;

  function showTip(ev: React.PointerEvent, arc: Arc) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r)
      setTip({
        // Keep the 260px tooltip inside the map's width.
        x: Math.min(ev.clientX - r.left + 14, r.width - 270),
        y: ev.clientY - r.top + 14,
        arc,
      });
  }

  function arcPath(a: Arc) {
    const fi = mIndex(a.from);
    const ti = mIndex(a.to);
    const d = Math.abs(ti - fi);
    const dir = Math.sign(ti - fi);
    const h = mArcH(d);
    const x1 = mx(fi) + dir * mPort(d);
    const x2 = mx(ti) - dir * mPort(d);
    const mid = (x1 + x2) / 2;
    if (a.kind === "connect") {
      return { d: `M${x1} ${Y0} Q${mid} ${Y0 - 2 * h} ${x2} ${Y0 - 3}`, badge: [mid, Y0 - h] as const };
    }
    const yb = Y0 + M_PH;
    return { d: `M${x1} ${yb} Q${mid} ${yb + 2 * h} ${x2} ${yb + 3}`, badge: [mid, yb + h] as const };
  }

  return (
    <div ref={wrapRef} className="relative" onPointerLeave={() => setTip(null)}>
      <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${M_W} ${H}`}
        className="w-full min-w-[760px]"
        role="img"
        aria-label="Map of connections between the stages"
      >
        <defs>
          {[["muted", "rgb(var(--muted))"], ...BUILDING_BLOCKS.map((b) => [b.key, b.hex])].map(
            ([id, color]) => (
              <marker
                key={id}
                id={`sm-arrow-${id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 Z" style={{ fill: color }} />
              </marker>
            )
          )}
        </defs>

        {/* Zone labels */}
        <text x={8} y={16} fontSize="11" fontWeight="600" style={{ fill: "rgb(var(--muted))" }}>
          ▲ Exists — needs connecting{top.length ? "" : " · none yet"}
        </text>
        <text x={8} y={H - 10} fontSize="11" fontWeight="600" style={{ fill: "rgb(var(--muted))" }}>
          ▼ Missing — needed{bottom.length ? "" : " · none yet"}
        </text>

        {/* Lines */}
        {arcs.map((a) => {
          const rel = related(a);
          const dim = !!active && !rel;
          const color = rel ? focusColor(a) : "rgb(var(--muted))";
          const markerId = rel ? (active?.type === "node" ? active.key : a.from) : "muted";
          const { d, badge } = arcPath(a);
          const n = a.items.length;
          const pair: Focus = { type: "pair", from: a.from, to: a.to };
          return (
            <g
              key={a.id}
              tabIndex={0}
              role="button"
              aria-label={`${blockDef(a.from)!.label} to ${blockDef(a.to)!.label}: ${n} ${
                a.kind === "connect" ? "exist and need connecting" : "missing"
              }`}
              className="cursor-pointer outline-none"
              style={{ opacity: dim ? 0.12 : 1, transition: "opacity 120ms" }}
              onPointerEnter={(ev) => {
                onHover(pair);
                showTip(ev, a);
              }}
              onPointerMove={(ev) => showTip(ev, a)}
              onPointerLeave={() => {
                onHover(null);
                setTip(null);
              }}
              onFocus={() => onHover(pair)}
              onBlur={() => onHover(null)}
              onClick={() => onToggle(pair)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onToggle(pair);
                }
              }}
            >
              <path
                d={d}
                fill="none"
                style={{ stroke: color }}
                strokeOpacity={rel ? 1 : 0.6}
                strokeWidth={mStroke(n)}
                strokeDasharray={a.kind === "missing" ? "7 6" : undefined}
                strokeLinecap="round"
                markerEnd={`url(#sm-arrow-${markerId})`}
              />
              <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
              {n > 1 && (
                <g>
                  <circle cx={badge[0]} cy={badge[1]} r="9" style={{ fill: "rgb(var(--card))", stroke: color }} strokeWidth="1.5" />
                  <text x={badge[0]} y={badge[1] + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" style={{ fill: "rgb(var(--fg))" }}>
                    {n}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Blocks */}
        {BUILDING_BLOCKS.map((b, i) => {
          const f: Focus = { type: "node", key: b.key };
          const x = mx(i) - M_PW / 2;
          const on = active?.type === "node" && active.key === b.key;
          const out = outside.get(b.key) ?? 0;
          const ns = unsure.get(b.key) ?? 0;
          const extra = [out ? `+${out} outside` : "", ns ? `${ns} not sure` : ""]
            .filter(Boolean)
            .join(" · ");
          return (
            <g
              key={b.key}
              tabIndex={0}
              role="button"
              aria-label={`${b.label}${extra ? `, ${extra}` : ""}`}
              className="cursor-pointer outline-none"
              style={{ opacity: involved(b.key) ? 1 : 0.35, transition: "opacity 120ms" }}
              onPointerEnter={() => onHover(f)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(f)}
              onBlur={() => onHover(null)}
              onClick={() => onToggle(f)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onToggle(f);
                }
              }}
            >
              <rect
                x={x}
                y={Y0}
                width={M_PW}
                height={M_PH}
                rx="12"
                style={{ fill: "rgb(var(--card))", stroke: on ? b.hex : "rgb(var(--line))" }}
                strokeWidth={on ? 2 : 1}
              />
              <rect x={x + 10} y={Y0} width={M_PW - 20} height="3" rx="1.5" fill={b.hex} />
              <circle cx={x + 14} cy={Y0 + 19} r="4.5" fill={b.hex} />
              {b.mapLines.map((line, li) => (
                <text key={line} x={x + 24} y={Y0 + 23 + li * 13} fontSize="11.5" fontWeight="600" style={{ fill: "rgb(var(--fg))" }}>
                  {line}
                </text>
              ))}
              {extra && (
                <text x={x + 14} y={Y0 + M_PH - 9} fontSize="10" style={{ fill: "rgb(var(--muted))" }}>
                  {extra}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 w-[260px] rounded-lg border border-line bg-card px-3 py-2 shadow-card"
          style={{ left: tip.x, top: tip.y }}
          role="tooltip"
        >
          <div className="text-sm font-semibold text-fg">
            {tip.arc.items.length} item{tip.arc.items.length === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-muted">
            {blockDef(tip.arc.from)!.label} → {blockDef(tip.arc.to)!.label} ·{" "}
            {tip.arc.kind === "connect" ? "exists, needs connecting" : "missing, needed"}
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-fg">
            {tip.arc.items.slice(0, 5).map((e) => (
              <li key={e.id} className="truncate">
                · {e.text} <span className="text-muted">({e.member})</span>
              </li>
            ))}
            {tip.arc.items.length > 5 && (
              <li className="text-muted">+{tip.arc.items.length - 5} more</li>
            )}
          </ul>
        </div>
      )}
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
                    n && c.block ? { type: "pair", from: r.key, to: c.key as BlockKey } : null;
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
