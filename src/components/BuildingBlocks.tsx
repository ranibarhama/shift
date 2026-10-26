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
  CATEGORIES,
  MAX_MEMBER,
  MAX_MISSING,
  MAX_TARGET,
  MAX_TEXT,
  TEAM_MEMBERS,
  blockDef,
  categoryDef,
  isBlockKey,
  isFoundation,
  type BlockInput,
  type BlockKey,
  type CategoryKey,
  type InputKind,
} from "@/lib/buildingBlocks";
import { enteredAtEnd, usePresentStops } from "./PresentMode";

/* -----------------------------------------------------------------------------
 * Gaps and Connections — the process as building blocks. Each team member adds, per
 * block: what we have now (and, if it needs one, where it should connect) and
 * what's missing (top 3). A "have" item with places to connect is saved as
 * kind "connect", so it lands in the backlog. Shared state lives in BlocksProvider so
 * the page and the presenter overlay stay in sync; it polls for teammates'
 * input while the session runs.
 * -------------------------------------------------------------------------- */

const MEMBER_KEY = "shift_member";
const POLL_MS = 10_000;

const KIND_META: Record<InputKind, { label: string; short: string; hex: string; glyph: string }> = {
  have: { label: "What we already built", short: "have", hex: "#22c55e", glyph: "✓" },
  missing: { label: `What's missing — your top ${MAX_MISSING} by priority`, short: "missing", hex: "#f59e0b", glyph: "!" },
  connect: { label: "Have it — needs a connection", short: "to connect", hex: "#7c5cff", glyph: "⇄" },
};

/* ============================== State ============================== */

/** Where an item needs to connect: one or more places, or "not sure". */
type Where = { targets: string[]; unsure: boolean };

type BlocksCtx = {
  entries: BlockInput[];
  member: string;
  setMember: (m: string) => void;
  add: (
    block: BlockKey,
    kind: InputKind,
    text: string,
    category: CategoryKey,
    where?: Where
  ) => Promise<string | null>;
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
    async (
      block: BlockKey,
      kind: InputKind,
      text: string,
      category: CategoryKey,
      where?: Where
    ) => {
      try {
        const r = await fetch("/api/building-blocks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            block,
            kind,
            text,
            category,
            targets: where?.targets ?? [],
            unsure: where?.unsure ?? false,
            member,
          }),
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
  const flowRef = useRef<HTMLDivElement>(null);
  // Present mode: -1 = the page's opening view, then one stop per stage.
  const stop = useRef(-1);

  const select = useCallback((k: BlockKey) => {
    stop.current = BUILDING_BLOCKS.findIndex((b) => b.key === k);
    setSelected(k);
  }, []);

  const showStage = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      select(BUILDING_BLOCKS[i].key);
      flowRef.current?.scrollIntoView({ behavior, block: "start" });
    },
    [select]
  );

  usePresentStops((dir) => {
    const next = stop.current + dir;
    if (next < -1 || next >= BUILDING_BLOCKS.length) return false;
    if (next === -1) {
      stop.current = -1;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      showStage(next);
    }
    return true;
  });

  // Stepped back into from the next page: open at the last stage.
  useEffect(() => {
    if (enteredAtEnd()) showStage(BUILDING_BLOCKS.length - 1, "auto");
  }, [showStage]);

  const byBlock = useMemo(() => {
    const m = new Map<BlockKey, BlockInput[]>();
    for (const b of BUILDING_BLOCKS) m.set(b.key, []);
    for (const e of entries) m.get(e.block)?.push(e);
    return m;
  }, [entries]);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted">
        The whole process, stage by stage. Pick your name, open a stage, and add what we already
        built — and where it needs to connect, if it does — and what&apos;s missing (your top{" "}
        {MAX_MISSING} by priority). Every item gets a category.
      </p>
      <div ref={flowRef} className="scroll-mt-20">
        <BlocksFlow byBlock={byBlock} selected={selected} onSelect={select} />
      </div>
      <BlockEditor key={selected} block={selected} entries={byBlock.get(selected) ?? []} />
    </div>
  );
}

