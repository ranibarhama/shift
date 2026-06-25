"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PILOT_STAGES,
  GAP_TYPES,
  GAP_STATUSES,
  type GapType,
  type GapStatus,
  type StageKey,
  type PilotInitiative,
  type PilotGap,
} from "@/lib/pilotBoard";
import { LEADER_NAMES } from "@/lib/stoneBriefs";
import { useConfirm } from "./ConfirmProvider";

type Props = {
  initialInitiatives: PilotInitiative[];
  initialGaps: PilotGap[];
};

export default function PilotBoardView({
  initialInitiatives,
  initialGaps,
}: Props) {
  const [initiatives, setInitiatives] = useState<PilotInitiative[]>(
    initialInitiatives
  );
  const [gaps, setGaps] = useState<PilotGap[]>(initialGaps);
  const confirm = useConfirm();

  useEffect(() => setInitiatives(initialInitiatives), [initialInitiatives]);
  useEffect(() => setGaps(initialGaps), [initialGaps]);

  const candidates = initiatives.filter((i) => !i.selected);
  const selected = initiatives.filter((i) => i.selected);

  /* ---------- Initiative mutations ---------- */

  async function addInitiative(title: string, description: string) {
    const res = await fetch("/api/pilot-initiatives", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) return;
    const { initiative } = (await res.json()) as { initiative: PilotInitiative };
    setInitiatives((arr) => [...arr, initiative]);
  }

  function patchInitiative(id: string, patch: Partial<PilotInitiative>) {
    setInitiatives((arr) =>
      arr.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.selected !== undefined) body.selected = patch.selected;
    void fetch(`/api/pilot-initiatives/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function deleteInitiative(initiative: PilotInitiative) {
    const ok = await confirm({
      title: "Delete this initiative?",
      message: `"${initiative.title || "Untitled"}" and every gap mapped to it will be removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setInitiatives((arr) => arr.filter((i) => i.id !== initiative.id));
    setGaps((arr) => arr.filter((g) => g.initiativeId !== initiative.id));
    void fetch(`/api/pilot-initiatives/${initiative.id}`, { method: "DELETE" });
  }

  /* ---------- Gap mutations ---------- */

  async function addGap(initiativeId: string, stageKey: StageKey) {
    const res = await fetch("/api/pilot-gaps", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initiativeId, stageKey }),
    });
    if (!res.ok) return;
    const { gap } = (await res.json()) as { gap: PilotGap };
    setGaps((arr) => [...arr, gap]);
  }

  function patchGap(id: string, patch: Partial<PilotGap>) {
    setGaps((arr) => arr.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.type !== undefined) body.type = patch.type;
    if (patch.typeOther !== undefined) body.typeOther = patch.typeOther;
    if (patch.owner !== undefined) body.owner = patch.owner;
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.notes !== undefined) body.notes = patch.notes;
    void fetch(`/api/pilot-gaps/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function deleteGap(id: string) {
    setGaps((arr) => arr.filter((g) => g.id !== id));
    void fetch(`/api/pilot-gaps/${id}`, { method: "DELETE" });
  }

  /* ---------- Render ---------- */

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Hero */}
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
          Pilot working board
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
          Pilot Board
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-muted">
          Where we shape the pilot together. Three moves: propose initiatives,
          pick 2-3 to take into the pilot, then walk each through every stage of
          How good looks like and log what we&apos;re missing to make it run.
          Everything saves live.
        </p>
      </header>

      {/* Section 1 — Initiatives pool */}
      <InitiativesPool
        candidates={candidates}
        selectedCount={selected.length}
        onAdd={addInitiative}
        onPatch={patchInitiative}
        onDelete={deleteInitiative}
      />

      {/* Section 2 — Matrix */}
      <section className="mt-12">
        <SectionHeader
          eyebrow="Step 2"
          title="Walk each selected initiative through the stages"
          help="Add the gaps we'd need to close for the initiative to run through that stage."
        />
        {selected.length === 0 ? (
          <EmptyMatrix />
        ) : (
          <div className="space-y-8">
            {selected.map((initiative) => (
              <InitiativeRow
                key={initiative.id}
                initiative={initiative}
                gaps={gaps.filter((g) => g.initiativeId === initiative.id)}
                onPatchInitiative={(p) => patchInitiative(initiative.id, p)}
                onAddGap={(stageKey) => addGap(initiative.id, stageKey)}
                onPatchGap={patchGap}
                onDeleteGap={deleteGap}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Backlog roll-up */}
      <section className="mt-12">
        <SectionHeader
          eyebrow="Step 3"
          title="Gap backlog — everything we need to build, buy or set up"
        />
        <GapBacklog initiatives={initiatives} gaps={gaps} />
      </section>
    </main>
  );
}

/* ========================================================================= */
/* Section header                                                            */
/* ========================================================================= */

function SectionHeader({
  eyebrow,
  title,
  help,
}: {
  eyebrow: string;
  title: string;
  help?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-lg font-semibold text-fg">{title}</h2>
      {help && <p className="mt-1 text-[12.5px] text-muted">{help}</p>}
    </div>
  );
}

/* ========================================================================= */
/* Initiatives pool                                                          */
/* ========================================================================= */

function InitiativesPool({
  candidates,
  selectedCount,
  onAdd,
  onPatch,
  onDelete,
}: {
  candidates: PilotInitiative[];
  selectedCount: number;
  onAdd: (title: string, description: string) => Promise<void>;
  onPatch: (id: string, patch: Partial<PilotInitiative>) => void;
  onDelete: (initiative: PilotInitiative) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function submit() {
    const t = title.trim();
    if (!t) return;
    await onAdd(t, description.trim());
    setTitle("");
    setDescription("");
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Step 1"
        title="Propose initiatives, then select 2-3 for the pilot"
        help="Click ✓ Add to pilot on the ones the team wants to take forward."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip>
          <span className="text-fg">{candidates.length}</span> candidates
        </Chip>
        <Chip accent>
          <span className="text-accent">{selectedCount}</span> selected
        </Chip>
      </div>

      {/* Add form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mb-5 rounded-2xl border border-dashed border-line bg-card/40 p-4"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New initiative — e.g. 'AI-driven product onboarding'"
          className="w-full bg-transparent text-[15px] font-semibold text-fg placeholder:text-muted/60 focus:outline-none"
          aria-label="Initiative title"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One-line description (optional)"
          className="mt-1.5 w-full bg-transparent text-[12.5px] text-muted placeholder:text-muted/60 focus:outline-none"
          aria-label="Initiative description"
        />
        {title.trim() && (
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink hover:brightness-110"
            >
              Add initiative
            </button>
          </div>
        )}
      </form>

      {/* Candidates list */}
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-4 text-center text-[12.5px] text-muted">
          No candidates yet. Add the first initiative above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {candidates.map((i) => (
            <InitiativeCard
              key={i.id}
              initiative={i}
              onPatch={(p) => onPatch(i.id, p)}
              onDelete={() => onDelete(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function InitiativeCard({
  initiative,
  onPatch,
  onDelete,
}: {
  initiative: PilotInitiative;
  onPatch: (patch: Partial<PilotInitiative>) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-xl border border-line bg-card/60 p-4 transition hover:border-line/80">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            defaultValue={initiative.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== initiative.title) onPatch({ title: v });
            }}
            placeholder="Untitled initiative"
            className="w-full bg-transparent text-[14.5px] font-semibold text-fg placeholder:text-muted/60 focus:outline-none"
          />
          <input
            type="text"
            defaultValue={initiative.description}
            onBlur={(e) => {
              const v = e.target.value;
              if (v !== initiative.description) onPatch({ description: v });
            }}
            placeholder="No description"
            className="mt-1 w-full bg-transparent text-[12px] text-muted placeholder:text-muted/40 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-line/40 hover:text-fg"
          aria-label="Delete initiative"
          title="Delete"
        >
          <CrossIcon />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {initiative.authorRole && (
          <span className="text-[10px] uppercase tracking-wider text-muted">
            by {initiative.authorRole}
          </span>
        )}
        <button
          type="button"
          onClick={() => onPatch({ selected: !initiative.selected })}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent hover:text-ink"
        >
          <PlusIcon />
          Add to pilot
        </button>
      </div>
    </article>
  );
}

function Chip({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium " +
        (accent
          ? "border-accent/40 bg-accent/10 text-fg"
          : "border-line bg-card/40 text-muted")
      }
    >
      {children}
    </span>
  );
}

/* ========================================================================= */
/* Matrix — selected initiatives × stages                                    */
/* ========================================================================= */

function EmptyMatrix() {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/30 p-8 text-center text-[13px] text-muted">
      Once you mark an initiative as <span className="text-fg">Added to pilot</span>{" "}
      above, it&apos;ll appear here as a row with the six stages.
    </div>
  );
}

function InitiativeRow({
  initiative,
  gaps,
  onPatchInitiative,
  onAddGap,
  onPatchGap,
  onDeleteGap,
}: {
  initiative: PilotInitiative;
  gaps: PilotGap[];
  onPatchInitiative: (patch: Partial<PilotInitiative>) => void;
  onAddGap: (stageKey: StageKey) => void;
  onPatchGap: (id: string, patch: Partial<PilotGap>) => void;
  onDeleteGap: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-accent/30 bg-card/40 shadow-card">
      {/* Initiative header */}
      <header className="flex items-start justify-between gap-3 border-b border-line/60 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Selected initiative
          </div>
          <input
            type="text"
            defaultValue={initiative.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== initiative.title) onPatchInitiative({ title: v });
            }}
            placeholder="Untitled initiative"
            className="block w-full bg-transparent text-[16px] font-semibold leading-tight text-fg placeholder:text-muted/50 focus:outline-none"
            aria-label="Initiative title"
          />
          <input
            type="text"
            defaultValue={initiative.description}
            onBlur={(e) => {
              const v = e.target.value;
              if (v !== initiative.description) onPatchInitiative({ description: v });
            }}
            placeholder="Add a one-line description…"
            className="mt-0.5 block w-full bg-transparent text-[12px] text-muted placeholder:text-muted/40 focus:outline-none"
            aria-label="Initiative description"
          />
        </div>
        <button
          type="button"
          onClick={() => onPatchInitiative({ selected: false })}
          className="shrink-0 rounded-full border border-line bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted transition hover:border-accent/40 hover:text-accent"
        >
          Move back to candidates
        </button>
      </header>

      {/* Stage cells */}
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
        {PILOT_STAGES.map((stage) => (
          <StageCell
            key={stage.key}
            stage={stage}
            gaps={gaps.filter((g) => g.stageKey === stage.key)}
            onAdd={() => onAddGap(stage.key)}
            onPatch={onPatchGap}
            onDelete={onDeleteGap}
          />
        ))}
      </div>
    </article>
  );
}

function StageCell({
  stage,
  gaps,
  onAdd,
  onPatch,
  onDelete,
}: {
  stage: (typeof PILOT_STAGES)[number];
  gaps: PilotGap[];
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<PilotGap>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-line bg-bg/40 p-3"
      style={{ boxShadow: `inset 3px 0 0 0 ${stage.hex}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: stage.hex }}
        />
        <h4
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: stage.hex }}
        >
          {stage.label}
        </h4>
      </div>

      <div className="flex flex-col gap-2">
        {gaps.map((g) => (
          <GapCard
            key={g.id}
            gap={g}
            onPatch={(patch) => onPatch(g.id, patch)}
            onDelete={() => onDelete(g.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-card/20 px-2 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-accent"
      >
        <PlusIcon />
        Add gap
      </button>
    </div>
  );
}

function GapCard({
  gap,
  onPatch,
  onDelete,
}: {
  gap: PilotGap;
  onPatch: (patch: Partial<PilotGap>) => void;
  onDelete: () => void;
}) {
  const typeDef = GAP_TYPES.find((t) => t.key === gap.type)!;
  const statusDef = GAP_STATUSES.find((s) => s.key === gap.status)!;

  return (
    <div className="rounded-lg border border-line bg-card/70 p-2.5">
      <div className="flex items-start gap-1.5">
        <input
          type="text"
          defaultValue={gap.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== gap.title) onPatch({ title: v });
          }}
          placeholder="What's missing…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg placeholder:text-muted/50 focus:outline-none"
          aria-label="Gap title"
        />
        <button
          type="button"
          onClick={onDelete}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition hover:bg-line/40 hover:text-fg"
          aria-label="Delete gap"
        >
          <CrossIcon size={9} />
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {/* Type cycle */}
        <CyclePill
          label={typeDef.label}
          hex={typeDef.hex}
          onClick={() => {
            const idx = GAP_TYPES.findIndex((t) => t.key === gap.type);
            const next = GAP_TYPES[(idx + 1) % GAP_TYPES.length];
            onPatch({ type: next.key });
          }}
        />
        {/* Owner select */}
        <OwnerSelect
          value={gap.owner}
          onChange={(v) => onPatch({ owner: v })}
        />
        {/* Status cycle */}
        <CyclePill
          label={statusDef.label}
          hex={statusDef.hex}
          onClick={() => {
            const idx = GAP_STATUSES.findIndex((s) => s.key === gap.status);
            const next = GAP_STATUSES[(idx + 1) % GAP_STATUSES.length];
            onPatch({ status: next.key });
          }}
        />
      </div>

      {/* Type=other → explain field */}
      {gap.type === "other" && (
        <input
          type="text"
          defaultValue={gap.typeOther}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== gap.typeOther) onPatch({ typeOther: v });
          }}
          placeholder='Explain "other" — e.g. Data, Integration, Compliance…'
          className="mt-1.5 w-full rounded-md border border-line bg-bg/50 px-2 py-1 text-[11px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
          aria-label='Explanation for "other" type'
        />
      )}
    </div>
  );
}

