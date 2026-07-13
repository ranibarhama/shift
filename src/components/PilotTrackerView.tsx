"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GAP_STATUSES,
  getStageDef,
  type GapStatus,
  type PilotGap,
  type PilotInitiative,
  type PilotTask,
} from "@/lib/pilotBoard";
import { LEADER_NAMES } from "@/lib/stoneBriefs";
import { useConfirm } from "./ConfirmProvider";
import { ToastContainer, useToasts } from "./Toaster";

type Props = {
  initialInitiatives: PilotInitiative[];
  initialGaps: PilotGap[];
  initialTasks: PilotTask[];
};

/** One row in the tracker — a stage gap from the board or a standalone task. */
type WorkItem = {
  kind: "gap" | "task";
  id: string;
  title: string;
  initiativeId: string | null;
  stageKey: string | null;
  owner: string | null;
  status: GapStatus;
  dueDate: string;
};

const STATUS_BY_KEY = Object.fromEntries(GAP_STATUSES.map((s) => [s.key, s]));

/** The fields editable from the tracker — shared by gaps and tasks. */
type ItemPatch = Partial<
  Pick<WorkItem, "title" | "owner" | "status" | "dueDate">
>;

export default function PilotTrackerView({
  initialInitiatives,
  initialGaps,
  initialTasks,
}: Props) {
  const [initiatives] = useState<PilotInitiative[]>(initialInitiatives);
  const [gaps, setGaps] = useState<PilotGap[]>(initialGaps);
  const [tasks, setTasks] = useState<PilotTask[]>(initialTasks);
  const confirm = useConfirm();
  const { toasts, pushToast, dismissToast } = useToasts();

  const selectedInitiatives = useMemo(
    () => initiatives.filter((i) => i.selected),
    [initiatives]
  );
  const initiativeById = useMemo(
    () => new Map(initiatives.map((i) => [i.id, i])),
    [initiatives]
  );

  /* ---------- Unified item list (pilot scope) ---------- */

  const items = useMemo<WorkItem[]>(() => {
    const selectedIds = new Set(selectedInitiatives.map((i) => i.id));
    const fromGaps: WorkItem[] = gaps
      .filter((g) => selectedIds.has(g.initiativeId))
      .map((g) => ({
        kind: "gap" as const,
        id: g.id,
        title: g.title,
        initiativeId: g.initiativeId,
        stageKey: g.stageKey,
        owner: g.owner,
        status: g.status,
        dueDate: g.dueDate,
      }));
    const fromTasks: WorkItem[] = tasks.map((t) => ({
      kind: "task" as const,
      id: t.id,
      title: t.title,
      initiativeId: t.initiativeId,
      stageKey: null,
      owner: t.owner,
      status: t.status,
      dueDate: t.dueDate,
    }));
    return [...fromGaps, ...fromTasks];
  }, [gaps, tasks, selectedInitiatives]);

  /* ---------- Filters ---------- */

  const [initiativeFilter, setInitiativeFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = items;
    if (initiativeFilter === "general") {
      list = list.filter((i) => i.initiativeId === null);
    } else if (initiativeFilter !== "all") {
      list = list.filter((i) => i.initiativeId === initiativeFilter);
    }
    if (ownerFilter === "unassigned") {
      list = list.filter((i) => !i.owner);
    } else if (ownerFilter !== "all") {
      list = list.filter((i) => i.owner === ownerFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    // Not-done first, then by due date (empty dates last), then title
    return [...list].sort((a, b) => {
      const aDone = a.status === "done" ? 1 : 0;
      const bDone = b.status === "done" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aDue = a.dueDate || "9999-12-31";
      const bDue = b.dueDate || "9999-12-31";
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return a.title.localeCompare(b.title);
    });
  }, [items, initiativeFilter, ownerFilter, statusFilter]);

  /* ---------- Persistence ---------- */

  function saveFailToast(label: string, status?: number) {
    pushToast(
      status
        ? `${label} couldn't save (server ${status})`
        : `${label} couldn't save — check your connection`,
      "error"
    );
  }

  function patchItem(item: WorkItem, patch: ItemPatch) {
    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.owner !== undefined) body.owner = patch.owner;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.dueDate !== undefined) body.dueDate = patch.dueDate;

    if (item.kind === "gap") {
      setGaps((arr) =>
        arr.map((g) => (g.id === item.id ? { ...g, ...patch } : g))
      );
      void fetch(`/api/pilot-gaps/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (!r.ok) saveFailToast("Item", r.status);
        })
        .catch(() => saveFailToast("Item"));
    } else {
      setTasks((arr) =>
        arr.map((t) => (t.id === item.id ? { ...t, ...patch } : t))
      );
      void fetch(`/api/pilot-tasks/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (!r.ok) saveFailToast("Task", r.status);
        })
        .catch(() => saveFailToast("Task"));
    }
  }

  async function deleteItem(item: WorkItem) {
    const ok = await confirm({
      title: item.kind === "gap" ? "Delete this gap?" : "Delete this task?",
      message: `Remove "${item.title || "Untitled"}" from the pilot${
        item.kind === "gap" ? " — it will also disappear from the Pilot Board" : ""
      }. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    if (item.kind === "gap") {
      setGaps((arr) => arr.filter((g) => g.id !== item.id));
      void fetch(`/api/pilot-gaps/${item.id}`, { method: "DELETE" }).catch(() =>
        saveFailToast("Delete")
      );
    } else {
      setTasks((arr) => arr.filter((t) => t.id !== item.id));
      void fetch(`/api/pilot-tasks/${item.id}`, { method: "DELETE" }).catch(() =>
        saveFailToast("Delete")
      );
    }
  }

  async function addTask(
    title: string,
    initiativeId: string | null,
    owner: string | null
  ) {
    const res = await fetch("/api/pilot-tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, initiativeId, owner }),
    }).catch(() => null);
    if (!res || !res.ok) {
      saveFailToast("New task", res?.status);
      return;
    }
    const { task } = (await res.json()) as { task: PilotTask };
    setTasks((arr) => [...arr, task]);
  }

  /* ---------- Rollups (always over all pilot items, not the filtered set) ---------- */

  const counts = useMemo(() => {
    const c: Record<GapStatus, number> = {
      open: 0,
      in_progress: 0,
      blocked: 0,
      done: 0,
    };
    for (const i of items) c[i.status] += 1;
    return c;
  }, [items]);

  const total = items.length;
  const donePct = total > 0 ? Math.round((counts.done / total) * 100) : 0;

  const byInitiative = useMemo(() => {
    const buckets: { key: string; label: string; hex: string; items: WorkItem[] }[] =
      selectedInitiatives.map((i) => ({
        key: i.id,
        label: i.title || "Untitled initiative",
        hex: "#7c5cff",
        items: [] as WorkItem[],
      }));
    const general = {
      key: "general",
      label: "General pilot tasks",
      hex: "#64748b",
      items: [] as WorkItem[],
    };
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const item of items) {
      const bucket = item.initiativeId ? byKey.get(item.initiativeId) : general;
      (bucket ?? general).items.push(item);
    }
    return [...buckets, general].filter((b) => b.items.length > 0);
  }, [items, selectedInitiatives]);

  const byOwner = useMemo(() => {
    return LEADER_NAMES.map((name) => {
      const mine = items.filter((i) => i.owner === name);
      return {
        name,
        total: mine.length,
        done: mine.filter((i) => i.status === "done").length,
      };
    }).filter((o) => o.total > 0);
  }, [items]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Hero */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Pilot · execution
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            Pilot Tracker
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Every gap from the{" "}
            <Link href="/pilot-board" className="text-accent hover:underline">
              Pilot Board
            </Link>{" "}
            plus standalone tasks, in one list — owners, due dates and status.
            Edits save automatically.
          </p>
        </div>
        <Link
          href="/pilot-board"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
        >
          ← Back to the board
        </Link>
      </header>

      {/* Progress summary */}
      <section className="rounded-2xl border border-line bg-card/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Overall progress
          </div>
          <div className="text-sm text-muted">
            <span className="text-2xl font-semibold tabular-nums text-fg">
              {donePct}%
            </span>{" "}
            done · {counts.done} of {total} items
          </div>
        </div>

        {/* Stacked bar */}
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-line/40">
          {total > 0 &&
            GAP_STATUSES.filter((s) => counts[s.key] > 0).map((s) => (
              <div
                key={s.key}
                title={`${s.label}: ${counts[s.key]}`}
                style={{
                  width: `${(counts[s.key] / total) * 100}%`,
                  background: s.hex,
                }}
              />
            ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {GAP_STATUSES.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.hex }}
              />
              {s.label}
              <span className="tabular-nums text-fg">{counts[s.key]}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Per-initiative + per-owner rollups */}
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card/40 p-5">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            By initiative
          </div>
          {byInitiative.length === 0 ? (
            <div className="text-[13px] text-muted">
              Nothing tracked yet — log gaps on the board or add a task below.
            </div>
          ) : (
            <div className="space-y-3">
              {byInitiative.map((b) => {
                const done = b.items.filter((i) => i.status === "done").length;
                const pct =
                  b.items.length > 0
                    ? Math.round((done / b.items.length) * 100)
                    : 0;
                return (
                  <div key={b.key}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <div className="truncate text-[13px] font-medium text-fg">
                        {b.label}
                      </div>
                      <div className="shrink-0 text-[11px] tabular-nums text-muted">
                        {done}/{b.items.length} · {pct}%
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "#10b981" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card/40 p-5">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            By owner
          </div>
          {byOwner.length === 0 ? (
            <div className="text-[13px] text-muted">
              No items have an owner yet — assign them in the table below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {byOwner.map((o) => (
                <button
                  key={o.name}
                  type="button"
                  onClick={() =>
                    setOwnerFilter(ownerFilter === o.name ? "all" : o.name)
                  }
                  className="rounded-full border px-3 py-1.5 text-[12px] transition"
                  style={
                    ownerFilter === o.name
                      ? {
                          borderColor: "rgb(124 92 255)",
                          background: "rgb(124 92 255 / 0.15)",
                          color: "rgb(124 92 255)",
                        }
                      : {
                          borderColor: "rgb(var(--line))",
                          color: "rgb(var(--fg))",
                        }
                  }
                >
                  <span className="font-semibold">@{o.name}</span>{" "}
                  <span className="tabular-nums text-muted">
                    {o.done}/{o.total}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add task */}
      <section className="mt-6">
        <AddTaskForm initiatives={selectedInitiatives} onAdd={addTask} />
      </section>

      {/* Filters */}
      <section className="mt-6 flex flex-wrap items-center gap-2">
        <select
          value={initiativeFilter}
          onChange={(e) => setInitiativeFilter(e.target.value)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">All initiatives</option>
          {selectedInitiatives.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title || "Untitled"}
            </option>
          ))}
          <option value="general">General tasks</option>
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">Any owner</option>
          {LEADER_NAMES.map((n) => (
            <option key={n} value={n}>
              @{n}
            </option>
          ))}
          <option value="unassigned">Unassigned</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-line bg-card px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="all">Any status</option>
          {GAP_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        {(initiativeFilter !== "all" ||
          ownerFilter !== "all" ||
          statusFilter !== "all") && (
          <button
            onClick={() => {
              setInitiativeFilter("all");
              setOwnerFilter("all");
              setStatusFilter("all");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          Showing {filtered.length} of {items.length}
        </div>
      </section>

      {/* Table */}
      <section className="mt-3 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/60 text-left text-[10px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">What</th>
              <th className="px-4 py-2 font-medium">Initiative</th>
              <th className="px-4 py-2 font-medium">Owner</th>
              <th className="px-4 py-2 font-medium">Due</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted"
                >
                  {items.length === 0
                    ? "Nothing tracked yet. Log gaps on the Pilot Board or add a task above."
                    : "No items match these filters."}
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <TrackerRow
                key={`${item.kind}_${item.id}`}
                item={item}
                initiativeById={initiativeById}
                today={today}
                onPatch={(p) => patchItem(item, p)}
                onDelete={() => deleteItem(item)}
              />
            ))}
          </tbody>
        </table>
      </section>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

/* ========================================================================= */

function TrackerRow({
  item,
  initiativeById,
  today,
  onPatch,
  onDelete,
}: {
  item: WorkItem;
  initiativeById: Map<string, PilotInitiative>;
  today: string;
  onPatch: (patch: ItemPatch) => void;
  onDelete: () => void;
}) {
  const stage = item.stageKey ? getStageDef(item.stageKey) : undefined;
  const statusDef = STATUS_BY_KEY[item.status];
  const initiative = item.initiativeId
    ? initiativeById.get(item.initiativeId)
    : undefined;
  const overdue =
    !!item.dueDate && item.dueDate < today && item.status !== "done";

  function cycleStatus() {
    const idx = GAP_STATUSES.findIndex((s) => s.key === item.status);
    const next = GAP_STATUSES[(idx + 1) % GAP_STATUSES.length];
    onPatch({ status: next.key });
  }

  return (
    <tr
      className={
        "border-t border-line/60 align-top hover:bg-line/15 " +
        (item.status === "done" ? "opacity-60" : "")
      }
    >
      <td className="px-4 py-2.5">
        {item.kind === "gap" && stage ? (
          <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: `${stage.hex}1a`, color: stage.hex }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: stage.hex }}
            />
            {stage.label}
          </span>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            Task
          </span>
        )}
      </td>
      <td className="min-w-[220px] px-4 py-2.5">
        <input
          type="text"
          defaultValue={item.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== item.title) onPatch({ title: v });
          }}
          placeholder="Untitled"
          className="w-full bg-transparent text-[13px] text-fg placeholder:text-muted/50 focus:outline-none"
          aria-label="Item title"
        />
      </td>
      <td className="px-4 py-2.5 text-[12px] text-muted">
        {initiative ? initiative.title || "Untitled" : "General"}
      </td>
      <td className="px-4 py-2.5">
        <select
          value={item.owner ?? ""}
          onChange={(e) => onPatch({ owner: e.target.value || null })}
          className={
            "whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold transition focus:outline-none " +
            (item.owner
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-line bg-bg/30 text-muted")
          }
          aria-label="Owner"
        >
          <option value="">Owner —</option>
          {LEADER_NAMES.map((n) => (
            <option key={n} value={n}>
              @{n}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2.5">
        <input
          type="date"
          value={item.dueDate}
          onChange={(e) => onPatch({ dueDate: e.target.value })}
          className={
            "rounded-md border bg-bg/40 px-2 py-1 text-[12px] tabular-nums focus:border-accent focus:outline-none " +
            (overdue ? "border-drop/60 text-drop" : "border-line text-fg")
          }
          title={overdue ? "Overdue" : undefined}
          aria-label="Due date"
        />
      </td>
      <td className="px-4 py-2.5">
        <button
          type="button"
          onClick={cycleStatus}
          className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition"
          style={{
            borderColor: `${statusDef.hex}55`,
            background: `${statusDef.hex}1a`,
            color: statusDef.hex,
          }}
          title="Click to cycle status"
        >
          {statusDef.label}
        </button>
      </td>
      <td className="px-4 py-2.5 text-right">
        <button
          type="button"
          onClick={onDelete}
          className="grid h-7 w-7 place-items-center rounded-full border border-drop/40 text-drop transition hover:bg-drop/15"
          aria-label="Delete"
          title="Delete"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function AddTaskForm({
  initiatives,
  onAdd,
}: {
  initiatives: PilotInitiative[];
  onAdd: (
    title: string,
    initiativeId: string | null,
    owner: string | null
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [initiativeId, setInitiativeId] = useState("");
  const [owner, setOwner] = useState("");

  async function submit() {
    const t = title.trim();
    if (!t) return;
    await onAdd(t, initiativeId || null, owner || null);
    setTitle("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line bg-card/40 p-3"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a pilot task — e.g. 'Share pilot brief with the wider team'"
        className="min-w-[240px] flex-1 bg-transparent px-2 text-[13.5px] text-fg placeholder:text-muted/60 focus:outline-none"
        aria-label="Task title"
      />
      <select
        value={initiativeId}
        onChange={(e) => setInitiativeId(e.target.value)}
        className="rounded-md border border-line bg-card px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
        aria-label="Initiative"
      >
        <option value="">General</option>
        {initiatives.map((i) => (
          <option key={i.id} value={i.id}>
            {i.title || "Untitled"}
          </option>
        ))}
      </select>
      <select
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        className="rounded-md border border-line bg-card px-3 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
        aria-label="Owner"
      >
        <option value="">Owner —</option>
        {LEADER_NAMES.map((n) => (
          <option key={n} value={n}>
            @{n}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!title.trim()}
        className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink transition hover:brightness-110 disabled:opacity-40"
      >
        Add
      </button>
    </form>
  );
}