/* ---------- Who am I ---------- */

const OTHER_MEMBER = "__other";

/** Who's adding input: a dropdown at the top right of the stages section.
 *  Reads "Who are you?" until picked, then "Adding as <name>". */
export function MemberPicker() {
  const { member, setMember } = useBlocks();
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const names = member && !TEAM_MEMBERS.includes(member) ? [...TEAM_MEMBERS, member] : TEAM_MEMBERS;

  if (typing) {
    return (
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
          aria-label="Your name"
          className="w-36 rounded-full border border-accent bg-bg px-3 py-1.5 text-[12.5px] text-fg focus:outline-none"
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
    );
  }

  return (
    <label className="flex items-center gap-2 text-[12px] text-muted">
      {member ? "Adding as" : "Who are you?"}
      <select
        value={member}
        onChange={(e) => {
          if (e.target.value === OTHER_MEMBER) setTyping(true);
          else setMember(e.target.value);
        }}
        className={
          "rounded-full border bg-bg px-3 py-1.5 text-[12.5px] font-semibold focus:outline-none " +
          (member ? "border-line text-fg focus:border-accent" : "border-accent text-accent ring-2 ring-accent/20")
        }
      >
        <option value="" disabled>
          Pick your name…
        </option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={OTHER_MEMBER}>Someone else…</option>
      </select>
    </label>
  );
}

/* ---------- The 7 blocks ---------- */

type BlockDef = (typeof BUILDING_BLOCKS)[number];

