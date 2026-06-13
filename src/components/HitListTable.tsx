"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import { ITEM_KINDS, getTag } from "@/lib/tags";
import { TrashIcon } from "./DecisionIcons";
import { useConfirm } from "./ConfirmProvider";
import type { DropRow } from "@/lib/queries";

type SortKey = "content" | "type" | "context" | "author" | "added";
type SortDir = "asc" | "desc";
type RowTypeFilter = "all" | "stage" | "participant" | "task" | "pain_point";

const ROW_KIND_LABEL: Record<string, string> = {
  stage: "Stage",
  participant: "Participant",
  task: "Task",
  pain_point: "Pain point",
};

export default function HitListTable({ rows: initialRows }: { rows: DropRow[] }) {
  const dropTag = getTag("drop")!;
  const confirm = useConfirm();
  const [rows, setRows] = useState<DropRow[]>(initialRows);
  useEffect(() => setRows(initialRows), [initialRows]);

  const [search, setSearch] = useState("");
  const [rowType, setRowType] = useState<RowTypeFilter>("all");
  const [scope, setScope] = useState<"all" | "main" | RoleKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("added");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function deleteRow(r: DropRow) {
    if (r.row_type === "stage") {
      const itemCount = r.stage_item_count ?? 0;
      const commentCount = r.stage_comment_count ?? 0;
      const cascadeParts: string[] = [];
      if (itemCount > 0) cascadeParts.push(`${itemCount} item${itemCount === 1 ? "" : "s"}`);
      if (commentCount > 0)
        cascadeParts.push(`${commentCount} comment${commentCount === 1 ? "" : "s"}`);
      const cascade =
        cascadeParts.length > 0 ? ` This will also delete ${cascadeParts.join(" and ")} on the stage.` : "";
      const ok = await confirm({
        title: "Delete this stage?",
        message: `Remove "${r.content}" from ${r.process_name}.${cascade} The stage and everything on it will disappear from the canvas, the backlog, and this list. This cannot be undone.`,
        confirmLabel: "Delete stage",
        danger: true,
      });
      if (!ok) return;
      setRows((arr) => arr.filter((x) => !(x.row_type === "stage" && x.id === r.id)));
      try {
        await fetch(`/api/stages/${r.id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("[Shift] hit-list stage delete failed", err);
      }
    } else {
      const ok = await confirm({
        title: "Delete this item?",
        message: `Remove "${r.content}" from ${r.stage_name}. This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
      setRows((arr) => arr.filter((x) => !(x.row_type === "item" && x.id === r.id)));
      try {
        await fetch(`/api/items/${r.id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("[Shift] hit-list item delete failed", err);
      }
    }
  }

  const filtered = useMemo(() => {
    let list = rows;
    if (rowType !== "all") {
      list = list.filter((r) => (r.row_type === "stage" ? rowType === "stage" : r.kind === rowType));
    }
    if (scope === "main") list = list.filter((r) => r.process_type === "main");
    else if (scope !== "all") list = list.filter((r) => r.department_role === scope);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.content.toLowerCase().includes(q) ||
          r.stage_name.toLowerCase().includes(q) ||
          r.process_name.toLowerCase().includes(q)
      );
    }
    const cmp = (a: DropRow, b: DropRow) => {
      let r = 0;
      switch (sortKey) {
        case "content":
          r = a.content.localeCompare(b.content);
          break;
        case "type":
          r = (a.row_type === "stage" ? "stage" : a.kind ?? "").localeCompare(
            b.row_type === "stage" ? "stage" : b.kind ?? ""
          );
          break;
        case "context":
          r =
            a.process_name.localeCompare(b.process_name) ||
            a.stage_name.localeCompare(b.stage_name);
          break;
        case "author":
          r = (a.author_role ?? "").localeCompare(b.author_role ?? "");
          break;
        case "added":
        default:
          r = (a.created_at ?? 0) - (b.created_at ?? 0);
      }
      return sortDir === "asc" ? r : -r;
    };
    return [...list].sort(cmp);
  }, [rows, search, rowType, scope, sortKey, sortDir]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { stage: 0, participant: 0, task: 0, pain_point: 0 };
    for (const r of rows) {
      if (r.row_type === "stage") m.stage += 1;
      else if (r.kind && m[r.kind] !== undefined) m[r.kind] += 1;
    }
    return m;
  }, [rows]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: `${dropTag.hex}22`, color: dropTag.hex }}
          >
            <TrashIcon size={20} strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Hit List</h1>
            <p className="mt-1 text-sm text-muted">
              Everything we&apos;ve marked as <span className="text-drop font-medium">Drop it</span>{" "}
              across the main process and all department workflows — stages and items together.{" "}
              {rows.length} total.
            </p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <SummaryChip
          label="All"
          count={rows.length}
          active={rowType === "all"}
          onClick={() => setRowType("all")}
          hex={dropTag.hex}
        />
        <SummaryChip
          label="Stages"
          count={counts.stage}
          active={rowType === "stage"}
          onClick={() => setRowType("stage")}
          hex={dropTag.hex}
        />
        {ITEM_KINDS.filter((k) => k.key !== "missing").map((k) => (
          <SummaryChip
            key={k.key}
            label={
              k.key === "participant" ? "Participants" : k.key === "task" ? "Tasks" : "Pain points"
            }
            count={counts[k.key] ?? 0}
            active={rowType === (k.key as RowTypeFilter)}
            onClick={() => setRowType(k.key as RowTypeFilter)}
            hex={dropTag.hex}
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
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
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
        {(search || rowType !== "all" || scope !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setRowType("all");
              setScope("all");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          Showing {filtered.length} of {rows.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <Th sortKey="content" current={sortKey} dir={sortDir} onClick={toggleSort}>What</Th>
              <Th sortKey="type" current={sortKey} dir={sortDir} onClick={toggleSort}>Type</Th>
              <Th sortKey="context" current={sortKey} dir={sortDir} onClick={toggleSort}>Stage · Workflow</Th>
              <Th sortKey="author" current={sortKey} dir={sortDir} onClick={toggleSort}>Tagged by</Th>
              <Th sortKey="added" current={sortKey} dir={sortDir} onClick={toggleSort}>Added</Th>
              <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                  {rows.length === 0
                    ? "Nothing tagged Drop yet."
                    : "No rows match these filters."}
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const author = r.author_role ? getRole(r.author_role) : null;
              const linkHref =
                r.process_type === "main"
                  ? `/main`
                  : `/department/${r.department_role}?w=${r.process_id}`;
              const isStage = r.row_type === "stage";
              return (
                <tr key={`${r.row_type}_${r.id}`} className="border-t border-line/60 hover:bg-line/15">
                  <td className="px-4 py-2.5 align-top">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-drop" aria-hidden>
                        <TrashIcon size={14} strokeWidth={2} />
                      </span>
                      <span className={isStage ? "font-medium text-fg" : "text-fg"}>{r.content}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      style={
                        isStage
                          ? { background: "rgb(var(--line) / 0.35)", color: "rgb(var(--fg))", borderColor: "rgb(var(--line))" }
                          : { background: "rgb(var(--line) / 0.2)", color: "rgb(var(--muted))", borderColor: "rgb(var(--line))" }
                      }
                    >
                      {isStage ? ROW_KIND_LABEL.stage : ROW_KIND_LABEL[r.kind ?? ""] ?? r.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <Link href={linkHref} className="text-fg hover:text-accent">
                      {isStage ? <em className="not-italic">(this stage)</em> : r.stage_name}
                    </Link>
                    <div className="text-[11px] text-muted">
                      {r.process_type === "main" ? (
                        <span className="text-accent">Main process</span>
                      ) : (
                        <>
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                            style={{ background: ROLE_COLOR_HEX[r.department_role as RoleKey] }}
                          />
                          {r.process_name}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    {author ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-ink"
                          style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
                        >
                          {author.initials}
                        </span>
                        <span className="text-xs text-fg">{author.label}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-2.5 align-top text-xs text-muted"
                    title={r.created_at ? new Date(r.created_at).toLocaleString() : undefined}
                  >
                    {r.created_at ? relative(r.created_at) : "—"}
                  </td>
                  <td className="px-4 py-2.5 align-top text-right">
                    <button
                      type="button"
                      onClick={() => deleteRow(r)}
                      className="grid h-7 w-7 place-items-center rounded-full border border-drop/40 text-drop transition hover:bg-drop/15"
                      aria-label={isStage ? "Delete this stage" : "Delete this item"}
                      title={
                        isStage
                          ? `Delete this stage and everything on it`
                          : "Delete this item everywhere"
                      }
                    >
                      <CloseIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