function CyclePill({
  label,
  hex,
  onClick,
}: {
  label: string;
  hex: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold transition"
      style={{
        borderColor: `${hex}55`,
        background: `${hex}1a`,
        color: hex,
      }}
    >
      {label}
    </button>
  );
}

function OwnerSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const has = !!value;
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={
        "whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold transition focus:outline-none " +
        (has
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
  );
}

/* ========================================================================= */
/* Gap backlog roll-up                                                       */
/* ========================================================================= */

function GapBacklog({
  initiatives,
  gaps,
}: {
  initiatives: PilotInitiative[];
  gaps: PilotGap[];
}) {
  const initiativeById = useMemo(
    () => new Map(initiatives.map((i) => [i.id, i])),
    [initiatives]
  );

  const allowedIds = new Set(
    initiatives.filter((i) => i.selected).map((i) => i.id)
  );
  const visible = gaps.filter((g) => allowedIds.has(g.initiativeId));

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card/30 p-8 text-center text-[13px] text-muted">
        No gaps yet. As you log what&apos;s missing in the matrix above, the rolled-up
        list of tools, workflows and infra appears here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="bg-card/60 text-left text-[10px] uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Initiative</th>
            <th className="px-3 py-2 font-medium">Stage</th>
            <th className="px-3 py-2 font-medium">What&apos;s missing</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Owner</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((g) => {
            const init = initiativeById.get(g.initiativeId);
            const stage = PILOT_STAGES.find((s) => s.key === g.stageKey);
            const typeDef = GAP_TYPES.find((t) => t.key === g.type)!;
            const statusDef = GAP_STATUSES.find((s) => s.key === g.status)!;
            return (
              <tr
                key={g.id}
                className="border-t border-line/60 align-top hover:bg-line/15"
              >
                <td className="px-3 py-2 text-fg">{init?.title ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${stage?.hex ?? "#999"}1a`,
                      color: stage?.hex ?? "#999",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: stage?.hex ?? "#999" }}
                    />
                    {stage?.label ?? g.stageKey}
                  </span>
                </td>
                <td className="px-3 py-2 text-fg">
                  {g.title || <span className="text-muted">untitled</span>}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${typeDef.hex}1a`,
                      color: typeDef.hex,
                    }}
                  >
                    {g.type === "other" && g.typeOther
                      ? `Other · ${g.typeOther}`
                      : typeDef.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-fg">
                  {g.owner ? `@${g.owner}` : <span className="text-muted">—</span>}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${statusDef.hex}1a`,
                      color: statusDef.hex,
                    }}
                  >
                    {statusDef.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ========================================================================= */
/* Tiny icons                                                                */
/* ========================================================================= */

function PlusIcon() {
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
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CrossIcon({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}
