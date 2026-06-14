"use client";

import { useState } from "react";
import { BIG_STONES } from "@/lib/bigStones";
import {
  LEADER_NAMES,
  KPIS,
  emptyBrief,
  type StoneBrief,
  type LeaderName,
  type KpiKey,
  type KpiRole,
  type KpiDef,
} from "@/lib/stoneBriefs";

type Props = {
  briefs: StoneBrief[];
};

export default function NextStepsView({ briefs }: Props) {
  const briefByKey = new Map(briefs.map((b) => [b.stoneKey, b]));
  for (const s of BIG_STONES) {
    if (!briefByKey.has(s.key)) briefByKey.set(s.key, emptyBrief(s.key));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Hero */}
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
          Post-workshop · leader handoff
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
          Next Steps
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          One brief per stone, five lines each, filled by the nominated leader.
          Pick the leader(s), set the KPI commitment (Primary or Secondary), and write
          the outcome + first pilot. Edits save automatically.
        </p>
      </header>

      <section className="space-y-5">
        {BIG_STONES.map((stone) => (
          <StoneBriefCard
            key={stone.key}
            stone={stone}
            initialBrief={briefByKey.get(stone.key)!}
          />
        ))}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------------- */

function StoneBriefCard({
  stone,
  initialBrief,
}: {
  stone: (typeof BIG_STONES)[number];
  initialBrief: StoneBrief;
}) {
  const [brief, setBrief] = useState<StoneBrief>(initialBrief);
  const [savingAt, setSavingAt] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(
    initialBrief.updatedAt || null
  );

  function persist(patch: Partial<StoneBrief>) {
    const next = { ...brief, ...patch };
    setBrief(next);
    setSavingAt(Date.now());
    const body = {
      leaders: next.leaders,
      kpis: next.kpis,
      outcome: next.outcome,
      pilot: next.pilot,
      people: next.people,
      reviewDate: next.reviewDate,
    };
    void fetch(`/api/stone-briefs/${stone.key}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => setSavedAt(Date.now()))
      .catch((err) => console.warn("[Shift] stone brief save failed", err));
  }

  function toggleLeader(name: LeaderName) {
    const set = new Set<LeaderName>(brief.leaders);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    persist({ leaders: Array.from(set) });
  }

  function cycleKpi(key: KpiKey) {
    const current = brief.kpis[key];
    const next: KpiRole | undefined =
      current === undefined
        ? "primary"
        : current === "primary"
        ? "secondary"
        : undefined;
    const kpis = { ...brief.kpis };
    if (next === undefined) delete kpis[key];
    else kpis[key] = next;
    persist({ kpis });
  }

  function onTextBlur(field: "outcome" | "pilot" | "people", value: string) {
    if (value === brief[field]) return;
    persist({ [field]: value });
  }

  function onDateChange(value: string) {
    persist({ reviewDate: value });
  }

  return (
    <article
      className="rounded-2xl border border-line bg-card/60 shadow-card"
      style={{ boxShadow: `inset 3px 0 0 0 ${stone.hex}` }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold"
            style={{ background: `${stone.hex}1a`, color: stone.hex }}
          >
            {stone.num}
          </span>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: stone.hex }}
            >
              Stone {String(stone.num).padStart(2, "0")}
            </div>
            <h3 className="text-[16px] font-semibold leading-tight text-fg">
              {stone.name}
            </h3>
          </div>
        </div>
        <SaveIndicator savingAt={savingAt} savedAt={savedAt} />
      </header>

      <div className="space-y-5 px-5 pb-5 pt-4">
        <Field
          label="Leader(s)"
          help="Select one or more — multi-ownership is fine."
        >
          <div className="flex flex-wrap gap-1.5">
            {LEADER_NAMES.map((name) => {
              const active = brief.leaders.includes(name);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => toggleLeader(name)}
                  className="rounded-full border px-3 py-1 text-[12px] font-medium transition"
                  style={
                    active
                      ? {
                          borderColor: stone.hex,
                          background: `${stone.hex}22`,
                          color: stone.hex,
                        }
                      : {
                          borderColor: "rgb(var(--line))",
                          color: "rgb(var(--muted))",
                        }
                  }
                  aria-pressed={active}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="KPI commitment"
          help="Click each KPI to cycle: Off → Primary → Secondary → Off."
        >
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {KPIS.map((kpi) => (
              <KpiChip
                key={kpi.key}
                kpi={kpi}
                role={brief.kpis[kpi.key]}
                hex={stone.hex}
                onClick={() => cycleKpi(kpi.key)}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Outcome" help="What “good” looks like in 90 days, one line.">
            <textarea
              defaultValue={brief.outcome}
              onBlur={(e) => onTextBlur("outcome", e.target.value)}
              placeholder="By <date>, this stage will have <observable outcome>."
              rows={2}
              className="w-full resize-none rounded-lg border border-line bg-bg/60 px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </Field>

          <Field
            label="First pilot"
            help="Smallest concrete thing to ship in 2 weeks."
          >
            <textarea
              defaultValue={brief.pilot}
              onBlur={(e) => onTextBlur("pilot", e.target.value)}
              placeholder="The 2-week experiment we'll run to test the approach…"
              rows={2}
              className="w-full resize-none rounded-lg border border-line bg-bg/60 px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </Field>

          <Field label="People pulled in" help="1–3 names from other teams.">
            <input
              type="text"
              defaultValue={brief.people}
              onBlur={(e) => onTextBlur("people", e.target.value)}
              placeholder="Names, comma-separated"
              className="w-full rounded-lg border border-line bg-bg/60 px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </Field>

          <Field label="Review date" help="When leadership checks back.">
            <input
              type="date"
              value={brief.reviewDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-lg border border-line bg-bg/60 px-3 py-2 text-[13px] text-fg focus:border-accent focus:outline-none"
            />
          </Field>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-fg">
          {label}
        </span>
        {help && <span className="text-[10px] text-muted">· {help}</span>}
      </div>
      {children}
    </div>
  );
}

function KpiChip({
  kpi,
  role,
  hex,
  onClick,
}: {
  kpi: KpiDef;
  role: KpiRole | undefined;
  hex: string;
  onClick: () => void;
}) {
  const isPrimary = role === "primary";
  const isSecondary = role === "secondary";
  return (
    <button
      type="button"
      onClick={onClick}
      title={kpi.description}
      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition"
      style={
        isPrimary
          ? { borderColor: hex, background: `${hex}22` }
          : isSecondary
          ? { borderColor: `${hex}77`, background: "transparent" }
          : { borderColor: "rgb(var(--line))", background: "transparent" }
      }
    >
      <span
        className="text-[12.5px] font-semibold"
        style={{ color: isPrimary || isSecondary ? hex : "rgb(var(--fg))" }}
      >
        {kpi.label}
      </span>
      <RoleBadge role={role} hex={hex} />
    </button>
  );
}

function RoleBadge({
  role,
  hex,
}: {
  role: KpiRole | undefined;
  hex: string;
}) {
  if (role === "primary") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
        style={{ background: hex, color: "white" }}
      >
        Primary
      </span>
    );
  }
  if (role === "secondary") {
    return (
      <span
        className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
        style={{ borderColor: hex, color: hex }}
      >
        Secondary
      </span>
    );
  }
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
      Off
    </span>
  );
}

function SaveIndicator({
  savingAt,
  savedAt,
}: {
  savingAt: number | null;
  savedAt: number | null;
}) {
  const saving = savingAt !== null && (savedAt === null || savedAt < savingAt);
  if (saving) {
    return (
      <span className="text-[10px] uppercase tracking-wider text-muted">Saving…</span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-[10px] uppercase tracking-wider text-muted">Saved</span>
    );
  }
  return null;
}
