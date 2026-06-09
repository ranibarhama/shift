"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROLE_COLOR_HEX, type RoleKey } from "@/lib/roles";
import { useConfirm } from "./ConfirmProvider";

type Workflow = { id: string; name: string };

type Props = {
  role: RoleKey;
  workflows: Workflow[];
  selectedId: string | null;
  canEdit: boolean;
};

const COLLAPSE_KEY = "shift_workflow_sidebar_collapsed";

export default function WorkflowSidebar({ role, workflows, selectedId, canEdit }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const accent = ROLE_COLOR_HEX[role];

  // Collapsed state — persisted in localStorage. Initial render must match SSR
  // (always uncollapsed) to avoid hydration mismatch; we sync from storage in
  // an effect after mount.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Create / rename state
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  // Local order — kept in sync with prop; mutated optimistically during drag
  const [orderedIds, setOrderedIds] = useState<string[]>(workflows.map((w) => w.id));
  useEffect(() => {
    setOrderedIds(workflows.map((w) => w.id));
  }, [workflows]);
  const wfById = new Map(workflows.map((w) => [w.id, w]));
  const sortedWorkflows = orderedIds
    .map((id) => wfById.get(id))
    .filter((w): w is Workflow => !!w);

  // Drag tracking
  const dragArmedFor = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

  /* ---------- Mutations ---------- */

  async function createWorkflow() {
    const name = draft.trim();
    setCreating(false);
    setDraft("");
    if (!name) return;
    try {
      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, name }),
      });
      const j = await res.json();
      if (j.process) {
        router.push(`/department/${role}?w=${j.process.id}`);
        router.refresh();
      }
    } catch (err) {
      console.warn("[Shift] create workflow failed", err);
    }
  }

  async function commitRename(id: string) {
    const name = renameDraft.trim();
    setRenamingId(null);
    setRenameDraft("");
    if (!name) return;
    try {
      const res = await fetch(`/api/processes/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.warn("[Shift] rename workflow failed", err);
    }
  }

  async function deleteWorkflow(id: string) {
    const ok = await confirm({
      title: "Delete workflow?",
      message: "This will remove the workflow and every stage in it. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/processes/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      const remaining = workflows.filter((w) => w.id !== id);
      if (remaining.length > 0) {
        router.push(`/department/${role}?w=${remaining[0].id}`);
      } else {
        router.push(`/department/${role}`);
      }
      router.refresh();
    } catch (err) {
      console.warn("[Shift] delete workflow failed", err);
    }
  }

  async function persistOrder(newIds: string[]) {
    setOrderedIds(newIds);
    try {
      await fetch("/api/processes/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, ids: newIds }),
      });
      router.refresh();
    } catch (err) {
      console.warn("[Shift] reorder failed", err);
    }
  }

  /* ---------- Drag handlers ---------- */

  function onRowMouseDown(e: React.MouseEvent, id: string) {
    const target = e.target as HTMLElement;
    dragArmedFor.current = target.closest("[data-drag-handle]") ? id : null;
  }

  function onRowDragStart(e: React.DragEvent, id: string) {
    if (dragArmedFor.current !== id) {
      e.preventDefault();
      return;
    }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function onRowDragOver(e: React.DragEvent, idx: number) {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isAboveMid = e.clientY < rect.top + rect.height / 2;
    setDropTargetIdx(isAboveMid ? idx : idx + 1);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingId || dropTargetIdx === null) {
      resetDrag();
      return;
    }
    const oldIdx = orderedIds.indexOf(draggingId);
    if (oldIdx < 0) {
      resetDrag();
      return;
    }
    let target = dropTargetIdx;
    if (oldIdx < target) target -= 1;
    if (target === oldIdx) {
      resetDrag();
      return;
    }
    const next = [...orderedIds];
    next.splice(oldIdx, 1);
    next.splice(target, 0, draggingId);
    resetDrag();
    void persistOrder(next);
  }

  function resetDrag() {
    setDraggingId(null);
    setDropTargetIdx(null);
    dragArmedFor.current = null;
  }

  /* ---------- Render ---------- */

  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col border-r border-line bg-bg/60 backdrop-blur">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="border-b border-line/60 py-2 text-muted hover:text-fg"
          title="Expand sidebar"
          aria-label="Expand workflow sidebar"
        >
          ›
        </button>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-2">
          {sortedWorkflows.map((w) => {
            const isActive = w.id === selectedId;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  router.push(`/department/${role}?w=${w.id}`);
                  router.refresh();
                }}
                title={w.name}
                aria-label={w.name}
                className="grid h-8 place-items-center rounded-md transition"
                style={isActive ? { background: `${accent}22` } : undefined}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: accent, opacity: isActive ? 1 : 0.5 }}
                />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-bg/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line/60 px-3 py-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">Workflows</span>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-muted hover:text-fg"
          title="Collapse sidebar"
          aria-label="Collapse workflow sidebar"
        >
          ‹
        </button>
      </div>

      <div
        className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2"
        onDragOver={(e) => {
          // Allow drops to land at the bottom area too
          if (draggingId) {
            e.preventDefault();
            if (
              dropTargetIdx === null ||
              dropTargetIdx > sortedWorkflows.length ||
              dropTargetIdx < 0
            ) {
              setDropTargetIdx(sortedWorkflows.length);
            }
          }
        }}
        onDrop={onDrop}
      >
        {sortedWorkflows.length === 0 && !creating && (
          <p className="px-2 py-3 text-xs text-muted">No workflows yet.</p>
        )}

        {sortedWorkflows.map((w, idx) => {
          const isActive = w.id === selectedId;
          const isRenaming = renamingId === w.id;
          const isDragging = draggingId === w.id;
          const showInsertAbove = draggingId && dropTargetIdx === idx && draggingId !== w.id;

          if (isRenaming) {
            return (
              <form
                key={w.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  commitRename(w.id);
                }}
                className="flex items-center gap-1 rounded-md border border-accent/60 bg-card px-2 py-1.5"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => commitRename(w.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setRenamingId(null);
                      setRenameDraft("");
                    }
                  }}
                  className="flex-1 bg-transparent text-sm text-fg focus:outline-none"
                />
              </form>
            );
          }

          return (
            <div key={w.id}>
              {showInsertAbove && (
                <div
                  className="my-0.5 h-0.5 rounded-full"
                  style={{ background: accent }}
                  aria-hidden
                />
              )}
              <div
                draggable={canEdit}
                onMouseDown={(e) => onRowMouseDown(e, w.id)}
                onMouseUp={() => {
                  dragArmedFor.current = null;
                }}
                onDragStart={(e) => onRowDragStart(e, w.id)}
                onDragOver={(e) => onRowDragOver(e, idx)}
                onDragEnd={resetDrag}
                className={
                  "group/row relative flex items-center gap-1 rounded-md px-1.5 py-1.5 transition " +
                  (isDragging ? "opacity-40 " : "") +
                  (isActive ? "" : "hover:bg-line/30")
                }
                style={isActive ? { background: `${accent}22` } : undefined}
              >
                {canEdit && (
                  <span
                    data-drag-handle
                    className="shrink-0 cursor-grab select-none px-1 text-base leading-none text-muted hover:text-fg active:cursor-grabbing"
                    title="Drag to reorder"
                    aria-hidden
                  >
                    ⋮⋮
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/department/${role}?w=${w.id}`);
                    router.refresh();
                  }}
                  className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: accent }}
                  />
                  <span
                    className={
                      "truncate text-sm " + (isActive ? "font-medium" : "text-fg")
                    }
                    style={isActive ? { color: accent } : undefined}
                  >
                    {w.name}
                  </span>
                </button>
                {canEdit && (
                  <span
                    className={
                      "flex items-center gap-0.5 " +
                      (isActive
                        ? "opacity-100"
                        : "opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100")
                    }
                  >
                    <IconBtn
                      label="Rename"
                      onClick={() => {
                        setRenamingId(w.id);
                        setRenameDraft(w.name);
                      }}
                    >
                      <PencilIcon />
                    </IconBtn>
                    <IconBtn label="Delete" danger onClick={() => deleteWorkflow(w.id)}>
                      <CloseIcon />
                    </IconBtn>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {draggingId && dropTargetIdx === sortedWorkflows.length && (
          <div
            className="my-0.5 h-0.5 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
      </div>

      {canEdit && (
        <div className="border-t border-line/60 p-2">
          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createWorkflow();
              }}
              className="flex items-center gap-1 rounded-md border border-accent/60 bg-card px-2 py-1.5"
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  if (draft.trim()) createWorkflow();
                  else {
                    setCreating(false);
                    setDraft("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setCreating(false);
                    setDraft("");
                  }
                }}
                placeholder="Workflow name"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-muted/60 focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full rounded-md border border-dashed border-line py-1.5 text-sm text-muted hover:border-accent/60 hover:text-accent"
            >
              + Add workflow
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={
        "grid h-5 w-5 place-items-center rounded transition " +
        (danger
          ? "text-current hover:bg-drop/15 hover:text-drop"
          : "text-current hover:bg-line/60 hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="11"
      height="11"
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
