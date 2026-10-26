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
 * a left-to-right flow (where a need comes from → where it needs to connect)
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

/** `key` / `to` are stage keys, or OUTSIDE / UNSURE on the "needs to connect to" side. */
type Focus = { type: "node"; key: string } | { type: "pair"; from: BlockKey; to: string };

const OUTSIDE = "outside";
const UNSURE = "unsure";

/** One band: the backlog items of one kind that run from a stage to one place. */
type Link = { id: string; from: BlockKey; to: string; kind: BacklogKind; items: BlockInput[] };

/**
 * Where things need to connect, read left to right: the stage a need comes from →
 * where it needs to connect, with the from → to grid underneath to show where the
 * focus is. Hovering a stage, a band or a grid cell highlights the same thing in both.
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
            Read it left to right: where a need comes from → where it needs to connect. Hover a
            stage or a band to see the items; click to keep it highlighted.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="10" aria-hidden>
              <rect width="22" height="10" rx="2" style={{ fill: "rgb(var(--muted))" }} fillOpacity="0.6" />
            </svg>
            Built — needs connecting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="10" aria-hidden>
              <defs>
                <pattern id="fm-hatch-legend" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" style={{ fill: "rgb(var(--muted))" }} fillOpacity="0.12" />
                  <rect width="2.5" height="6" style={{ fill: "rgb(var(--muted))" }} fillOpacity="0.7" />
                </pattern>
              </defs>
              <rect width="22" height="10" rx="2" fill="url(#fm-hatch-legend)" />
            </svg>
            Missing — needed
          </span>
          <span>Thicker = more items</span>
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

      <FlowMap items={items} active={active} onHover={setHover} onToggle={toggle} />
      <FocusGrid items={items} active={active} onHover={setHover} onToggle={toggle} />
    </section>
  );
}

/* Flow geometry (viewBox units). */
const F_W = 900;
const F_LX = 228; // right edge of the "comes from" bars
const F_RX = 672; // left edge of the "needs to connect to" bars
const F_BAR = 8;
const F_GAP = 14; // between stages in a column
const F_TOP = 30; // room for the column headings
const F_MAXH = 360; // tallest column before the per-item unit shrinks

/** Everything on the right-hand side, in process order. */
const TARGET_ORDER = [...BUILDING_BLOCKS.map((b) => b.key as string), OUTSIDE, UNSURE];
const tRank = (k: string) => TARGET_ORDER.indexOf(k);
const kRank = (k: BacklogKind) => (k === "connect" ? 0 : 1);

function targetLabel(k: string) {
  if (isBlockKey(k)) return blockDef(k)!.label;
  return k === OUTSIDE ? "Outside the stages" : "Not sure yet";
}

function linkMatches(l: Link, f: Focus) {
  return f.type === "node" ? l.from === f.key || l.to === f.key : l.from === f.from && l.to === f.to;
}