function BlocksFlow({
  byBlock,
  selected,
  onSelect,
}: {
  byBlock: Map<BlockKey, BlockInput[]>;
  selected: BlockKey;
  onSelect: (b: BlockKey) => void;
}) {
  const flow = BUILDING_BLOCKS.filter((b) => !isFoundation(b.key));
  const base = BUILDING_BLOCKS.filter((b) => isFoundation(b.key));
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-stretch lg:gap-0">
        {flow.map((b, i) => (
          <Fragment key={b.key}>
            <BlockCard
              b={b}
              n={i + 1}
              list={byBlock.get(b.key) ?? []}
              active={selected === b.key}
              onSelect={onSelect}
            />
            {i < flow.length - 1 && (
              <span aria-hidden className="hidden shrink-0 items-center px-1 text-[#f97316] lg:flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
        …and the cycle starts again at Data insights
      </div>
      {/* Foundation blocks span under the whole flow */}
      {base.map((b) => (
        <BlockCard
          key={b.key}
          b={b}
          n={BUILDING_BLOCKS.findIndex((x) => x.key === b.key) + 1}
          list={byBlock.get(b.key) ?? []}
          active={selected === b.key}
          onSelect={onSelect}
          wide
        />
      ))}
    </div>
  );
}

/** One building block card — the same in the flow and as the full-width foundation card. */
function BlockCard({
  b,
  n,
  list,
  active,
  onSelect,
  wide,
}: {
  b: BlockDef;
  n: number;
  list: BlockInput[];
  active: boolean;
  onSelect: (b: BlockKey) => void;
  wide?: boolean;
}) {
  const { member } = useBlocks();
  // "have" counts everything we have, whether or not it needs a connection.
  const count = (k: "have" | "missing") =>
    list.filter((e) => e.kind === k || (k === "have" && e.kind === "connect")).length;
  const people = [...new Set(list.map((e) => e.member))];
  const owns = !!member && (b.owners as readonly string[]).includes(member);

  const badge = (
    <span
      className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold"
      style={{ background: `${b.hex}22`, color: b.hex }}
    >
      {n}
    </span>
  );
  const yours = owns && (
    <span
      className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
      style={{ background: `${b.hex}22`, color: b.hex }}
    >
      Yours
    </span>
  );
  const owners = (
    <span className="text-[11px] leading-snug text-muted">
      {b.owners.length > 1 ? "Owners" : "Owner"} · <OwnerNames owners={b.owners} member={member} />
    </span>
  );
  const counts = (["have", "missing"] as const).map((k) => (
    <span key={k} className="flex items-center gap-1.5 text-[11px] text-muted">
      <Glyph kind={k} small />
      <span className="tabular-nums font-semibold text-fg">{count(k)}</span>
      {KIND_META[k].short}
    </span>
  ));
  const avatars = people.length > 0 && (
    <span className="flex -space-x-1.5">
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
  );

  const style = {
    borderColor: active ? b.hex : `${b.hex}55`,
    background: active ? `${b.hex}14` : undefined,
    boxShadow: active ? `inset 0 3px 0 0 ${b.hex}, 0 0 0 2px ${b.hex}` : `inset 0 3px 0 0 ${b.hex}`,
  };

  if (wide) {
    return (
      <button
        type="button"
        onClick={() => onSelect(b.key)}
        aria-pressed={active}
        className={
          "mt-3 flex w-full flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border bg-card/70 px-4 py-3 text-left transition " +
          (active ? "" : "hover:-translate-y-0.5")
        }
        style={style}
      >
        <span className="flex min-w-0 items-center gap-2">
          {badge}
          <span className="text-[14px] font-semibold text-fg">{b.label}</span>
          {yours}
        </span>
        {owners}
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">{counts}</span>
        {avatars && <span className="ml-auto">{avatars}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(b.key)}
      aria-pressed={active}
      className={
        "flex min-w-0 flex-col rounded-2xl border bg-card/70 p-3 text-left transition lg:flex-1 " +
        (active ? "" : "hover:-translate-y-0.5")
      }
      style={style}
    >
      <span className="flex items-center justify-between gap-1">
        {badge}
        {yours}
      </span>
      <span className="mt-1.5 text-[13px] font-semibold leading-tight text-fg">{b.label}</span>
      <span className="mt-1">{owners}</span>
      <span className="mt-2 space-y-0.5">{counts}</span>
      {avatars && <span className="mt-2">{avatars}</span>}
    </button>
  );
}

/* ---------- Editor for the selected block ---------- */

function BlockEditor({ block, entries }: { block: BlockKey; entries: BlockInput[] }) {
  const { member } = useBlocks();
  const b = blockDef(block)!;
  const people = [...new Set(entries.map((e) => e.member))];
  // What we have — with or without a connection — in the order it was added.
  const have = entries.filter((e) => e.kind === "have" || e.kind === "connect");

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
          {b.owners.length > 1 ? "Owners" : "Owner"} ·{" "}
          <OwnerNames owners={b.owners} member={member} />
        </span>
        <span className="text-[12px] text-muted" aria-hidden>
          ·
        </span>
        <span className="text-[12px] text-muted">
          {people.length
            ? `${people.length} team member${people.length > 1 ? "s" : ""} added input · ${people.join(", ")}`
            : "No input yet — be the first"}
        </span>
      </div>
      {entries.length > 0 && (
        <div className="-mt-2 mb-4 flex flex-wrap items-center gap-y-1">
          <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
            By category
          </span>
          {CATEGORIES.map((c) => (
            <CategoryTag
              key={c.key}
              category={c.key}
              count={entries.filter((e) => e.category === c.key).length}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Column
          kind="have"
          footer={
            <AddForm block={block} kind="have" placeholder="e.g. Weekly competitor digest" where="optional" />
          }
        >
          {have.length === 0 && <Empty />}
          {have.map((e) => (
            <EntryRow key={e.id} entry={e}>
              <TargetList targets={e.targets} unsure={false} />
            </EntryRow>
          ))}
        </Column>

        <Column
          kind="missing"
          hint="Add your most important first — #1 is your top priority."
          footer={
            <AddForm
              block={block}
              kind="missing"
              placeholder="e.g. One view of user feedback"
              where="missing"
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
                <EntryRow key={e.id} entry={e} rank={i + 1} hideMember>
                  <TargetList targets={e.targets} unsure={e.unsure} />
                </EntryRow>
              ))}
            </div>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  kind,
  hint,
  children,
  footer,
}: {
  kind: InputKind;
  hint?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-card/80 p-3">
      <div className="mb-2.5">
        <div className="flex items-center gap-2">
          <Glyph kind={kind} />
          <span className="text-[12.5px] font-semibold text-fg">{KIND_META[kind].label}</span>
        </div>
        {hint && <p className="mt-0.5 pl-7 text-[11px] text-muted">{hint}</p>}
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
        <CategoryTag category={entry.category} />
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

/** "→ [Planning] [Salesforce]", or "→ Not sure where". */
function TargetList({ targets, unsure }: { targets: string[]; unsure: boolean }) {
  if (!unsure && targets.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
      <span className="text-muted">→</span>
      {unsure ? (
        <span className="rounded-full border border-dashed border-line px-1.5 py-px italic text-muted">
          Not sure where
        </span>
      ) : (
        targets.map((t) => <TargetPill key={t} target={t} />)
      )}
    </span>
  );
}

function TargetPill({ target }: { target: string }) {
  const b = isBlockKey(target) ? blockDef(target) : null;
  return (
    <span
      className="whitespace-nowrap rounded-full px-1.5 py-px font-semibold"
      style={
        b
          ? { background: `${b.hex}1f`, color: b.hex }
          : { background: "rgb(var(--line) / 0.6)", color: "rgb(var(--fg))" }
      }
    >
      {b ? b.label : target}
    </span>
  );
}

/** "Connect to" dropdown values besides the stage keys. */
const ELSEWHERE = "__elsewhere";
const UNSURE = "__unsure";

/** "+ Add" until clicked; then a short form — the item, a category and (optionally)
 *  where it connects, each a dropdown. Closes again once saved. */
function AddForm({
  block,
  kind,
  placeholder,
  where,
  blockedNote,
}: {
  block: BlockKey;
  kind: InputKind;
  placeholder: string;
  /** Ask where it needs to connect: optional (a "have" item; picking places saves it as
   *  "connect") or places-or-not-sure ("missing"). */
  where?: "optional" | "missing";
  blockedNote?: string;
}) {
  const { member, add } = useBlocks();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [places, setPlaces] = useState<BlockKey[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [unsure, setUnsure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!member) {
    return <p className="text-[11px] text-muted">Pick who you are (top right) to add input.</p>;
  }
  if (blockedNote) {
    return <p className="text-[11px] text-muted">{blockedNote}</p>;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-[11.5px] font-semibold text-muted transition hover:border-accent/60 hover:text-fg"
      >
        + Add
      </button>
    );
  }

  function close() {
    setOpen(false);
    setText("");
    setCategory("");
    setPlaces([]);
    setOtherOn(false);
    setOtherText("");
    setUnsure(false);
    setError(null);
  }

  /** Each pick from the "connect to" dropdown adds a place (removable below). */
  function pick(v: string) {
    setError(null);
    if (v === UNSURE) {
      setUnsure(true);
      setPlaces([]);
      setOtherOn(false);
      setOtherText("");
    } else if (v === ELSEWHERE) {
      setOtherOn(true);
      setUnsure(false);
    } else if (isBlockKey(v)) {
      setUnsure(false);
      setPlaces((ps) => (ps.includes(v) ? ps : [...ps, v]));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (!category) {
      setError("Pick a category");
      return;
    }
    let target: Where | undefined;
    if (where) {
      const others = otherOn
        ? otherText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const targets = [
        ...BUILDING_BLOCKS.filter((b) => places.includes(b.key)).map((b) => b.key as string),
        ...others,
      ];
      if (where === "missing" && targets.length === 0 && !unsure) {
        setError("Choose where it should connect — or “I'm not sure”");
        return;
      }
      target = { targets, unsure: where === "missing" && unsure };
    }
    // Something we have that needs connecting is a "connect" item (a backlog item).
    const saveAs: InputKind = kind === "have" && target?.targets.length ? "connect" : kind;
    setBusy(true);
    const err = await add(block, saveAs, t, category, target);
    setBusy(false);
    if (err) setError(err);
    else close();
  }

  const inputCls =
    "w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[12.5px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none";
  const selectCls =
    "min-w-0 rounded-lg border border-line bg-bg px-2 py-1.5 text-[12px] focus:border-accent focus:outline-none ";
  const choices = BUILDING_BLOCKS.filter((b) => b.key !== block && !places.includes(b.key));

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_TEXT}
        placeholder={placeholder}
        aria-label={KIND_META[kind].label}
        className={inputCls}
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as CategoryKey);
            setError(null);
          }}
          aria-label="Category"
          className={selectCls + (category ? "text-fg" : "text-muted")}
        >
          <option value="" disabled>
            Category…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        {where && (
          <select
            value=""
            onChange={(e) => pick(e.target.value)}
            aria-label="Connect to"
            className={selectCls + "text-muted"}
          >
            <option value="" disabled>
              {where === "optional" ? "Connect to… (optional)" : "Should connect to…"}
            </option>
            {choices.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
            {!otherOn && <option value={ELSEWHERE}>Somewhere else…</option>}
            {where === "missing" && !unsure && <option value={UNSURE}>I&apos;m not sure</option>}
          </select>
        )}
      </div>
      {(places.length > 0 || unsure) && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-muted">→</span>
          {places.map((k) => (
            <PlacePill
              key={k}
              target={k}
              onRemove={() => setPlaces((ps) => ps.filter((p) => p !== k))}
            />
          ))}
          {unsure && (
            <PlacePill target="Not sure where" muted onRemove={() => setUnsure(false)} />
          )}
        </div>
      )}
      {otherOn && (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={MAX_TARGET * 4}
            placeholder="Where else? e.g. Salesforce, the Data team"
            aria-label="Somewhere else"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              setOtherOn(false);
              setOtherText("");
            }}
            aria-label="Remove somewhere else"
            className="shrink-0 text-[11px] text-muted transition hover:text-drop"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] text-drop">{error}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={close}
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-ink transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </form>
  );
}

/** A chosen place in the add form, with ✕ to drop it. */
function PlacePill({
  target,
  muted,
  onRemove,
}: {
  target: string;
  muted?: boolean;
  onRemove: () => void;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full py-px pl-1.5 pr-1 " +
        (muted ? "border border-dashed border-line italic text-muted" : "")
      }
    >
      {muted ? target : <TargetPill target={target} />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${isBlockKey(target) ? blockDef(target)!.label : target}`}
        className="text-[10px] text-muted transition hover:text-drop"
      >
        ✕
      </button>
    </span>
  );
}

/* ---------- Small bits ---------- */

/** Category as a neutral label — no hue (the block palette owns color). */
export function CategoryTag({ category, count }: { category: CategoryKey | null; count?: number }) {
  const c = categoryDef(category);
  return (
    <span
      className={
        "mr-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-px align-middle text-[9.5px] font-bold uppercase tracking-wide " +
        (c ? "border-line bg-line/40 text-fg" : "border-dashed border-line text-muted")
      }
    >
      {c ? c.label : "Uncategorized"}
      {count !== undefined && <span className="tabular-nums text-muted">{count}</span>}
    </span>
  );
}

/** "Rani, Oren, Gal" — the viewer's own name highlighted. */
function OwnerNames({ owners, member }: { owners: readonly string[]; member: string }) {
  if (owners.length === 0) return <span className="italic">not set yet</span>;
  return (
    <>
      {owners.map((o, i) => (
        <Fragment key={o}>
          {i > 0 && ", "}
          <span className={"font-semibold " + (o === member ? "text-accent" : "text-fg")}>
            {o}
          </span>
        </Fragment>
      ))}
    </>
  );
}

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
