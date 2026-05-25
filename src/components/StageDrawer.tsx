"use client";

import { useEffect, useState } from "react";
import {
  ITEM_KINDS,
  TAGS,
  MISSING_CATEGORIES,
  getTag,
  getMissingCategory,
  type ItemKind,
  type MissingCategory,
} from "@/lib/tags";
import type { ItemRow, StageRow } from "@/lib/queries";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";

type Props = {
  stage: StageRow | null;
  items: ItemRow[];
  mainStages?: { id: string; name: string }[];
  isDepartmentProcess: boolean;
  canEdit: boolean;
  onClose: () => void;
  onUpdateStage: (patch: Partial<StageRow>) => Promise<void>;
  onDeleteStage: () => Promise<void>;
  onAddItem: (kind: ItemKind, content: string, initialTag?: string | null) => Promise<void>;
  onUpdateItem: (id: string, patch: Partial<ItemRow>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
};

export default function StageDrawer({
  stage,
  items,
  mainStages,
  isDepartmentProcess,
  canEdit,
  onClose,
  onUpdateStage,
  onDeleteStage,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: Props) {
  const [draftName, setDraftName] = useState(stage?.name ?? "");
  const [draftDesc, setDraftDesc] = useState(stage?.description ?? "");

  useEffect(() => {
    setDraftName(stage?.name ?? "");
    setDraftDesc(stage?.description ?? "");
  }, [stage?.id]);

  if (!stage) return null;

  const blur = (field: "name" | "description", val: string) => {
    if ((stage as any)[field] === val) return;
    onUpdateStage({ [field]: val } as Partial<StageRow>);
  };

  return (
    <aside className="pointer-events-auto absolute right-0 top-0 z-30 flex h-full w-[420px] flex-col border-l border-line bg-canvas/95 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-xs uppercase tracking-wider text-muted">Stage</div>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-muted hover:bg-card hover:text-fg"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => blur("name", draftName)}
          disabled={!canEdit}
          placeholder="Stage name"
          className="w-full bg-transparent text-2xl font-semibold text-fg placeholder:text-muted/60 focus:outline-none disabled:opacity-70"
        />
        <textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onBlur={() => blur("description", draftDesc)}
          disabled={!canEdit}
          placeholder="What happens in this stage?"
          rows={3}
          className="mt-2 w-full resize-none rounded-md border border-line/70 bg-line/20 px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none disabled:opacity-70"
        />

        <div className="mt-4">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">Stage-level decision</div>
          <TagPicker
            value={stage.tag}
            onChange={(t) => onUpdateStage({ tag: t as StageRow["tag"] })}
            disabled={!canEdit}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">Step owner</div>
          <OwnerPicker
            value={stage.owner_role}
            onChange={(r) => onUpdateStage({ owner_role: r })}
            disabled={!canEdit}
          />
        </div>

        {isDepartmentProcess && mainStages && (
          <div className="mt-4">
            <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">
              Connects to main process stage
            </div>
            <select
              value={stage.connected_main_stage_id ?? ""}
              onChange={(e) => onUpdateStage({ connected_main_stage_id: e.target.value || null })}
              disabled={!canEdit}
              className="w-full rounded-md border border-line/70 bg-line/20 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none disabled:opacity-70"
            >
              <option value="">— not connected —</option>
              {mainStages.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="my-5 h-px bg-line/60" />

        {ITEM_KINDS.filter((k) => k.key !== "missing").map((k) => (
          <ItemSection
            key={k.key}
            kind={k.key}
            label={k.label}
            verb={k.verb}
            items={items.filter((it) => it.kind === k.key)}
            canEdit={canEdit}
            onAdd={(c) => onAddItem(k.key, c)}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
          />
        ))}

        <div className="my-5 h-px bg-line/60" />

        <MissingSection
          items={items.filter((it) => it.kind === "missing")}
          canEdit={canEdit}
          onAdd={(content, category) => onAddItem("missing", content, category)}
          onUpdate={onUpdateItem}
          onDelete={onDeleteItem}
        />

        {canEdit && (
          <button
            onClick={() => {
              if (confirm("Delete this stage?")) onDeleteStage();
            }}
            className="mt-6 w-full rounded-md border border-drop/40 px-3 py-2 text-sm text-drop hover:bg-drop/10"
          >
            Delete stage
          </button>
        )}
      </div>
    </aside>
  );
}

function OwnerPicker({
  value,
  onChange,
  disabled,
}: {
  value: RoleKey | null;
  onChange: (r: RoleKey | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ROLES.map((r) => {
        const active = value === r.key;
        const hex = ROLE_COLOR_HEX[r.key as RoleKey];
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => onChange(active ? null : (r.key as RoleKey))}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium tracking-wide transition disabled:opacity-60"
            style={{
              background: active ? `${hex}22` : "transparent",
              borderColor: active ? hex : "#2a3358",
              color: active ? hex : "#8892b8",
            }}
            aria-pressed={active}
            title={r.label}
          >
            <span
              className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-ink"
              style={{ background: hex }}
            >
              {r.initials}
            </span>
            {r.key === "gm" ? "GM" : r.label.replace(/^Director of\s+/i, "")}
          </button>
        );
      })}
    </div>
  );
}

function TagPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (t: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TAGS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(active ? null : t.key)}
            disabled={disabled}
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition disabled:opacity-60"
            style={{
              background: active ? `${t.hex}22` : "transparent",
              borderColor: active ? t.hex : "#2a3358",
              color: active ? t.hex : "#8892b8",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ItemSection({
  kind,
  label,
  verb,
  items,
  canEdit,
  onAdd,
  onUpdate,
  onDelete,
}: {
  kind: ItemKind;
  label: string;
  verb: string;
  items: ItemRow[];
  canEdit: boolean;
  onAdd: (content: string) => void;
  onUpdate: (id: string, patch: Partial<ItemRow>) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">{label}</h3>
        <span className="text-xs text-muted">{items.length}</span>
      </div>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <ItemRowEditor
            key={it.id}
            item={it}
            canEdit={canEdit}
            onUpdate={(patch) => onUpdate(it.id, patch)}
            onDelete={() => onDelete(it.id)}
          />
        ))}
      </ul>

      {canEdit && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = draft.trim();
            if (!v) return;
            onAdd(v);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={verb}
            className="flex-1 rounded-md border border-line/70 bg-line/20 px-3 py-1.5 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-accent/20 px-3 py-1.5 text-sm text-accent hover:bg-accent/30"
          >
            Add
          </button>
        </form>
      )}
    </section>
  );
}

function ItemRowEditor({
  item,
  canEdit,
  onUpdate,
  onDelete,
}: {
  item: ItemRow;
  canEdit: boolean;
  onUpdate: (patch: Partial<ItemRow>) => void;
  onDelete: () => void;
}) {
  const [content, setContent] = useState(item.content);
  const author = item.author_role ? getRole(item.author_role) : null;

  useEffect(() => setContent(item.content), [item.id, item.content]);

  return (
    <li className="group rounded-md border border-line/50 bg-line/20 p-2">
      <div className="flex items-start gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => content !== item.content && onUpdate({ content })}
          disabled={!canEdit}
          className="flex-1 bg-transparent text-sm text-fg focus:outline-none disabled:opacity-80"
        />
        {canEdit && (
          <button
            onClick={onDelete}
            className="invisible text-xs text-muted hover:text-drop group-hover:visible"
            aria-label="Delete"
          >
            ✕
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {TAGS.map((t) => {
          const active = item.tag === t.key;
          return (
            <button
              key={t.key}
              onClick={() => canEdit && onUpdate({ tag: active ? null : (t.key as any) })}
              disabled={!canEdit}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium transition disabled:opacity-60"
              style={{
                background: active ? `${t.hex}22` : "transparent",
                color: active ? t.hex : "#5b6489",
                border: `1px solid ${active ? t.hex : "#2a3358"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
        {author && (
          <span
            className="ml-auto flex items-center gap-1 text-[10px] text-muted"
            title={`Added by ${author.label}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
            />
            {author.initials}
          </span>
        )}
      </div>
    </li>
  );
}

/* ---------- "What's missing" section ---------- */

function MissingSection({
  items,
  canEdit,
  onAdd,
  onUpdate,
  onDelete,
}: {
  items: ItemRow[];
  canEdit: boolean;
  onAdd: (content: string, category: MissingCategory) => void;
  onUpdate: (id: string, patch: Partial<ItemRow>) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<MissingCategory>("tool");

  return (
    <section className="mb-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">What's missing</h3>
        <span className="text-xs text-muted">{items.length}</span>
      </div>
      <p className="mb-2 text-[11px] text-muted">
        Gaps to close — tools, infrastructure, or workflow pieces we don't have yet.
        Items here also appear in the <span className="text-fg">Todo Backlog</span>.
      </p>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <MissingItemRow
            key={it.id}
            item={it}
            canEdit={canEdit}
            onUpdate={(patch) => onUpdate(it.id, patch)}
            onDelete={() => onDelete(it.id)}
          />
        ))}
      </ul>

      {canEdit && (
        <form
          className="mt-2 space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const v = draft.trim();
            if (!v) return;
            onAdd(v, category);
            setDraft("");
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {MISSING_CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide transition"
                  style={{
                    background: active ? `${c.hex}22` : "transparent",
                    borderColor: active ? c.hex : "#2a3358",
                    color: active ? c.hex : "#8892b8",
                  }}
                  aria-pressed={active}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`What ${getMissingCategory(category)?.label.toLowerCase()} is missing?`}
              className="flex-1 rounded-md border border-line/70 bg-line/20 px-3 py-1.5 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-accent/20 px-3 py-1.5 text-sm text-accent hover:bg-accent/30"
            >
              Add
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function MissingItemRow({
  item,
  canEdit,
  onUpdate,
  onDelete,
}: {
  item: ItemRow;
  canEdit: boolean;
  onUpdate: (patch: Partial<ItemRow>) => void;
  onDelete: () => void;
}) {
  const [content, setContent] = useState(item.content);
  const author = item.author_role ? getRole(item.author_role) : null;
  const cat = getMissingCategory(item.tag);

  useEffect(() => setContent(item.content), [item.id, item.content]);

  return (
    <li
      className="group rounded-md border bg-line/20 p-2"
      style={{ borderColor: cat ? `${cat.hex}55` : "var(--tw-line, #2a3358)" }}
    >
      <div className="flex items-start gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => content !== item.content && onUpdate({ content })}
          disabled={!canEdit}
          className="flex-1 bg-transparent text-sm text-fg focus:outline-none disabled:opacity-80"
        />
        {canEdit && (
          <button
            onClick={onDelete}
            className="invisible text-xs text-muted hover:text-drop group-hover:visible"
            aria-label="Delete"
          >
            ✕
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {MISSING_CATEGORIES.map((c) => {
          const active = (item.tag as string | null) === c.key;
          return (
            <button
              key={c.key}
              onClick={() => canEdit && onUpdate({ tag: c.key as unknown as ItemRow["tag"] })}
              disabled={!canEdit}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium transition disabled:opacity-60"
              style={{
                background: active ? `${c.hex}22` : "transparent",
                color: active ? c.hex : "#5b6489",
                border: `1px solid ${active ? c.hex : "#2a3358"}`,
              }}
            >
              {c.label}
            </button>
          );
        })}
        {author && (
          <span
            className="ml-auto flex items-center gap-1 text-[10px] text-muted"
            title={`Added by ${author.label}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
            />
            {author.initials}
          </span>
        )}
      </div>
    </li>
  );
}
