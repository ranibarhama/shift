"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { blockDef, isBlockKey, type BlockInput } from "@/lib/buildingBlocks";
import { IGNIS_FRAMES } from "@/lib/ignisFrames";
import {
  MAX_DAYS,
  MAX_NEEDS,
  MAX_NOTES,
  ROLES,
  buildPlan,
  fmtDays,
  totalDays,
  type Estimate,
  type EstimateInput,
  type Estimates,
  type PlanTask,
  type RoleKey,
} from "@/lib/taskPlan";

/* -----------------------------------------------------------------------------
 * Phase 2 · 4 · Updated Backlog Tasks & Resources — every task it takes to build
 * the architecture, grouped by its layers: the tasks the architecture itself
 * calls for, plus the step 2 backlog items each layer answers. Click a task to
 * cost it (person-days per role, what it needs, notes); the summary on top adds
 * it up by layer and by role.
 * -------------------------------------------------------------------------- */

const POLL_MS = 15_000;
/** The name picked on Gaps and Connections — recorded as who last edited an estimate. */
const MEMBER_KEY = "shift_member";

type SourceFilter = "all" | PlanTask["source"];
type StateFilter = "all" | "estimated" | "todo";

const SOURCE_LABEL: Record<SourceFilter, string> = {
  all: "All",
  architecture: "From the architecture",
  backlog: "From the backlog",
};
const STATE_LABEL: Record<StateFilter, string> = { all: "All", estimated: "Estimated", todo: "To estimate" };

const layerName = (n: number) => IGNIS_FRAMES[n - 1].name;

/** One layer's (or the whole plan's) numbers. Tasks marked done aren't counted as effort. */
function summarize(tasks: PlanTask[], estimates: Estimates) {
  const open = tasks.filter((t) => !estimates[t.id]?.done);
  const byRole = {} as Record<RoleKey, number>;
  for (const r of ROLES) byRole[r.key] = open.reduce((n, t) => n + (estimates[t.id]?.days[r.key] ?? 0), 0);
  return {
    tasks: tasks.length,
    done: tasks.length - open.length,
    open: open.length,
    estimated: open.filter((t) => totalDays(estimates[t.id]) > 0).length,
    byRole,
    days: open.reduce((n, t) => n + totalDays(estimates[t.id]), 0),
  };
}

/* ============================== View ============================== */

