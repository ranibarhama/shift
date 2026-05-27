"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_COLOR_HEX, type RoleKey } from "@/lib/roles";
import { useConfirm } from "./ConfirmProvider";

type Workflow = { id: string; name: string };

type Props = {
  role: RoleKey;
  workflows: Workflow[];
  selectedId: string | null;
  canEdit: boolean;
};

export default function WorkflowTabs({ role, workflows, selectedId, canEdit }: Props) {
  const router = useRouter();
  const accent = ROLE_COLOR_HEX[role];
  const confirm = useConfirm();

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  async function createWorkflow() {
    const name = draft.trim();
    setCreating(false);
    setDraft("");
    if (!name) return;
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
  }

  async function commitRename(id: string) {
    const name = renameDraft.trim();
    setRenamingId(null);
    setRenameDraft("");
    if (!name) return;
    const res = await fetch(`/api/processes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) router.refresh();
  }

  async function deleteWorkflow(id: string) {
    const ok = await confirm({
      title: "Delete workflow?",
      message: "This will remove the workflow and every stage in it. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/processes/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const remaining = workflows.filter((w) => w.id !== id);
    if (remaining.length > 0) {
      router.push(`/department/${role}?w=${remaining[0].id}`);
    } else {
      router.push(`/department/${role}`);
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-line bg-bg/60 px-4 py-2 backdrop-blur">
      {workflows.length === 0 && !creating && (
        <span className="px-2 text-xs text-muted">No workflows yet.</span>
      )}

      {workflows.map((w) => {
        const isActive = w.id === selectedId;
        const isRenaming = renamingId === w.id;
        const baseClass =
          "group flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition";
        const activeStyle = {
          background: `${accent}22`,
          borderColor: `${accent}55`,
          color: accent,
        };

        if (isRenaming) {
          return (
            <form
              key={w.id}
              onSubmit={(e) => {
                e.preventDefault();
                commitRename(w.id);
              }}
              className="flex items-center gap-1 rounded-full border border-accent/60 bg-card px-2.5 py-1"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
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
                className="w-40 bg-transparent text-sm text-fg focus:outline-none"
              />
            </form>
          );
        }

        return (
          <div
            key={w.id}
            className={baseClass + " " + (isActive ? "border-transparent" : "border-line text-muted hover:border-line hover:text-fg")}
            style={isActive ? activeStyle : undefined}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
            />
            <button
              type="button"
              onClick={() => {
                if (isActive) {
                  setRenamingId(w.id);
                  setRenameDraft(w.name);
                  return;
                }
                router.push(`/department/${role}?w=${w.id}`);
                router.refresh();
              }}
              onDoubleClick={() => {
                if (!canEdit) return;
                setRenamingId(w.id);
                setRenameDraft(w.name);
              }}
              className="bg-transparent text-current focus:outline-none"
              title={canEdit && isActive ? "Click to rename · double-click anywhere to rename" : w.name}
            >
              {w.name}
            </button>

            {canEdit && (
              <span
                className={
                  "ml-1 flex items-center gap-0.5 " +
                  (isActive
                    ? "opacity-100"
                    : "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100")
                }
              >
                <IconBtn
                  label="Rename workflow"
                  onClick={() => {
                    setRenamingId(w.id);
                    setRenameDraft(w.name);
                  }}
                >
                  <PencilIcon />
                </IconBtn>
                <IconBtn
                  label="Delete workflow"
                  onClick={() => deleteWorkflow(w.id)}
                  danger
                >
                  <CloseIcon />
                </IconBtn>
              </span>
            )}
          </div>
        );
      })}

      {canEdit && (
        <div className="ml-1 flex items-center">
          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createWorkflow();
              }}
              className="flex items-center gap-1 rounded-full border border-accent/60 bg-card px-2.5 py-1"
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
                className="w-40 bg-transparent text-sm text-fg placeholder:text-muted/60 focus:outline-none"
              />
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-muted hover:border-accent/60 hover:text-accent"
            >
              + Add workflow
            </button>
          )}
        </div>
      )}
    </div>
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
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
