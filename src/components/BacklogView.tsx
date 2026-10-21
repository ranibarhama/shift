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
 * Stage 2 · 2 · Backlog — everything the team entered in 1 · Today's status,
 * as KPIs, a connection map (what needs to connect to where), a from×to
 * heatmap (the map's table view) and the full backlog list.
 *
 * Color: blocks own the categorical palette (validated, process order).
 * Edges are neutral until a block or link is focused (emphasis), kind is
 * carried by line style (solid = needs a connection, dashed = missing),
 * magnitude by thickness and the one-hue heat ramp. Categories are labels.
 * -------------------------------------------------------------------------- */

const POLL_MS = 15_000;
/** Outside nodes shown before the tail folds into "+N more" (keeps labels readable). */
const MAX_EXTERNALS = 7;

type KindFilter = "all" | InputKind;
type Focus = { type: "node"; key: string } | { type: "pair"; from: string; to: string };

type Target = { key: string; label: string; kind: "block" | "ext" | "unsure" };

type MapEdge = {
  id: string;
  from: BlockKey;
  toKey: string;
  toKind: Target["kind"];
  kind: "connect" | "missing";
  items: BlockInput[];
};

type BottomNode = { key: string; label: string; kind: "ext" | "unsure" | "more"; n: number };

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
  const [pinned, setPinned] = useState<Focus | null>(null);
  const [hover, setHover] = useState<Focus | null>(null);

  // Keep up with the team while Session 1 is still running.
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/building-blocks", { cache: "no-store" });
        if (r.ok) setEntries(((await r.json()) as { inputs: BlockInput[] }).inputs);
      } catch {
        /* keep the current frame */
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

  const people = useMemo(
    () => [...new Set(entries.map((e) => e.member))].sort((a, b) => a.localeCompare(b)),
    [entries]
  );
  const ranks = useMemo(() => missingRanks(entries), [entries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
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
  }, [entries, kind, block, category, person, q]);

  const anyFilter = kind !== "all" || block !== "all" || category !== "all" || person !== "all" || !!q;
  const active = hover ?? pinned;

  function toggle(f: Focus) {
    setPinned((p) => (p && sameFocus(p, f) ? null : f));
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-card/40 px-6 py-16 text-center">
        <div className="text-sm font-semibold text-fg">The backlog is empty — for now</div>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          It fills up as the team maps today&apos;s status in session 1: what we have, what&apos;s
          missing and what needs connecting.
        </p>
        <a
          href="/stage-2/session-1#blocks"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-ink transition hover:brightness-110"
        >
          Go to 1 · Today&apos;s status →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* One filter row — scopes everything below it */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card/60 px-4 py-3">
        <div role="radiogroup" aria-label="Type" className="flex rounded-full border border-line bg-bg p-0.5">
          {(["all", "missing", "connect", "have"] as const).map((k) => (
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
        <Select label="Block" value={block} onChange={(v) => setBlock(v as BlockKey | "all")}>
          <option value="all">All blocks</option>
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

      <ConnectionMap
        items={filtered}
        active={active}
        pinned={pinned}
        onHover={setHover}
        onToggle={toggle}
      />

      <HeatMatrix items={filtered} active={active} onHover={setHover} onToggle={toggle} />

      <BacklogList items={filtered} ranks={ranks} total={entries.length} />
    </div>
  );
}

function sameFocus(a: Focus, b: Focus) {
  if (a.type === "node" && b.type === "node") return a.key === b.key;
  if (a.type === "pair" && b.type === "pair") return a.from === b.from && a.to === b.to;
  return false;
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
    { label: "Items", value: items.length },
    { label: "Missing", value: n("missing") },
    { label: "Need a connection", value: n("connect") },
    { label: "We have", value: n("have") },
    { label: "Not sure where to connect", value: unsure },
    { label: "Contributors", value: new Set(items.map((e) => e.member)).size },
  ];
  const uncategorized = items.filter((e) => !e.category).length;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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

/* ============================== Map data ============================== */

function useGraph(items: BlockInput[]) {
  return useMemo(() => {
    const edges = new Map<string, MapEdge>();
    const ext = new Map<string, { key: string; label: string; n: number }>();
    let unsureN = 0;

    for (const e of items) {
      if (e.kind === "have") continue;
      const kind = e.kind;
      for (const t of targetsOf(e)) {
        if (t.kind === "ext") {
          const cur = ext.get(t.key);
          if (cur) cur.n += 1;
          else ext.set(t.key, { key: t.key, label: t.label, n: 1 });
        }
        if (t.kind === "unsure") unsureN += 1;
        const id = `${e.block}|${t.key}|${kind}`;
        const cur = edges.get(id);
        if (cur) cur.items.push(e);
        else edges.set(id, { id, from: e.block, toKey: t.key, toKind: t.kind, kind, items: [e] });
      }
    }

    // Outside targets: biggest first; fold the tail into one "+N more" node.
    const sorted = [...ext.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
    const shown = sorted.length > MAX_EXTERNALS ? sorted.slice(0, MAX_EXTERNALS - 1) : sorted;
    const folded = new Set(sorted.slice(shown.length).map((x) => x.key));
    const bottom: BottomNode[] = shown.map((x) => ({ ...x, kind: "ext" as const }));
    if (folded.size) {
      const n = sorted.slice(shown.length).reduce((s, x) => s + x.n, 0);
      bottom.push({ key: "ext:__more", label: `+${folded.size} more`, kind: "more", n });
    }
    if (unsureN) bottom.push({ key: "unsure", label: "Not sure yet", kind: "unsure", n: unsureN });

    // Re-key folded edges onto the "+N more" node.
    const merged = new Map<string, MapEdge>();
    for (const ed of edges.values()) {
      const toKey = folded.has(ed.toKey) ? "ext:__more" : ed.toKey;
      const id = `${ed.from}|${toKey}|${ed.kind}`;
      const cur = merged.get(id);
      if (cur) cur.items.push(...ed.items);
      else merged.set(id, { ...ed, id, toKey, items: [...ed.items] });
    }

    // Link counts per block (item × target pairs).
    const out = new Map<string, number>();
    const inn = new Map<string, number>();
    for (const ed of merged.values()) {
      out.set(ed.from, (out.get(ed.from) ?? 0) + ed.items.length);
      inn.set(ed.toKey, (inn.get(ed.toKey) ?? 0) + ed.items.length);
    }

    return { edges: [...merged.values()], bottom, out, inn, folded };
  }, [items]);
}

function labelForKey(key: string, bottom: BottomNode[]): string {
  if (isBlockKey(key)) return blockDef(key)!.label;
  return bottom.find((b) => b.key === key)?.label ?? key.replace(/^ext:/, "");
}

/* ============================== Connection map ============================== */

const W = 1000;
const PW = 124;
const PH = 56;
const GAP = 140;
const X0 = 76;
const bx = (i: number) => X0 + i * GAP;
const bIndex = (k: string) => BUILDING_BLOCKS.findIndex((b) => b.key === k);
const arcH = (from: number, to: number) => 26 + Math.abs(to - from) * 20 + (to < from ? 16 : 0);
const strokeW = (n: number) => 1.25 + Math.min(n, 6) * 0.95;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Spread ports along a node edge so links don't bundle at one point:
 *  rightward links leave from the right and land on the target's left, farther
 *  out the longer the link. */
const portOff = (dist: number) => 12 + dist * 7;

function edgeMatches(e: MapEdge, f: Focus) {
  return f.type === "node"
    ? e.from === f.key || e.toKey === f.key
    : e.from === f.from && e.toKey === f.to;
}

function ConnectionMap({
  items,
  active,
  pinned,
  onHover,
  onToggle,
}: {
  items: BlockInput[];
  active: Focus | null;
  pinned: Focus | null;
  onHover: (f: Focus | null) => void;
  onToggle: (f: Focus) => void;
}) {
  const { edges, bottom, out, inn } = useGraph(items);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; value: string; label: string } | null>(
    null
  );

  const internal = edges.filter((e) => e.toKind === "block");
  const external = edges.filter((e) => e.toKind !== "block");
  const maxH = internal.reduce((m, e) => Math.max(m, arcH(bIndex(e.from), bIndex(e.toKey))), 0);
  const BY = Math.max(28, maxH + 26);
  const BOTTOM_Y = BY + PH + 140;
  const BOTTOM_H = 44;
  const H = bottom.length ? BOTTOM_Y + BOTTOM_H + 18 : BY + PH + 22;
  const slotW = bottom.length ? W / bottom.length : W;
  const bottomW = Math.min(176, slotW - 14);
  const ex = (k: number) => slotW * (k + 0.5);

  const involved = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>();
    if (active.type === "node") s.add(active.key);
    else {
      s.add(active.from);
      s.add(active.to);
    }
    for (const e of edges) {
      if (edgeMatches(e, active)) {
        s.add(e.from);
        s.add(e.toKey);
      }
    }
    return s;
  }, [active, edges]);

  /** Emphasis color for a related edge: the focused block's hue, else ink. */
  function focusStroke(e: MapEdge): string {
    if (active?.type === "node" && isBlockKey(active.key)) return blockDef(active.key)!.hex;
    if (active?.type === "pair") return blockDef(e.from)!.hex;
    return "rgb(var(--fg))";
  }

  function showTip(ev: React.PointerEvent, e: MapEdge) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const nConnect = e.kind === "connect" ? e.items.length : 0;
    setTip({
      x: ev.clientX - r.left + 14,
      y: ev.clientY - r.top + 14,
      value: `${e.items.length} item${e.items.length > 1 ? "s" : ""}`,
      label: `${blockDef(e.from)!.label} → ${labelForKey(e.toKey, bottom)} · ${
        nConnect ? "need a connection" : "missing"
      }`,
    });
  }

  const totalLinks = edges.reduce((s, e) => s + e.items.length, 0);

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Where things need to connect</h2>
          <p className="text-[12px] text-muted">
            {totalLinks} link{totalLinks === 1 ? "" : "s"} from {items.filter((e) => e.kind !== "have").length}{" "}
            items. Hover or click a block, a link or a matrix cell to trace it.
          </p>
        </div>
        <Legend />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div ref={wrapRef} className="relative overflow-x-auto" onPointerLeave={() => setTip(null)}>
          {edges.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-muted">
              No connections in this view yet.
            </p>
          ) : (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full min-w-[760px]"
              role="img"
              aria-label="Connection map between building blocks and outside systems"
            >
              <defs>
                {[
                  ["muted", "rgb(var(--muted))"],
                  ["fg", "rgb(var(--fg))"],
                  ...BUILDING_BLOCKS.map((b) => [b.key, b.hex]),
                ].map(([id, color]) => (
                  <marker
                    key={id}
                    id={`bl-arrow-${id}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" style={{ fill: color }} />
                  </marker>
                ))}
              </defs>

              {bottom.length > 0 && (
                <text x={8} y={BOTTOM_Y - 14} fontSize="11" style={{ fill: "rgb(var(--muted))" }}>
                  Outside the blocks — systems, teams, open questions
                </text>
              )}

              {/* Edges */}
              {[...internal, ...external].map((e) => {
                const fi = bIndex(e.from);
                const related = active ? edgeMatches(e, active) : false;
                const dim = !!active && !related;
                const color = related ? focusStroke(e) : "rgb(var(--muted))";
                const markerId = related
                  ? active?.type === "node" && !isBlockKey(active.key)
                    ? "fg"
                    : active?.type === "pair"
                      ? e.from
                      : (active as { key: string }).key
                  : "muted";
                const off = e.kind === "connect" ? -3 : 3;
                let d: string;
                let badge: [number, number];
                if (e.toKind === "block") {
                  const ti = bIndex(e.toKey);
                  const h = arcH(fi, ti);
                  const dir = Math.sign(ti - fi);
                  const p = portOff(Math.abs(ti - fi));
                  const x1 = bx(fi) + dir * p + off;
                  const x2 = bx(ti) - dir * p + off;
                  const mid = (x1 + x2) / 2;
                  d = `M${x1} ${BY} Q${mid} ${BY - 2 * h} ${x2} ${BY - 3}`;
                  badge = [mid, BY - h];
                } else {
                  const k = bottom.findIndex((b) => b.key === e.toKey);
                  const rel = (ex(k) - bx(fi)) / W; // -1..1, where the target sits
                  const x1 = bx(fi) + clamp(rel * 110, -50, 50) + off;
                  const x2 = ex(k) + clamp(-rel * 90, -(bottomW / 2 - 14), bottomW / 2 - 14) + off;
                  const y1 = BY + PH;
                  const y2 = BOTTOM_Y;
                  d = `M${x1} ${y1} C${x1} ${y1 + 70} ${x2} ${y2 - 70} ${x2} ${y2 - 3}`;
                  badge = [(x1 + x2) / 2, (y1 + y2) / 2];
                }
                const n = e.items.length;
                const pair: Focus = { type: "pair", from: e.from, to: e.toKey };
                return (
                  <g
                    key={e.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${blockDef(e.from)!.label} to ${labelForKey(e.toKey, bottom)}: ${n} ${
                      e.kind === "connect" ? "need a connection" : "missing"
                    }`}
                    className="cursor-pointer outline-none"
                    style={{ opacity: dim ? 0.12 : 1, transition: "opacity 120ms" }}
                    onPointerEnter={(ev) => {
                      onHover(pair);
                      showTip(ev, e);
                    }}
                    onPointerMove={(ev) => showTip(ev, e)}
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
                      strokeOpacity={related ? 1 : 0.5}
                      strokeWidth={strokeW(n)}
                      strokeDasharray={e.kind === "missing" ? "6 5" : undefined}
                      strokeLinecap="round"
                      markerEnd={`url(#bl-arrow-${markerId})`}
                    />
                    {/* Hit area wider than the line */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
                    {n > 1 && (
                      <g>
                        <circle
                          cx={badge[0]}
                          cy={badge[1]}
                          r="9"
                          style={{ fill: "rgb(var(--card))", stroke: color }}
                          strokeWidth="1.5"
                        />
                        <text
                          x={badge[0]}
                          y={badge[1] + 3.5}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          style={{ fill: "rgb(var(--fg))" }}
                        >
                          {n}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Block nodes */}
              {BUILDING_BLOCKS.map((b, i) => {
                const focus: Focus = { type: "node", key: b.key };
                const on = pinned?.type === "node" && pinned.key === b.key;
                const dim = !!involved && !involved.has(b.key);
                const x = bx(i) - PW / 2;
                const lines = b.mapLines;
                return (
                  <g
                    key={b.key}
                    tabIndex={0}
                    role="button"
                    aria-label={`${b.label}: ${out.get(b.key) ?? 0} links out, ${inn.get(b.key) ?? 0} in`}
                    aria-pressed={on}
                    className="cursor-pointer outline-none"
                    style={{ opacity: dim ? 0.35 : 1, transition: "opacity 120ms" }}
                    onPointerEnter={() => onHover(focus)}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover(focus)}
                    onBlur={() => onHover(null)}
                    onClick={() => onToggle(focus)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        onToggle(focus);
                      }
                    }}
                  >
                    <rect
                      x={x}
                      y={BY}
                      width={PW}
                      height={PH}
                      rx="12"
                      style={{ fill: "rgb(var(--card))", stroke: on ? b.hex : "rgb(var(--line))" }}
                      strokeWidth={on ? 2 : 1}
                    />
                    <rect x={x + 10} y={BY} width={PW - 20} height="3" rx="1.5" fill={b.hex} />
                    <circle cx={x + 14} cy={BY + 18} r="4.5" fill={b.hex} />
                    {lines.map((line, li) => (
                      <text
                        key={line}
                        x={x + 24}
                        y={BY + 22 + li * 13}
                        fontSize="11.5"
                        fontWeight="600"
                        style={{ fill: "rgb(var(--fg))" }}
                      >
                        {line}
                      </text>
                    ))}
                    <text
                      x={x + 14}
                      y={BY + PH - 9}
                      fontSize="10"
                      style={{ fill: "rgb(var(--muted))" }}
                    >
                      ↗ {out.get(b.key) ?? 0} out · ↘ {inn.get(b.key) ?? 0} in
                    </text>
                  </g>
                );
              })}

              {/* Outside nodes */}
              {bottom.map((nd, k) => {
                const focus: Focus = { type: "node", key: nd.key };
                const on = pinned?.type === "node" && pinned.key === nd.key;
                const dim = !!involved && !involved.has(nd.key);
                const cx = ex(k);
                const maxChars = Math.max(6, Math.floor((bottomW - 14) / 6.2));
                const text = nd.label.length > maxChars ? nd.label.slice(0, maxChars - 1) + "…" : nd.label;
                return (
                  <g
                    key={nd.key}
                    tabIndex={0}
                    role="button"
                    aria-label={`${nd.label}: ${nd.n} link${nd.n > 1 ? "s" : ""}`}
                    aria-pressed={on}
                    className="cursor-pointer outline-none"
                    style={{ opacity: dim ? 0.35 : 1, transition: "opacity 120ms" }}
                    onPointerEnter={() => onHover(focus)}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover(focus)}
                    onBlur={() => onHover(null)}
                    onClick={() => onToggle(focus)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        onToggle(focus);
                      }
                    }}
                  >
                    <title>{nd.label}</title>
                    <rect
                      x={cx - bottomW / 2}
                      y={BOTTOM_Y}
                      width={bottomW}
                      height={BOTTOM_H}
                      rx="12"
                      style={{
                        fill: "rgb(var(--card))",
                        stroke: on ? "rgb(var(--fg))" : "rgb(var(--line))",
                      }}
                      strokeWidth={on ? 2 : 1}
                      strokeDasharray={nd.kind === "unsure" ? "4 4" : undefined}
                    />
                    <text
                      x={cx}
                      y={BOTTOM_Y + 19}
                      textAnchor="middle"
                      fontSize="11.5"
                      fontWeight="600"
                      fontStyle={nd.kind === "unsure" ? "italic" : undefined}
                      style={{ fill: nd.kind === "unsure" ? "rgb(var(--muted))" : "rgb(var(--fg))" }}
                    >
                      {text}
                    </text>
                    <text
                      x={cx}
                      y={BOTTOM_Y + 34}
                      textAnchor="middle"
                      fontSize="10"
                      style={{ fill: "rgb(var(--muted))" }}
                    >
                      {nd.n} link{nd.n === 1 ? "" : "s"}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {tip && (
            <div
              className="pointer-events-none absolute z-10 max-w-[260px] rounded-lg border border-line bg-card px-3 py-2 shadow-card"
              style={{ left: tip.x, top: tip.y }}
              role="tooltip"
            >
              <div className="text-sm font-semibold text-fg">{tip.value}</div>
              <div className="text-[11px] text-muted">{tip.label}</div>
            </div>
          )}
        </div>

        <MapPanel
          items={items}
          edges={edges}
          bottom={bottom}
          active={active}
          pinned={pinned}
          onToggle={onToggle}
        />
      </div>
    </section>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="8" aria-hidden>
          <line x1="1" y1="4" x2="25" y2="4" style={{ stroke: "rgb(var(--fg))" }} strokeWidth="2" strokeLinecap="round" />
        </svg>
        Have it — needs a connection
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="26" height="8" aria-hidden>
          <line x1="1" y1="4" x2="25" y2="4" style={{ stroke: "rgb(var(--fg))" }} strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
        </svg>
        Missing — should connect
      </span>
      <span>Thicker = more items</span>
    </div>
  );
}

/* ---------- Side panel: insights, or the items behind the focus ---------- */

function MapPanel({
  items,
  edges,
  bottom,
  active,
  pinned,
  onToggle,
}: {
  items: BlockInput[];
  edges: MapEdge[];
  bottom: BottomNode[];
  active: Focus | null;
  pinned: Focus | null;
  onToggle: (f: Focus) => void;
}) {
  if (active) {
    const rel = edges.filter((e) => edgeMatches(e, active));
    const title =
      active.type === "node"
        ? labelForKey(active.key, bottom)
        : `${labelForKey(active.from, bottom)} → ${labelForKey(active.to, bottom)}`;
    const groups = new Map<string, BlockInput[]>();
    for (const e of rel) {
      const k =
        active.type === "node" && active.key === e.from
          ? `→ ${labelForKey(e.toKey, bottom)}`
          : `${blockDef(e.from)!.label} →`;
      groups.set(k, [...(groups.get(k) ?? []), ...e.items]);
    }
    const count = rel.reduce((s, e) => s + e.items.length, 0);
    return (
      <aside className="rounded-2xl border border-line bg-bg/50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              {pinned ? "Pinned" : "Tracing"}
            </div>
            <div className="text-sm font-semibold text-fg">{title}</div>
            <div className="text-[11px] text-muted">
              {count} link{count === 1 ? "" : "s"}
            </div>
          </div>
          {pinned && (
            <button
              type="button"
              onClick={() => onToggle(pinned)}
              className="rounded-full px-2 py-0.5 text-[11px] text-muted hover:text-fg"
            >
              Clear ✕
            </button>
          )}
        </div>
        <div className="mt-3 max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {count === 0 && <p className="text-[12px] text-muted">Nothing links here in this view.</p>}
          {[...groups.entries()].map(([g, list]) => (
            <div key={g}>
              <div className="mb-1 text-[11px] font-semibold text-fg">{g}</div>
              <ul className="space-y-1">
                {list.map((e) => (
                  <li key={e.id + g} className="rounded-lg bg-card/70 px-2 py-1.5 text-[12px] text-fg">
                    <span className="text-muted">{KIND_GLYPH[e.kind]}</span> {e.text}
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10.5px] text-muted">
                      <CategoryTag category={e.category} />
                      <BlockDot block={e.block} /> · {e.member}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // Insights (nothing focused)
  const pairs = new Map<string, { from: BlockKey; to: string; n: number }>();
  const dest = new Map<string, number>();
  for (const e of edges) {
    const k = `${e.from}|${e.toKey}`;
    const cur = pairs.get(k);
    if (cur) cur.n += e.items.length;
    else pairs.set(k, { from: e.from, to: e.toKey, n: e.items.length });
    if (e.toKey !== "unsure") dest.set(e.toKey, (dest.get(e.toKey) ?? 0) + e.items.length);
  }
  const topPairs = [...pairs.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  const topDest = [...dest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const unsure = items.filter((e) => e.kind === "missing" && e.unsure).length;

  return (
    <aside className="space-y-4 rounded-2xl border border-line bg-bg/50 p-3">
      <InsightList title="Most-needed links">
        {topPairs.length === 0 && <Muted>No links yet.</Muted>}
        {topPairs.map((p) => (
          <InsightRow
            key={`${p.from}|${p.to}`}
            onClick={() => onToggle({ type: "pair", from: p.from, to: p.to })}
            label={
              <>
                <BlockDot block={p.from} /> → {labelForKey(p.to, bottom)}
              </>
            }
            value={p.n}
          />
        ))}
      </InsightList>
      <InsightList title="Most-needed destinations">
        {topDest.length === 0 && <Muted>No destinations yet.</Muted>}
        {topDest.map(([k, n]) => (
          <InsightRow
            key={k}
            onClick={() => onToggle({ type: "node", key: k })}
            label={isBlockKey(k) ? <BlockDot block={k} /> : <>{labelForKey(k, bottom)}</>}
            value={n}
          />
        ))}
      </InsightList>
      <InsightList title="Open questions">
        {unsure ? (
          <InsightRow
            onClick={() => onToggle({ type: "node", key: "unsure" })}
            label={<span className="italic">Missing — not sure where to connect</span>}
            value={unsure}
          />
        ) : (
          <Muted>None — every missing item has a destination.</Muted>
        )}
      </InsightList>
    </aside>
  );
}

function InsightList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InsightRow({
  label,
  value,
  onClick,
}: {
  label: React.ReactNode;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-fg transition hover:bg-card"
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-semibold">{value}</span>
    </button>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="px-2 text-[12px] text-muted">{children}</p>;
}

/** Block identity: a colored dot beside ink text (text never wears the data color). */
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

/* ============================== Heat matrix (table view) ============================== */

function HeatMatrix({
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
    { key: "outside", label: "Outside the blocks", block: false },
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
  const max = Math.max(0, ...counts.values());
  const step = (n: number) => (n <= 0 || max === 0 ? 0 : Math.max(1, Math.ceil((n / max) * 6)));

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">From → to, in numbers</h2>
          <p className="text-[12px] text-muted">
            Rows are where the need comes from; columns are where it needs to connect.
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
        <table className="w-full min-w-[760px] border-separate text-[12px]" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                From \ To
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-1 py-1.5 align-bottom font-semibold text-fg">
                  <span className="flex flex-col items-center gap-1 text-center text-[11px] leading-tight">
                    {c.block ? (
                      <span className="h-2 w-2 rounded-full" style={{ background: blockDef(c.key)!.hex }} aria-hidden />
                    ) : null}
                    <span className={c.block ? "" : "italic text-muted"}>{c.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUILDING_BLOCKS.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="whitespace-nowrap px-2 py-1 text-left font-semibold text-fg">
                  <BlockDot block={r.key} />
                </th>
                {cols.map((c) => {
                  if (c.key === r.key) {
                    return (
                      <td key={c.key} className="rounded bg-line/30 text-center text-muted" aria-label="same block">
                        —
                      </td>
                    );
                  }
                  const n = counts.get(`${r.key}|${c.key}`) ?? 0;
                  const s = step(n);
                  const pair: Focus | null =
                    n && c.key !== "outside" ? { type: "pair", from: r.key, to: c.key } : null;
                  const hot =
                    !!active &&
                    !!pair &&
                    active.type === "pair" &&
                    active.from === r.key &&
                    active.to === c.key;
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
                        "h-9 rounded text-center font-semibold outline-none transition " +
                        (n ? "cursor-pointer" : "text-muted/50") +
                        (hot ? " ring-2 ring-fg" : "")
                      }
                      style={
                        s
                          ? { background: `var(--hm-${s})`, color: `var(--hm-${s}-ink)` }
                          : undefined
                      }
                    >
                      {n || "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
  const order: Record<InputKind, number> = { missing: 0, connect: 1, have: 2 };
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
      ["Block", "Owners", "Type", "Rank", "Category", "Item", "Connects to", "Added by", "Added at"],
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
    a.download = "shift-stage2-backlog.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Backlog</h2>
          <p className="text-[12px] text-muted">
            {`${items.length} of ${total} items · grouped by block · missing first, ranked by each person's top 3`}
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
                  {b.owners.length > 1 ? "Owners" : "Owner"} · {b.owners.join(", ")}
                </span>
                <span className="ml-auto text-[11px] text-muted">
                  {(["missing", "connect", "have"] as const)
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
                          {e.kind === "have" ? (
                            <span className="text-muted">—</span>
                          ) : e.unsure ? (
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
