"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { TAGS, getTag, ITEM_KINDS, type TagKey } from "@/lib/tags";
import { ROLES, ROLE_COLOR_HEX } from "@/lib/roles";
import type { RoleKey } from "@/lib/roles";
import { DecisionIcon } from "./DecisionIcons";

export type StageNodeData = {
  name: string;
  description: string;
  tag: string | null;
  ownerRole: RoleKey | null;
  itemCounts: { participant: number; task: number; pain_point: number; missing: number };
  tagCounts: Record<TagKey, number>;
  taggedCount: number;
  totalItems: number;
  commentCount: number;
  accentColor?: string;
  departmentRole?: RoleKey;
  badge?: string;
};

export default function StageNode({ data, selected }: NodeProps) {
  const d = data as StageNodeData;
  const tag = getTag(d.tag);
  const accent = d.accentColor ?? "#7c5cff";

  return (
    <div
      className={`relative w-[260px] rounded-2xl border bg-card text-fg shadow-card transition ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-line hover:border-line/80"
      }`}
      style={{ boxShadow: selected ? `0 0 0 1px ${accent}55, 0 10px 30px -10px ${accent}66` : undefined }}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div
        className="absolute -left-1 -top-1 h-3 w-3 rounded-full"
        style={{ background: accent }}
        title={d.departmentRole ?? "main"}
      />

      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          {d.badge && (
            <div className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                 style={{ background: `${accent}22`, color: accent }}>
              {d.badge}
            </div>
          )}
          <div className="truncate text-base font-semibold">{d.name || "Untitled stage"}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {tag && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: `${tag.hex}22`, color: tag.hex, border: `1px solid ${tag.hex}55` }}
            >
              {tag.label}
            </span>
          )}
          {d.commentCount > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-line/30 px-1.5 py-0.5 text-[10px] text-muted"
              title={`${d.commentCount} comment${d.commentCount === 1 ? "" : "s"}`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {d.commentCount}
            </span>
          )}
        </div>
      </div>

      {d.description && (
        <p className="line-clamp-2 px-4 pt-1 text-xs text-muted">{d.description}</p>
      )}

      {d.ownerRole && (() => {
        const role = ROLES.find((r) => r.key === d.ownerRole);
        if (!role) return null;
        const hex = ROLE_COLOR_HEX[d.ownerRole];
        return (
          <div className="flex items-center gap-1.5 px-4 pt-2 text-[10px]">
            <span className="uppercase tracking-wider text-muted">Owner</span>
            <span
              className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-ink"
              style={{ background: hex }}
              title={role.label}
            >
              {role.initials}
            </span>
            <span className="font-medium" style={{ color: hex }}>
              {d.ownerRole === "gm" ? "GM" : role.label.replace(/^Director of\s+/i, "")}
            </span>
          </div>
        );
      })()}

      <div className="mt-3 grid grid-cols-3 gap-1 px-3 pb-3">
        {ITEM_KINDS.filter((k) => k.key !== "missing").map((k) => (
          <div
            key={k.key}
            className="rounded-md bg-line/30 px-2 py-1.5 text-center"
            title={k.label}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted">
              {shortKind(k.key)}
            </div>
            <div className="text-sm font-semibold text-fg">
              {d.itemCounts[k.key as keyof typeof d.itemCounts] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {(d.itemCounts.missing ?? 0) > 0 && (
        <div className="flex items-center justify-between border-t border-line/60 px-3 py-2 text-[10px]">
          <span className="uppercase tracking-wider text-muted">Missing</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent">
            {d.itemCounts.missing} to backlog
          </span>
        </div>
      )}

      {d.totalItems > 0 && (
        <div className="flex items-center gap-1 border-t border-line/60 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted">Decisions</span>
          <div className="ml-auto flex items-center gap-1.5">
            {TAGS.map((t) => {
              const Icon = DecisionIcon[t.key];
              const count = d.tagCounts?.[t.key] ?? 0;
              const active = count > 0;
              return (
                <span
                  key={t.key}
                  className="relative flex h-5 w-5 items-center justify-center rounded-md transition"
                  style={{
                    color: t.hex,
                    background: active ? `${t.hex}22` : "transparent",
                    opacity: active ? 1 : 0.35,
                  }}
                  title={`${t.label}: ${count}`}
                  aria-label={`${t.label}: ${count}`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {count > 0 && (
                    <span
                      className="absolute -right-1 -top-1 grid h-3 min-w-[12px] place-items-center rounded-full px-0.5 text-[8px] font-semibold leading-none text-ink"
                      style={{ background: t.hex }}
                    >
                      {count}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <span className="ml-2 text-[10px] tabular-nums text-muted">
            {d.taggedCount}/{d.totalItems}
          </span>
        </div>
      )}
    </div>
  );
}

function shortKind(k: string) {
  if (k === "participant") return "Who";
  if (k === "task") return "Tasks";
  return "Pains";
}