export default function TaskPlanView({
  initialInputs,
  initialEstimates,
}: {
  initialInputs: BlockInput[];
  initialEstimates: Estimates;
}) {
  const [inputs, setInputs] = useState<BlockInput[]>(initialInputs);
  const [estimates, setEstimates] = useState<Estimates>(initialEstimates);
  const [source, setSource] = useState<SourceFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const lastSave = useRef(0);

  // Keep up with the team: new backlog items, and estimates others fill in.
  useEffect(() => {
    const load = async () => {
      const started = Date.now();
      try {
        const [a, b] = await Promise.all([
          fetch("/api/building-blocks", { cache: "no-store" }),
          fetch("/api/task-estimates", { cache: "no-store" }),
        ]);
        if (a.ok) setInputs(((await a.json()) as { inputs: BlockInput[] }).inputs);
        // A save made while this was loading is newer than what it brings back.
        if (b.ok && started > lastSave.current) {
          setEstimates(((await b.json()) as { estimates: Estimates }).estimates);
        }
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

  /** Saves one task's estimate. Returns an error message, or null when saved. */
  const save = useCallback(async (id: string, value: EstimateInput): Promise<string | null> => {
    let member = "";
    try {
      member = localStorage.getItem(MEMBER_KEY) ?? "";
    } catch {
      /* no name on record */
    }
    try {
      const r = await fetch(`/api/task-estimates/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...value, member }),
      });
      const j = (await r.json().catch(() => ({}))) as { estimate?: Estimate; error?: string };
      if (!r.ok || !j.estimate) return j.error ?? "Couldn't save — try again.";
      lastSave.current = Date.now();
      setEstimates((m) => ({ ...m, [id]: j.estimate! }));
      return null;
    } catch {
      return "Couldn't save — check your connection and try again.";
    }
  }, []);

  const plan = useMemo(() => buildPlan(inputs, estimates), [inputs, estimates]);
  const all = useMemo(() => plan.layers.flat(), [plan]);
  const total = useMemo(() => summarize(all, estimates), [all, estimates]);
  const open = openId ? ([...all, ...plan.loose].find((t) => t.id === openId) ?? null) : null;

  const shown = (t: PlanTask) => {
    if (source !== "all" && t.source !== source) return false;
    if (state === "all") return true;
    const e = estimates[t.id];
    const estimated = totalDays(e) > 0;
    // "To estimate" is the work still to cost: not done, no person-days yet.
    return state === "estimated" ? estimated : !estimated && !e?.done;
  };
  const groups = plan.layers.map((tasks, i) => ({ n: i + 1, tasks, list: tasks.filter(shown) }));
  const shownCount = groups.reduce((n, g) => n + g.list.length, 0);

  function exportCsv() {
    const cell = (v: string) => {
      const safe = /^[=+\-@]/.test(v) ? `'${v}` : v; // no spreadsheet formulas
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      [
        "#",
        "Layer",
        "Task",
        "Detail",
        "From",
        "Stage",
        "Added by",
        ...ROLES.map((r) => `${r.label} (person-days)`),
        "Total (person-days)",
        "What it needs",
        "Notes",
        "Done",
      ],
      ...all.map((t) => {
        const e = estimates[t.id];
        return [
          t.num,
          `${t.layer} · ${layerName(t.layer)}`,
          t.title,
          t.detail,
          t.source === "backlog" ? "Backlog" : "Architecture",
          t.input ? (blockDef(t.input.block)?.label ?? "") : "",
          t.input?.member ?? "",
          ...ROLES.map((r) => (e?.days[r.key] ? fmtDays(e.days[r.key]!) : "")),
          totalDays(e) ? fmtDays(totalDays(e)) : "",
          e?.needs ?? "",
          e?.notes ?? "",
          e?.done ? "Yes" : "",
        ];
      }),
    ];
    const csv = rows.map((r) => r.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shift-phase2-task-plan.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tiles = [
    { label: "Tasks in the plan", value: String(total.tasks) },
    { label: "From the architecture", value: String(all.filter((t) => t.source === "architecture").length) },
    { label: "From the backlog", value: String(all.filter((t) => t.source === "backlog").length) },
    { label: "Estimated so far", value: `${total.estimated} of ${total.open}` },
    { label: "Effort so far · person-days", value: fmtDays(total.days) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-card/60 px-4 py-3">
            <div className="text-[11px] text-muted">{t.label}</div>
            <div className="mt-0.5 text-2xl font-semibold tabular-nums text-fg">{t.value}</div>
          </div>
        ))}
      </div>

      <EffortByLayer plan={plan.layers} estimates={estimates} total={total} />

      <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-fg">The tasks</h2>
            <p className="text-[12px] text-muted">
              {`${shownCount} of ${all.length} tasks · grouped by the architecture's layers. `}
              Click a task to cost it: person-days per role, what it needs, and notes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="From" value={source} options={SOURCE_LABEL} onChange={setSource} />
            <Segmented label="Estimate" value={state} options={STATE_LABEL} onChange={setState} />
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-full border border-line bg-bg px-3 py-1.5 text-[11px] font-semibold text-fg transition hover:border-accent/50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {shownCount === 0 ? (
          <p className="py-8 text-center text-[12px] text-muted">No tasks match these filters.</p>
        ) : (
          <div className="space-y-6">
            {groups
              .filter((g) => g.list.length)
              .map((g) => (
                <LayerGroup key={g.n} n={g.n} tasks={g.tasks} list={g.list} estimates={estimates} onOpen={setOpenId} />
              ))}
          </div>
        )}
      </section>

      {plan.loose.length > 0 && <LooseItems items={plan.loose} estimates={estimates} onMove={save} />}

      {open && (
        <EstimatePanel
          key={open.id}
          task={open}
          estimate={estimates[open.id]}
          onSave={save}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line bg-bg p-0.5">
      {(Object.keys(options) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={
            "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
            (value === k ? "bg-accent text-ink" : "text-muted hover:text-fg")
          }
        >
          {options[k]}
        </button>
      ))}
    </div>
  );
}

/** A layer's number, the same on the summary and on the task groups. */
function LayerBadge({ n }: { n: number }) {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-bg text-[11px] font-semibold tabular-nums text-fg">
      {n}
    </span>
  );
}

/** Stage identity: a colored dot beside ink text. */
function StageDot({ block }: { block: string }) {
  const b = blockDef(block);
  if (!b) return <>{block}</>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.hex }} aria-hidden />
      {b.label}
    </span>
  );
}

const TAG = "inline-flex items-center rounded border px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide";

/* ============================== Effort by layer ============================== */

/** The cost summary: person-days per layer and per role, as far as it's been estimated. */
function EffortByLayer({
  plan,
  estimates,
  total,
}: {
  plan: PlanTask[][];
  estimates: Estimates;
  total: ReturnType<typeof summarize>;
}) {
  const rows = plan.map((tasks, i) => ({ n: i + 1, ...summarize(tasks, estimates) }));
  const max = Math.max(...rows.map((r) => r.days));
  const num = (v: number) => (v ? fmtDays(v) : <span className="text-muted/60">—</span>);

  return (
    <section className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-fg">Effort by layer</h2>
        <p className="text-[12px] text-muted">
          Person-days per role, added up from the estimates below. Tasks marked done aren&apos;t counted.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[12.5px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-1 font-semibold">Layer</th>
              <th className="px-2 py-1 text-right font-semibold">Tasks</th>
              <th className="px-2 py-1 text-right font-semibold">Estimated</th>
              {ROLES.map((r) => (
                <th key={r.key} className="px-2 py-1 text-right font-semibold">
                  {r.label}
                </th>
              ))}
              <th className="w-36 px-2 py-1 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className="border-t border-line/50">
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2 font-medium text-fg">
                    <LayerBadge n={r.n} />
                    {layerName(r.n)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-fg">
                  {r.tasks}
                  {r.done > 0 && <span className="text-muted"> · {r.done} done</span>}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-muted">
                  {r.estimated} of {r.open}
                </td>
                {ROLES.map((role) => (
                  <td key={role.key} className="px-2 py-2 text-right tabular-nums text-fg">
                    {num(r.byRole[role.key])}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">
                  <div className="font-semibold tabular-nums text-fg">{num(r.days)}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line/60" aria-hidden>
                    <div className="ml-auto h-full rounded-full bg-accent" style={{ width: max ? `${(r.days / max) * 100}%` : 0 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line font-semibold text-fg">
              <td className="px-2 py-2">All layers</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {total.tasks}
                {total.done > 0 && <span className="font-normal text-muted"> · {total.done} done</span>}
              </td>
              <td className="px-2 py-2 text-right font-normal tabular-nums text-muted">
                {total.estimated} of {total.open}
              </td>
              {ROLES.map((role) => (
                <td key={role.key} className="px-2 py-2 text-right tabular-nums">
                  {num(total.byRole[role.key])}
                </td>
              ))}
              <td className="px-2 py-2 text-right tabular-nums">{num(total.days)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

/* ============================== Task list ============================== */

function LayerGroup({
  n,
  tasks,
  list,
  estimates,
  onOpen,
}: {
  n: number;
  /** Every task in the layer — the header's numbers. */
  tasks: PlanTask[];
  /** The ones that pass the filters — the rows. */
  list: PlanTask[];
  estimates: Estimates;
  onOpen: (id: string) => void;
}) {
  const s = summarize(tasks, estimates);
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line pb-1.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
          <LayerBadge n={n} />
          {layerName(n)}
        </span>
        <span className="text-[11px] text-muted">Unlocks: {IGNIS_FRAMES[n - 1].unlock}</span>
        <span className="ml-auto text-[11px] tabular-nums text-muted">
          {`${s.tasks} task${s.tasks === 1 ? "" : "s"} · ${s.estimated} of ${s.open} estimated · ${fmtDays(s.days)} person-days`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed text-left text-[12.5px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="w-11 px-2 py-1 font-semibold">#</th>
              <th className="w-[34%] px-2 py-1 font-semibold">Task</th>
              <th className="w-44 px-2 py-1 font-semibold">From</th>
              <th className="w-20 px-2 py-1 text-right font-semibold">Effort</th>
              <th className="w-48 px-2 py-1 font-semibold">Who</th>
              <th className="px-2 py-1 font-semibold">What it needs</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <TaskRow key={t.id} task={t} estimate={estimates[t.id]} onOpen={() => onOpen(t.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskRow({ task: t, estimate: e, onOpen }: { task: PlanTask; estimate?: Estimate; onOpen: () => void }) {
  const days = totalDays(e);
  const done = !!e?.done;
  return (
    <tr onClick={onOpen} className="cursor-pointer border-t border-line/50 align-top transition hover:bg-line/20">
      <td className="px-2 py-2 tabular-nums text-muted">{t.num}</td>
      <td className="px-2 py-2">
        <button type="button" className={"text-left font-medium " + (done ? "text-muted" : "text-fg")}>
          {t.title}
        </button>
        {done && <span className={`${TAG} ml-1.5 border-green-600/60 bg-green-500/10 text-fg dark:border-green-500/60`}>✓ Done</span>}
        {t.detail && <div className="mt-0.5 text-[11.5px] leading-snug text-muted">{t.detail}</div>}
      </td>
      <td className="px-2 py-2 text-fg">
        {t.input ? (
          <span className="flex flex-col items-start gap-1">
            <span className={`${TAG} border-line bg-line/40 text-fg`}>Backlog</span>
            <span className="text-[11.5px] text-muted">
              <StageDot block={t.input.block} />
            </span>
          </span>
        ) : (
          <span className={`${TAG} border-accent/50 bg-accent/10 text-fg`}>Architecture</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
        {days ? (
          <span className="font-semibold text-fg">{fmtDays(days)} d</span>
        ) : (
          <span className="text-[11px] font-semibold text-accent">{done ? "—" : "Estimate"}</span>
        )}
      </td>
      <td className="px-2 py-2">
        <span className="flex flex-wrap gap-1">
          {ROLES.filter((r) => e?.days[r.key]).map((r) => (
            <span key={r.key} className={`${TAG} border-line bg-line/40 normal-case tracking-normal text-fg`}>
              {r.label}
              <span className="ml-1 tabular-nums font-normal text-muted">{fmtDays(e!.days[r.key]!)}</span>
            </span>
          ))}
        </span>
      </td>
      <td className="px-2 py-2 text-fg">
        <span className="line-clamp-2">{e?.needs}</span>
      </td>
    </tr>
  );
}

/* ============================== Not tied to a layer ============================== */

/** Step 2 backlog items this architecture doesn't answer — kept in sight, out of the plan. */
function LooseItems({
  items,
  estimates,
  onMove,
}: {
  items: PlanTask[];
  estimates: Estimates;
  onMove: (id: string, value: EstimateInput) => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <details className="rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
      <summary className="cursor-pointer text-base font-semibold text-fg">
        Backlog items not tied to a layer
        <span className="ml-2 text-[12px] font-normal tabular-nums text-muted">{items.length}</span>
      </summary>
      <p className="mt-1 text-[12px] text-muted">
        Items from 2 · Backlog that this architecture doesn&apos;t answer — they aren&apos;t part of the
        plan or its totals. If one belongs to a layer, move it there.
      </p>
      {error && <p className="mt-2 text-[12px] font-semibold text-drop">{error}</p>}
      <ul className="mt-3 divide-y divide-line/50">
        {items.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2 text-[12.5px]">
            <span className="min-w-[240px] flex-1 text-fg">{t.title}</span>
            <span className="text-[11.5px] text-muted">
              <StageDot block={t.input!.block} /> · {t.input!.member}
            </span>
            <select
              aria-label={`Move “${t.title}” to a layer`}
              value={0}
              onChange={async (ev) => {
                const e = estimates[t.id];
                setError(
                  await onMove(t.id, {
                    days: e?.days ?? {},
                    needs: e?.needs ?? "",
                    notes: e?.notes ?? "",
                    done: e?.done ?? false,
                    layer: Number(ev.target.value),
                  })
                );
              }}
              className="rounded-full border border-line bg-bg px-3 py-1 text-[11.5px] text-fg focus:border-accent focus:outline-none"
            >
              <option value={0}>Move to a layer…</option>
              {IGNIS_FRAMES.map((f, i) => (
                <option key={f.name} value={i + 1}>
                  {i + 1} · {f.name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ============================== Estimate panel ============================== */

/** The costing template for one task, as a side panel. */
function EstimatePanel({
  task: t,
  estimate: e,
  onSave,
  onClose,
}: {
  task: PlanTask;
  estimate?: Estimate;
  onSave: (id: string, value: EstimateInput) => Promise<string | null>;
  onClose: () => void;
}) {
  const [days, setDays] = useState<Record<string, string>>(() =>
    Object.fromEntries(ROLES.map((r) => [r.key, e?.days[r.key] ? fmtDays(e.days[r.key]!) : ""]))
  );
  const [needs, setNeeds] = useState(e?.needs ?? "");
  const [notes, setNotes] = useState(e?.notes ?? "");
  const [done, setDone] = useState(e?.done ?? false);
  const [layer, setLayer] = useState(t.layer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sum = ROLES.reduce((n, r) => n + (Number(days[r.key]) || 0), 0);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    const parsed: Partial<Record<RoleKey, number>> = {};
    for (const r of ROLES) if (days[r.key].trim()) parsed[r.key] = Number(days[r.key]);
    const err = await onSave(t.id, { days: parsed, needs, notes, done, layer: t.input ? layer : null });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  const field = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none";
  const label = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted";

  // Portal: keeps the panel above the page whatever its containers do. Below the
  // present-mode controls (z-40), so those stay usable while presenting.
  return createPortal(
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Estimate — ${t.title}`}
        className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-line bg-bg shadow-2xl outline-none"
      >
        <form onSubmit={submit} className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-line bg-bg px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {t.num ? `Task ${t.num} · ${layerName(t.layer)}` : "Backlog item"}
                </div>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-fg">{t.title}</h2>
                {t.detail && <p className="mt-1 text-[12.5px] text-muted">{t.detail}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-sm text-muted transition hover:text-fg"
              >
                ✕
              </button>
            </div>
            {t.input && (
              <p className="mt-2 text-[11.5px] text-muted">
                From 2 · Backlog — <StageDot block={t.input.block} /> ·{" "}
                {t.input.kind === "missing" ? "missing" : "built, needs a connection"} · added by {t.input.member}
                {t.input.targets.length > 0 && (
                  <>
                    {" "}
                    · connects to {t.input.targets.map((x) => (isBlockKey(x) ? blockDef(x)!.label : x)).join(", ")}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex-1 space-y-5 px-5 py-5">
            {t.input && (
              <div>
                <label htmlFor="est-layer" className={label}>
                  Layer
                </label>
                <select id="est-layer" value={layer} onChange={(ev) => setLayer(Number(ev.target.value))} className={field}>
                  {IGNIS_FRAMES.map((f, i) => (
                    <option key={f.name} value={i + 1}>
                      {i + 1} · {f.name}
                    </option>
                  ))}
                  <option value={0}>Not tied to a layer (out of the plan)</option>
                </select>
              </div>
            )}

            <fieldset>
              <legend className={label}>Effort · person-days per role</legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {ROLES.map((r) => (
                  <label key={r.key} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card/40 py-1.5 pl-3 pr-1.5">
                    <span className="text-[12.5px] text-fg">{r.label}</span>
                    <input
                      type="number"
                      aria-label={`${r.label}, person-days`}
                      inputMode="decimal"
                      min={0}
                      max={MAX_DAYS}
                      step={0.5}
                      value={days[r.key]}
                      onChange={(ev) => setDays((d) => ({ ...d, [r.key]: ev.target.value }))}
                      placeholder="0"
                      className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-right text-[13px] tabular-nums text-fg placeholder:text-muted/50 focus:border-accent focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12.5px]">
                <span className="text-muted">Leave a role empty if it has no work on this task.</span>
                <span className="whitespace-nowrap font-semibold tabular-nums text-fg">Total {fmtDays(sum)} d</span>
              </div>
            </fieldset>

            <div>
              <label htmlFor="est-needs" className={label}>
                What it needs
              </label>
              <textarea
                id="est-needs"
                rows={3}
                maxLength={MAX_NEEDS}
                value={needs}
                onChange={(ev) => setNeeds(ev.target.value)}
                placeholder="Tools, licences, access, vendors, budget…"
                className={field}
              />
            </div>

            <div>
              <label htmlFor="est-notes" className={label}>
                Notes
              </label>
              <textarea
                id="est-notes"
                rows={3}
                maxLength={MAX_NOTES}
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                placeholder="Assumptions, dependencies, open questions…"
                className={field}
              />
            </div>

            <label className="flex items-start gap-2.5 text-[12.5px] text-fg">
              <input type="checkbox" checked={done} onChange={(ev) => setDone(ev.target.checked)} className="mt-0.5 h-4 w-4 accent-[#16a34a]" />
              <span>
                Already in place
                <span className="block text-[11.5px] text-muted">Stays on the list, but isn&apos;t counted as effort still to spend.</span>
              </span>
            </label>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg px-5 py-3">
            <span className="text-[11.5px] text-muted">
              {error ? (
                <span className="font-semibold text-drop">{error}</span>
              ) : e ? (
                `Last edited${e.updatedBy ? ` by ${e.updatedBy}` : ""} · ${new Date(e.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              ) : (
                "Not estimated yet"
              )}
            </span>
            <span className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