function FlowMap({
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
  const [tip, setTip] = useState<{ x: number; y: number; link: Link } | null>(null);

  const layout = useMemo(() => {
    const m = new Map<string, Link>();
    for (const e of items) {
      if (!isBacklogItem(e)) continue;
      const tos = e.unsure
        ? [UNSURE]
        : [...new Set(e.targets.map((t) => (isBlockKey(t) ? t : OUTSIDE)))];
      for (const to of tos) {
        const id = `${e.block}|${to}|${e.kind}`;
        const cur = m.get(id);
        if (cur) cur.items.push(e);
        else m.set(id, { id, from: e.block, to, kind: e.kind as BacklogKind, items: [e] });
      }
    }
    const links = [...m.values()];
    const sum = (ls: Link[]) => ls.reduce((s, l) => s + l.items.length, 0);
    const srcTotal = new Map<string, number>();
    const tgtTotal = new Map<string, number>();
    for (const l of links) {
      srcTotal.set(l.from, (srcTotal.get(l.from) ?? 0) + l.items.length);
      tgtTotal.set(l.to, (tgtTotal.get(l.to) ?? 0) + l.items.length);
    }
    const srcs = BUILDING_BLOCKS.map((b) => b.key as string).filter((k) => srcTotal.has(k));
    const tgts = TARGET_ORDER.filter((k) => tgtTotal.has(k));

    // Pixels per item: as thick as fits, never thinner than a hairline band.
    const total = sum(links);
    const most = Math.max(srcs.length, tgts.length);
    const u = Math.min(24, Math.max(4, (F_MAXH - (most - 1) * F_GAP) / Math.max(1, total)));
    const colH = (n: number) => total * u + (n - 1) * F_GAP;
    const inner = Math.max(colH(srcs.length), colH(tgts.length));

    function place(keys: string[], totals: Map<string, number>) {
      const out = new Map<string, { y: number; h: number }>();
      let y = F_TOP + (inner - colH(keys.length)) / 2;
      for (const k of keys) {
        const h = totals.get(k)! * u;
        out.set(k, { y, h });
        y += h + F_GAP;
      }
      return out;
    }
    const srcPos = place(srcs, srcTotal);
    const tgtPos = place(tgts, tgtTotal);

    // Stack each node's bands in the other side's order, so bands cross as little as possible.
    const y0 = new Map<string, number>();
    const y1 = new Map<string, number>();
    for (const k of srcs) {
      let y = srcPos.get(k)!.y;
      for (const l of links
        .filter((l) => l.from === k)
        .sort((a, b) => tRank(a.to) - tRank(b.to) || kRank(a.kind) - kRank(b.kind))) {
        y0.set(l.id, y);
        y += l.items.length * u;
      }
    }
    for (const k of tgts) {
      let y = tgtPos.get(k)!.y;
      for (const l of links
        .filter((l) => l.to === k)
        .sort((a, b) => tRank(a.from) - tRank(b.from) || kRank(a.kind) - kRank(b.kind))) {
        y1.set(l.id, y);
        y += l.items.length * u;
      }
    }

    const bands = links.map((l) => {
      const a = y0.get(l.id)!;
      const b = y1.get(l.id)!;
      const h = l.items.length * u;
      const x0 = F_LX;
      const x1 = F_RX;
      const xm = (x0 + x1) / 2;
      const d =
        `M${x0},${a} C${xm},${a} ${xm},${b} ${x1},${b} ` +
        `L${x1},${b + h} C${xm},${b + h} ${xm},${a + h} ${x0},${a + h} Z`;
      return { link: l, d };
    });

    return { links, bands, srcs, tgts, srcPos, tgtPos, srcTotal, tgtTotal, H: F_TOP + inner + 10 };
  }, [items]);

  if (layout.links.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[12px] text-muted">
        Nothing to connect yet — the bands appear as the team adds backlog items.
      </p>
    );
  }

  const { links, bands, srcs, tgts, srcPos, tgtPos, srcTotal, tgtTotal, H } = layout;
  const related = (l: Link) => (active ? linkMatches(l, active) : false);
  const involved = (k: string) =>
    !active ||
    (active.type === "node"
      ? active.key === k || links.some((l) => linkMatches(l, active) && (l.from === k || l.to === k))
      : active.from === k || active.to === k);

  function showTip(ev: React.PointerEvent, link: Link) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r)
      setTip({
        // Keep the 280px tooltip inside the map's width.
        x: Math.min(ev.clientX - r.left + 14, r.width - 290),
        y: ev.clientY - r.top + 14,
        link,
      });
  }

  function nodeHandlers(f: Focus) {
    return {
      tabIndex: 0,
      role: "button" as const,
      className: "cursor-pointer outline-none",
      onPointerEnter: () => onHover(f),
      onPointerLeave: () => onHover(null),
      onFocus: () => onHover(f),
      onBlur: () => onHover(null),
      onClick: () => onToggle(f),
      onKeyDown: (ev: React.KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onToggle(f);
        }
      },
    };
  }

  const head = { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", style: { fill: "rgb(var(--muted))" } };

  return (
    <div ref={wrapRef} className="relative" onPointerLeave={() => setTip(null)}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${F_W} ${H}`}
          className="mx-auto w-full min-w-[680px] max-w-[1000px]"
          role="img"
          aria-label="Where things need to connect: stages on the left, where they need to connect on the right"
        >
          <defs>
            {BUILDING_BLOCKS.map((b) => (
              <pattern
                key={b.key}
                id={`fm-hatch-${b.key}`}
                width="7"
                height="7"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="7" height="7" fill={b.hex} fillOpacity="0.12" />
                <rect width="3" height="7" fill={b.hex} fillOpacity="0.6" />
              </pattern>
            ))}
          </defs>

          <text x={F_LX} y={14} textAnchor="end" {...head}>
            COMES FROM
          </text>
          <text x={F_RX} y={14} {...head}>
            NEEDS TO CONNECT TO
          </text>

          {/* Bands */}
          {bands.map(({ link: l, d }) => {
            const hex = blockDef(l.from)!.hex;
            const rel = related(l);
            const n = l.items.length;
            const pair: Focus = { type: "pair", from: l.from, to: l.to };
            return (
              <path
                key={l.id}
                d={d}
                tabIndex={0}
                role="button"
                aria-label={`${blockDef(l.from)!.label} to ${targetLabel(l.to)}: ${n} ${
                  l.kind === "connect" ? "built, need connecting" : "missing"
                }`}
                className="cursor-pointer outline-none"
                fill={l.kind === "connect" ? hex : `url(#fm-hatch-${l.from})`}
                fillOpacity={l.kind === "connect" ? (rel ? 0.8 : 0.5) : 1}
                style={{
                  stroke: "rgb(var(--card))",
                  opacity: active && !rel ? 0.12 : 1,
                  transition: "opacity 120ms",
                }}
                strokeWidth={1}
                onPointerEnter={(ev) => {
                  onHover(pair);
                  showTip(ev, l);
                }}
                onPointerMove={(ev) => showTip(ev, l)}
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
              />
            );
          })}

          {/* Comes from */}
          {srcs.map((k) => {
            const b = blockDef(k)!;
            const { y, h } = srcPos.get(k)!;
            return (
              <g
                key={k}
                aria-label={`${b.label}: ${srcTotal.get(k)} going out`}
                style={{ opacity: involved(k) ? 1 : 0.3, transition: "opacity 120ms" }}
                {...nodeHandlers({ type: "node", key: k })}
              >
                <rect x={F_LX - F_BAR} y={y} width={F_BAR} height={h} rx="2" fill={b.hex} />
                <text x={F_LX - F_BAR - 10} y={y + h / 2 + 4} textAnchor="end" fontSize="12.5">
                  <tspan fontWeight="600" style={{ fill: "rgb(var(--fg))" }}>
                    {b.label}
                  </tspan>
                  <tspan dx="6" style={{ fill: "rgb(var(--muted))" }}>
                    {srcTotal.get(k)}
                  </tspan>
                </text>
              </g>
            );
          })}

          {/* Needs to connect to */}
          {tgts.map((k) => {
            const b = isBlockKey(k) ? blockDef(k)! : null;
            const { y, h } = tgtPos.get(k)!;
            return (
              <g
                key={k}
                aria-label={`${targetLabel(k)}: ${tgtTotal.get(k)} coming in`}
                style={{ opacity: involved(k) ? 1 : 0.3, transition: "opacity 120ms" }}
                {...nodeHandlers({ type: "node", key: k })}
              >
                <rect
                  x={F_RX}
                  y={y}
                  width={F_BAR}
                  height={h}
                  rx="2"
                  style={{ fill: b ? b.hex : "rgb(var(--muted))" }}
                  fillOpacity={b ? 1 : 0.5}
                />
                <text x={F_RX + F_BAR + 10} y={y + h / 2 + 4} fontSize="12.5">
                  <tspan
                    fontWeight="600"
                    fontStyle={b ? undefined : "italic"}
                    style={{ fill: b ? "rgb(var(--fg))" : "rgb(var(--muted))" }}
                  >
                    {targetLabel(k)}
                  </tspan>
                  <tspan dx="6" style={{ fill: "rgb(var(--muted))" }}>
                    {tgtTotal.get(k)}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 w-[280px] rounded-lg border border-line bg-card px-3 py-2 shadow-card"
          style={{ left: tip.x, top: tip.y }}
          role="tooltip"
        >
          <div className="text-sm font-semibold text-fg">
            {blockDef(tip.link.from)!.label} → {targetLabel(tip.link.to)}
          </div>
          <div className="text-[11px] text-muted">
            {tip.link.items.length}{" "}
            {tip.link.kind === "connect" ? "built, need connecting" : "missing, needed"}
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-fg">
            {tip.link.items.slice(0, 5).map((e) => {
              const outside = e.targets.filter((t) => !isBlockKey(t));
              return (
                <li key={e.id} className="truncate">
                  · {e.text}
                  {tip.link.to === OUTSIDE && outside.length > 0 && (
                    <span className="text-muted"> → {outside.join(", ")}</span>
                  )}{" "}
                  <span className="text-muted">({e.member})</span>
                </li>
              );
            })}
            {tip.link.items.length > 5 && (
              <li className="text-muted">+{tip.link.items.length - 5} more</li>
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
