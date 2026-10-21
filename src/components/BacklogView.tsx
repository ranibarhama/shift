"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
 * Stage 2 · 2 · Backlog — the gaps the team mapped in 1 · Today's status:
 * headline numbers, the backlog itself, then a simple ranked list of where
 * things need to connect (one row per place, bar = how many items need it).
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

      <BacklogList items={filtered} ranks={ranks} total={backlog.length} />

      <ConnectList items={filtered} />
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

type Place = {
  key: string;
  label: string;
  kind: "block" | "ext" | "unsure";
  items: BlockInput[];
};

/**
 * One row per place things need to plug into, busiest first. The bar is how
 * many items need that place; "From" says which blocks they come from.
 * Click a row to see the items.
 */
function ConnectList({ items }: { items: BlockInput[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const places = useMemo(() => {
    const m = new Map<string, Place>();
    for (const e of items) {
      for (const t of targetsOf(e)) {
        const cur = m.get(t.key);
        if (cur) cur.items.push(e);
        else m.set(t.key, { key: t.key, label: t.label, kind: t.kind, items: [e] });
      }
    }
    const list = [...m.values()];
    const known = list
      .filter((p) => p.kind !== "unsure")
      .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label));
    const unsure = list.filter((p) => p.kind === "unsure");
    return [...known, ...unsure]; // "Not sure yet" always last
  }, [items]);

  const max = Math.max(1, ...places.map((p) => p.items.length));

  function toggle(key: string) {
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-fg">Where things need to connect</h2>
        <p className="text-[12px] text-muted">
          Each row is a place things need to plug into, busiest first. The bar shows how many
          backlog items need it. Click a row to see them.
        </p>
      </div>

      {places.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-muted">No connections in this view.</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {places.map((p) => {
            const isOpen = open.has(p.key);
            const n = p.items.length;
            const from = BUILDING_BLOCKS.map((b) => ({
              b,
              n: p.items.filter((e) => e.block === b.key).length,
            })).filter((x) => x.n);
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => toggle(p.key)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-1 gap-x-4 gap-y-1.5 rounded-lg px-2 py-3 text-left transition hover:bg-card sm:grid-cols-[220px_minmax(0,1fr)]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-fg">
                    <span
                      className={"shrink-0 text-[10px] text-muted transition " + (isOpen ? "rotate-90" : "")}
                      aria-hidden
                    >
                      ▶
                    </span>
                    {p.kind === "block" ? (
                      <BlockDot block={p.key} />
                    ) : p.kind === "unsure" ? (
                      <span className="italic text-muted">Not sure yet</span>
                    ) : (
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{p.label}</span>
                        <span className="shrink-0 rounded border border-line px-1 text-[9.5px] font-semibold uppercase tracking-wide text-muted">
                          Outside
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="relative h-2.5 flex-1">
                      <span
                        className={
                          "absolute inset-y-0 left-0 rounded-r-[4px] " +
                          (p.kind === "unsure" ? "border border-dashed border-muted/70" : "bg-fg/60")
                        }
                        style={{ width: `${Math.max(2, (n / max) * 100)}%` }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-[12px] font-semibold text-fg">
                      {n} item{n === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted sm:col-start-2">
                    <span>From</span>
                    {from.map(({ b, n: c }) => (
                      <span key={b.key} className="inline-flex items-center gap-1 text-fg">
                        <BlockDot block={b.key} />
                        <span className="text-muted">{c}</span>
                      </span>
                    ))}
                  </span>
                </button>

                {isOpen && (
                  <ul className="mb-3 ml-2 space-y-1 sm:ml-[236px]">
                    {p.items.map((e) => (
                      <li key={e.id} className="rounded-lg bg-card/70 px-3 py-2 text-[12.5px] text-fg">
                        <span className="text-muted" aria-hidden>
                          {KIND_GLYPH[e.kind]}
                        </span>{" "}
                        {e.text}
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                          <CategoryTag category={e.category} />
                          <span>{KIND_LABEL[e.kind]}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            from <BlockDot block={e.block} />
                          </span>
                          <span>·</span>
                          <span>{e.member}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
