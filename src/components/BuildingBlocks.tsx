"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BUILDING_BLOCKS,
  MAX_MEMBER,
  MAX_MISSING,
  MAX_TARGET,
  MAX_TEXT,
  TEAM_MEMBERS,
  blockDef,
  isBlockKey,
  type BlockInput,
  type BlockKey,
  type InputKind,
} from "@/lib/buildingBlocks";

/* -----------------------------------------------------------------------------
 * Slide 00 — the process as building blocks. Each team member adds, per
 * block: what we have now, what's missing (top 3), and what we have that
 * needs a connection (and to where). Shared state lives in BlocksProvider so
 * the page and the presenter overlay stay in sync; it polls for teammates'
 * input while the session runs.
 * -------------------------------------------------------------------------- */

const MEMBER_KEY = "shift_member";
const POLL_MS = 10_000;
const OTHER = "__other";

const KIND_META: Record<InputKind, { label: string; short: string; hex: string; glyph: string }> = {
  have: { label: "What we have now", short: "have", hex: "#22c55e", glyph: "✓" },
  missing: { label: `What's missing — top ${MAX_MISSING}`, short: "missing", hex: "#f59e0b", glyph: "!" },
  connect: { label: "Have it — needs a connection", short: "to connect", hex: "#7c5cff", glyph: "⇄" },
};

/* ============================== State ============================== */

type BlocksCtx = {
  entries: BlockInput[];
  member: string;
  setMember: (m: string) => void;
  add: (block: BlockKey, kind: InputKind, text: string, target?: string) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
};

const BlocksContext = createContext<BlocksCtx | null>(null);

function useBlocks(): BlocksCtx {
  const c = useContext(BlocksContext);
  if (!c) throw new Error("BuildingBlocksSlide must be rendered inside <BlocksProvider>");
  return c;
}

