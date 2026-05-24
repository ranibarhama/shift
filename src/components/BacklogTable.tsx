"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MISSING_CATEGORIES, type MissingCategory, getMissingCategory } from "@/lib/tags";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import type { MissingItemRow } from "@/lib/queries";

type SortKey = "content" | "category" | "context" | "author" | "created";
type SortDir = "asc" | "desc";

type Props = {
  items: MissingItemRow[];
};

export default function BacklogTable({ items }: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MissingCategory | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "main" | RoleKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = items;
    if (catFilter !== "all") list = list.filter((i) => i.category === catFilter);
    if (scopeFilter === "main") list = list.filter((i) => i.process_type === "main");
    else if (scopeFilter !== "all")
      list = list.filter((i) => i.department_role === scopeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.content.toLowerCase().includes(q) ||
          i.stage_name.toLowerCase().includes(q) ||
          i.process_name.toLowerCase().includes(q)
      );
    }
    const cmp = (a: MissingItemRow, b: MissingItemRow) => {
      let r = 0;
      switch (sortKey) {
        case "content":
          r = a.content.localeCompare(b.content);
          break;
        case "category":
          r = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "context":
          r =
            a.process_name.localeCompare(b.process_name) ||
            a.stage_name.localeCompare(b.stage_name);
          break;
        case "author":
          r = (a.author_role ?? "").localeCompare(b.author_role ?? "");
          break;
        case "created":
        default:
          r = a.created_at - b.created_at;
      }
      return sortDir === "asc" ? r : -r;
    };
    return [...list].sort(cmp);
  }, [items, search, catFilter, scopeFilter, sortKey, sortDir]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = { tool: 0, infrastructure: 0, workflow: 0, _untagged: 0 };
    for (const i of items) {
      const k = i.category && m[i.category] !== undefined ? i.category : "_untagged";
      m[k] = (m[k] ?? 0) + 1;
    }
    return m;
  }, [items]);

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Todo Backlog</h1>
          <p className="mt-1 text-sm text-muted">
            Every "What's missing" item logged on a stage across the main process and all
            department workflows. {items.length} total.
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryChip
          label="All"
          count={items.length}
          active={catFilter === "all"}
          onClick={() => setCatFilter("all")}
          hex="#7c5cff"
        />
        {MISSING_CATEGORIES.map((c) => (
          <SummaryChip
            key={c.key}
            label={c.label}
            count={byCat[c.key] ?? 0}
            active={catFilter === c.key}
            onClick={() => setCatFilter(c.key)}
            hex={c.hex}
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
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as typeof scopeFilter)}
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
        {(search || catFilter !== "all" || scopeFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setCatFilter("all");
              setScopeFilter("all");
            }}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
          >
            Clear
          </button>
        )}
        <div className="ml-auto text-xs text-muted">
          Showing {filtered.length} of {items.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-card/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <Th sortKey="content" current={sortKey} dir={sortDir} onClick={toggleSort}>Item</Th>
              <Th sortKey="category" current={sortKey} dir={sortDir} onClick={toggleSort}>Type</Th>
              <Th sortKey="context" current={sortKey} dir={sortDir} onClick={toggleSort}>Stage · Workflow</Th>
              <Th sortKey="author" current={sortKey} dir={sortDir} onClick={toggleSort}>Created by</Th>
              <Th sortKey="created" current={sortKey} dir={sortDir} onClick={toggleSort}>Added</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">
                  {items.length === 0
                    ? "No backlog items yet. Open a stage and add something under \"What's missing\"."
                    : "No items match these filters."}
                </td>
              </tr>
            )}
            {filtered.map((it) => {
              const cat = getMissingCategory(it.category);
              const author = it.author_role ? getRole(it.author_role) : null;
              const linkHref =
                it.process_type === "main"
                  ? `/main`
                  : `/department/${it.department_role}?w=${it.process_id}`;
              return (
                <tr key={it.id} className="border-t border-line/60 hover:bg-line/15">
                  <td className="px-4 py-2.5 align-top text-fg">{it.content}</td>
                  <td className="px-4 py-2.5 align-top">
                    {cat ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: `${cat.hex}22`,
                          color: cat.hex,
                          border: `1px solid ${cat.hex}55`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: cat.hex }}
                        />
                        {cat.label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">— uncategorized —</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    <Link href={linkHref} className="text-fg hover:text-accent">
                      {it.stage_name}
                    </Link>
                    <div className="text-[11px] text-muted">
                      {it.process_type === "main" ? (
                        <span className="text-accent">Main process</span>
                      ) : (
                        <>
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                            style={{ background: ROLE_COLOR_HEX[it.department_role as RoleKey] }}
                          />
                          {it.process_name}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 align-top">
                    {author ? (
                      <span className="inline-flex items-center gap-1.5 text-fg">
                        <span
                          className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-ink"
                          style={{ background: ROLE_COLOR_HEX[author.key as RoleKey] }}
                        >
                          {author.initials}
                        </span>
                        <span className="text-xs">{author.label}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-top text-xs text-muted" title={new Date(it.created_at).toLocaleString()}>
                    {relative(it.created_at)}
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
        {active && (
          <span className="ml-1 text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>
        )}
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
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: hex }}
      />
    </button>
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