export function BlocksProvider({
  initial,
  children,
}: {
  initial: BlockInput[];
  children: React.ReactNode;
}) {
  const [entries, setEntries] = useState<BlockInput[]>(initial);
  const [member, setMemberState] = useState("");
  // Ignore poll responses that started before our last write (avoids a stale
  // list briefly hiding something we just added or bringing back a removal).
  const mutatedAt = useRef(0);

  useEffect(() => {
    try {
      const m = localStorage.getItem(MEMBER_KEY);
      if (m) setMemberState(m);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setMember = useCallback((m: string) => {
    const v = m.trim().slice(0, MAX_MEMBER);
    setMemberState(v);
    try {
      if (v) localStorage.setItem(MEMBER_KEY, v);
      else localStorage.removeItem(MEMBER_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const refresh = useCallback(async () => {
    const started = Date.now();
    try {
      const r = await fetch("/api/building-blocks", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { inputs: BlockInput[] };
      if (started < mutatedAt.current) return;
      setEntries(d.inputs);
    } catch {
      /* offline — keep what we have */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const add = useCallback(
    async (block: BlockKey, kind: InputKind, text: string, target?: string) => {
      try {
        const r = await fetch("/api/building-blocks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ block, kind, text, target, member }),
        });
        const d = (await r.json().catch(() => ({}))) as { input?: BlockInput; error?: string };
        if (!r.ok || !d.input) return d.error ?? "Couldn't save — try again";
        const input = d.input;
        mutatedAt.current = Date.now();
        setEntries((es) => (es.some((e) => e.id === input.id) ? es : [...es, input]));
        return null;
      } catch {
        return "Couldn't save — check your connection";
      }
    },
    [member]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const r = await fetch(`/api/building-blocks/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ member }),
        });
        if (!r.ok) return "Couldn't remove";
        mutatedAt.current = Date.now();
        setEntries((es) => es.filter((e) => e.id !== id));
        return null;
      } catch {
        return "Couldn't remove — check your connection";
      }
    },
    [member]
  );

  const value = useMemo(
    () => ({ entries, member, setMember, add, remove }),
    [entries, member, setMember, add, remove]
  );
  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>;
}

/* ============================== Slide ============================== */

export function BuildingBlocksSlide() {
  const { entries } = useBlocks();
  const [selected, setSelected] = useState<BlockKey>("research");

  const byBlock = useMemo(() => {
    const m = new Map<BlockKey, BlockInput[]>();
    for (const b of BUILDING_BLOCKS) m.set(b.key, []);
    for (const e of entries) m.get(e.block)?.push(e);
    return m;
  }, [entries]);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted">
        The whole process, block by block. Pick your name, open a block, and add what we have
        today, what&apos;s missing (your top {MAX_MISSING}), and what we have that needs a
        connection — and to where.
      </p>
      <MemberBar />
      <BlocksFlow byBlock={byBlock} selected={selected} onSelect={setSelected} />
      <BlockEditor key={selected} block={selected} entries={byBlock.get(selected) ?? []} />
      <ConnectionsMap entries={entries} />
    </div>
  );
}

/* ---------- Who am I ---------- */

function MemberBar() {
  const { member, setMember } = useBlocks();
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const onRoster = TEAM_MEMBERS.includes(member);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-bg/50 px-4 py-3">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        I am
      </span>
      {TEAM_MEMBERS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMember(m)}
          aria-pressed={member === m}
          className={
            "rounded-full border px-3 py-1 text-xs font-medium transition " +
            (member === m
              ? "border-accent bg-accent text-ink"
              : "border-line bg-card text-fg hover:border-accent/50")
          }
        >
          {m}
        </button>
      ))}
      {member && !onRoster && (
        <span className="rounded-full border border-accent bg-accent px-3 py-1 text-xs font-medium text-ink">
          {member}
        </span>
      )}
      {typing ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setMember(name);
            setName("");
            setTyping(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_MEMBER}
            placeholder="Your name"
            className="w-32 rounded-full border border-line bg-card px-3 py-1 text-xs text-fg focus:border-accent focus:outline-none"
          />
          <button type="submit" className="rounded-full px-2 py-1 text-xs font-semibold text-accent">
            Use
          </button>
          <button
            type="button"
            onClick={() => setTyping(false)}
            className="rounded-full px-1.5 py-1 text-xs text-muted"
            aria-label="Cancel"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setTyping(true)}
          className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-fg"
        >
          + Someone else
        </button>
      )}
      <span className="ml-auto text-[11px] text-muted">
        {member ? (
          <>
            Adding as <span className="font-semibold text-fg">{member}</span>
          </>
        ) : (
          "Pick your name to add input"
        )}
      </span>
    </div>
  );
}

/* ---------- The 7 blocks ---------- */

function BlocksFlow({
  byBlock,
  selected,
  onSelect,
}: {
  byBlock: Map<BlockKey, BlockInput[]>;
  selected: BlockKey;
  onSelect: (b: BlockKey) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-stretch lg:gap-0">
        {BUILDING_BLOCKS.map((b, i) => {
          const list = byBlock.get(b.key) ?? [];
          const count = (k: InputKind) => list.filter((e) => e.kind === k).length;
          const people = [...new Set(list.map((e) => e.member))];
          const active = selected === b.key;
          return (
            <Fragment key={b.key}>
              <button
                type="button"
                onClick={() => onSelect(b.key)}
                aria-pressed={active}
                className={
                  "flex min-w-0 flex-col rounded-2xl border bg-card/70 p-3 text-left transition lg:flex-1 " +
                  (active ? "" : "hover:-translate-y-0.5")
                }
                style={{
                  borderColor: active ? b.hex : `${b.hex}55`,
                  background: active ? `${b.hex}14` : undefined,
                  boxShadow: active
                    ? `inset 0 3px 0 0 ${b.hex}, 0 0 0 2px ${b.hex}`
                    : `inset 0 3px 0 0 ${b.hex}`,
                }}
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold"
                  style={{ background: `${b.hex}22`, color: b.hex }}
                >
                  {i + 1}
                </span>
                <span className="mt-1.5 text-[13px] font-semibold leading-tight text-fg">
                  {b.label}
                </span>
                <span className="mt-2 space-y-0.5">
                  {(["have", "missing", "connect"] as const).map((k) => (
                    <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted">
                      <Glyph kind={k} small />
                      <span className="tabular-nums font-semibold text-fg">{count(k)}</span>
                      {KIND_META[k].short}
                    </span>
                  ))}
                </span>
                {people.length > 0 && (
                  <span className="mt-2 flex -space-x-1.5">
                    {people.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        title={p}
                        className="grid h-5 w-5 place-items-center rounded-full border border-card text-[9px] font-bold text-white"
                        style={{ background: b.hex }}
                      >
                        {p.slice(0, 1).toUpperCase()}
                      </span>
                    ))}
                    {people.length > 4 && (
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-card bg-line text-[9px] font-bold text-fg">
                        +{people.length - 4}
                      </span>
                    )}
                  </span>
                )}
              </button>
              {i < BUILDING_BLOCKS.length - 1 && (
                <span aria-hidden className="hidden shrink-0 items-center px-1 text-[#f97316] lg:flex">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
        Continuous learning feeds the next round of research
      </div>
    </div>
  );
}

/* ---------- Editor for the selected block ---------- */

function BlockEditor({ block, entries }: { block: BlockKey; entries: BlockInput[] }) {
  const { member } = useBlocks();
  const b = blockDef(block)!;
  const people = [...new Set(entries.map((e) => e.member))];
  const of = (k: InputKind) => entries.filter((e) => e.kind === k);

  // Missing: grouped per member, mine first, each list numbered 1–3.
  const missingByMember = useMemo(() => {
    const m = new Map<string, BlockInput[]>();
    for (const e of entries) {
      if (e.kind !== "missing") continue;
      m.set(e.member, [...(m.get(e.member) ?? []), e]);
    }
    return [...m.entries()].sort(([a], [b2]) =>
      a === member ? -1 : b2 === member ? 1 : a.localeCompare(b2)
    );
  }, [entries, member]);
  const myMissing = entries.filter((e) => e.kind === "missing" && e.member === member).length;

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: `${b.hex}55`, background: `${b.hex}0a` }}
    >
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ background: `${b.hex}1f`, color: b.hex }}
        >
          {b.label}
        </span>
        <span className="text-[12px] text-muted">
          {people.length
            ? `${people.length} team member${people.length > 1 ? "s" : ""} added input · ${people.join(", ")}`
            : "No input yet — be the first"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Column kind="have" footer={<AddForm block={block} kind="have" placeholder="e.g. Weekly competitor digest" />}>
          {of("have").length === 0 && <Empty />}
          {of("have").map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </Column>

        <Column
          kind="missing"
          footer={
            <AddForm
              block={block}
              kind="missing"
              placeholder="e.g. One view of user feedback"
              blockedNote={
                myMissing >= MAX_MISSING
                  ? `You've listed your top ${MAX_MISSING} — remove one to change it.`
                  : undefined
              }
            />
          }
        >
          {missingByMember.length === 0 && <Empty />}
          {missingByMember.map(([who, list]) => (
            <div key={who} className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {who === member ? `${who} (you)` : who}
              </div>
              {list.map((e, i) => (
                <EntryRow key={e.id} entry={e} rank={i + 1} hideMember />
              ))}
            </div>
          ))}
        </Column>

        <Column
          kind="connect"
          footer={<AddForm block={block} kind="connect" placeholder="e.g. Support tickets data" withTarget />}
        >
          {of("connect").length === 0 && <Empty />}
          {of("connect").map((e) => (
            <EntryRow key={e.id} entry={e}>
              <TargetPill target={e.target} />
            </EntryRow>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  kind,
  children,
  footer,
}: {
  kind: InputKind;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-card/80 p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <Glyph kind={kind} />
        <span className="text-[12.5px] font-semibold text-fg">{KIND_META[kind].label}</span>
      </div>
      <div className="flex-1 space-y-1.5">{children}</div>
      <div className="mt-3 border-t border-line/60 pt-3">{footer}</div>
    </div>
  );
}

function EntryRow({
  entry,
  rank,
  hideMember,
  children,
}: {
  entry: BlockInput;
  rank?: number;
  hideMember?: boolean;
  children?: React.ReactNode;
}) {
  const { member, remove } = useBlocks();
  const mine = entry.member === member;
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-start gap-2 rounded-lg bg-bg/60 px-2.5 py-1.5 text-[12.5px] leading-snug text-fg">
      {rank !== undefined && (
        <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#f59e0b]/20 text-[9px] font-bold text-[#b45309] dark:text-[#fbbf24]">
          {rank}
        </span>
      )}
      <span className="min-w-0 flex-1 break-words">
        {entry.text}
        {children}
      </span>
      {!hideMember && (
        <span
          className={
            "mt-px shrink-0 rounded-full px-1.5 text-[10px] " +
            (mine ? "bg-accent/15 text-accent" : "bg-line/60 text-muted")
          }
        >
          {entry.member}
        </span>
      )}
      {mine && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await remove(entry.id);
            setBusy(false);
          }}
          aria-label={`Remove "${entry.text}"`}
          title="Remove"
          className="shrink-0 text-[11px] text-muted transition hover:text-drop disabled:opacity-40"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function TargetPill({ target }: { target: string | null }) {
  if (!target) return null;
  const b = isBlockKey(target) ? blockDef(target) : null;
  return (
    <span className="ml-1.5 inline-flex items-center gap-1 whitespace-nowrap align-middle text-[11px]">
      <span className="text-muted">→</span>
      <span
        className="rounded-full px-1.5 py-px font-semibold"
        style={
          b
            ? { background: `${b.hex}1f`, color: b.hex }
            : { background: "rgb(var(--line) / 0.6)", color: "rgb(var(--fg))" }
        }
      >
        {b ? b.label : target}
      </span>
    </span>
  );
}

function AddForm({
  block,
  kind,
  placeholder,
  withTarget,
  blockedNote,
}: {
  block: BlockKey;
  kind: InputKind;
  placeholder: string;
  withTarget?: boolean;
  blockedNote?: string;
}) {
  const { member, add } = useBlocks();
  const [text, setText] = useState("");
  const [target, setTarget] = useState("");
  const [otherTarget, setOtherTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!member) {
    return <p className="text-[11px] text-muted">Pick your name above to add input.</p>;
  }
  if (blockedNote) {
    return <p className="text-[11px] text-muted">{blockedNote}</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const where = withTarget ? (target === OTHER ? otherTarget.trim() : target) : undefined;
    if (withTarget && !where) {
      setError("Choose where it needs to connect");
      return;
    }
    setBusy(true);
    const err = await add(block, kind, t, where);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setText("");
      setOtherTarget("");
      setError(null);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[12.5px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-1.5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_TEXT}
        placeholder={placeholder}
        aria-label={KIND_META[kind].label}
        className={inputCls}
      />
      {withTarget && (
        <>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Needs to connect to"
            className={inputCls}
          >
            <option value="">Needs to connect to…</option>
            {BUILDING_BLOCKS.filter((b) => b.key !== block).map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
            <option value={OTHER}>Somewhere else (a system, a team…)</option>
          </select>
          {target === OTHER && (
            <input
              value={otherTarget}
              onChange={(e) => setOtherTarget(e.target.value)}
              maxLength={MAX_TARGET}
              placeholder="e.g. Salesforce, the Data team"
              aria-label="Where it needs to connect"
              className={inputCls}
            />
          )}
        </>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] text-drop">{error}</span>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-ink transition hover:brightness-110 disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}

/* ---------- Connections map ---------- */

function ConnectionsMap({ entries }: { entries: BlockInput[] }) {
  const { links, outside } = useMemo(() => {
    const blockLinks = new Map<string, { from: number; to: number; n: number }>();
    const elsewhere = new Map<string, { from: BlockKey; to: string; n: number }>();
    const idx = (k: string) => BUILDING_BLOCKS.findIndex((b) => b.key === k);
    for (const e of entries) {
      if (e.kind !== "connect" || !e.target) continue;
      if (isBlockKey(e.target)) {
        const key = `${e.block}>${e.target}`;
        const cur = blockLinks.get(key);
        if (cur) cur.n += 1;
        else blockLinks.set(key, { from: idx(e.block), to: idx(e.target), n: 1 });
      } else {
        const key = `${e.block}>${e.target.toLowerCase()}`;
        const cur = elsewhere.get(key);
        if (cur) cur.n += 1;
        else elsewhere.set(key, { from: e.block, to: e.target, n: 1 });
      }
    }
    return { links: [...blockLinks.values()], outside: [...elsewhere.values()] };
  }, [entries]);

  const BASE = 168;
  const Y0 = BASE - 13;
  const x = (i: number) => 50 + i * 100;
  const arcHeight = (from: number, to: number) =>
    14 + Math.abs(to - from) * 12 + (to < from ? 9 : 0);
  // Crop the canvas to the tallest arc actually drawn (plus room for its "×n").
  const top = Math.min(
    BASE - 50,
    ...links.map((l) => Y0 - arcHeight(l.from, l.to) - 20)
  );

  return (
    <div className="rounded-2xl border border-line bg-bg/40 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Glyph kind="connect" />
        <span className="text-[12.5px] font-semibold text-fg">Connections map</span>
        <span className="text-[11px] text-muted">
          · what we have, and where it needs to connect
        </span>
      </div>

      {links.length === 0 && outside.length === 0 ? (
        <p className="py-4 text-[12px] text-muted">
          Connections between blocks will be drawn here as the team adds them.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 ${top} 700 ${224 - top}`}
              className="mx-auto w-full min-w-[560px] max-w-3xl"
              role="img"
              aria-label="Connections between building blocks"
            >
              <defs>
                {BUILDING_BLOCKS.map((b) => (
                  <marker
                    key={b.key}
                    id={`bb-arrow-${b.key}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" fill={b.hex} />
                  </marker>
                ))}
              </defs>
              {links.map((l) => {
                const from = BUILDING_BLOCKS[l.from];
                const back = l.to < l.from;
                const h = arcHeight(l.from, l.to);
                const y0 = Y0;
                const mid = (x(l.from) + x(l.to)) / 2;
                return (
                  <g key={`${l.from}-${l.to}`}>
                    <path
                      d={`M${x(l.from)} ${y0} Q${mid} ${y0 - 2 * h} ${x(l.to)} ${y0}`}
                      fill="none"
                      stroke={from.hex}
                      strokeWidth={1.5 + Math.min(l.n, 5) * 0.7}
                      strokeDasharray={back ? "5 4" : undefined}
                      strokeLinecap="round"
                      markerEnd={`url(#bb-arrow-${from.key})`}
                      opacity={0.85}
                    />
                    {l.n > 1 && (
                      <text
                        x={mid}
                        y={y0 - h - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill={from.hex}
                      >
                        ×{l.n}
                      </text>
                    )}
                  </g>
                );
              })}
              {BUILDING_BLOCKS.map((b, i) => (
                <g key={b.key}>
                  <circle cx={x(i)} cy={BASE} r="10" fill={b.hex} />
                  <text
                    x={x(i)}
                    y={BASE + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {i + 1}
                  </text>
                  <text
                    x={x(i)}
                    y={BASE + 28}
                    textAnchor="middle"
                    fontSize="11"
                    className="fill-current text-fg"
                  >
                    {b.mapLines.map((line, li) => (
                      <tspan key={line} x={x(i)} dy={li === 0 ? 0 : 13}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          {outside.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                Outside the blocks
              </span>
              {outside.map((o) => {
                const b = blockDef(o.from)!;
                return (
                  <span
                    key={`${o.from}-${o.to}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2 py-0.5 text-[11px] text-fg"
                  >
                    <span className="font-semibold" style={{ color: b.hex }}>
                      {b.label}
                    </span>
                    <span className="text-muted">→</span>
                    {o.to}
                    {o.n > 1 && <span className="text-muted">×{o.n}</span>}
                  </span>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[10.5px] text-muted">
            Solid arcs point forward in the flow, dashed arcs point back. Thicker = more people
            flagged it.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------- Small bits ---------- */

function Glyph({ kind, small }: { kind: InputKind; small?: boolean }) {
  const k = KIND_META[kind];
  return (
    <span
      aria-hidden
      className={
        "grid shrink-0 place-items-center rounded-full font-bold " +
        (small ? "h-3.5 w-3.5 text-[8px]" : "h-5 w-5 text-[10px]")
      }
      style={{ background: `${k.hex}26`, color: k.hex }}
    >
      {k.glyph}
    </span>
  );
}

function Empty() {
  return <p className="text-[11.5px] italic text-muted">Nothing yet.</p>;
}
