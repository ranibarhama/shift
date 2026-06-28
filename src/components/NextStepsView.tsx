"use client";

import { useEffect, useState } from "react";
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
  type CustomKpi,
} from "@/lib/stoneBriefs";

type Props = {
  briefs: StoneBrief[];
};

export default function NextStepsView({ briefs }: Props) {
  const briefByKey = new Map(briefs.map((b) => [b.stoneKey, b]));
  for (const s of BIG_STONES) {
    if (!briefByKey.has(s.key)) briefByKey.set(s.key, emptyBrief(s.key));
  }
  const [kpiModalOpen, setKpiModalOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      {/* Hero */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Post-workshop · leader handoff
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            Next Steps
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            One brief per stone, five lines each, filled by the nominated leader.
            Pick the leader(s), set the KPI commitment (Primary or Secondary), and
            write the outcome + first pilot. Edits save automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setKpiModalOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent hover:text-ink"
        >
          <InfoIcon />
          KPIs overview
        </button>
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

      {kpiModalOpen && <KpiOverviewModal onClose={() => setKpiModalOpen(false)} />}
    </main>
  );
}

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
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
      customKpis: next.customKpis,
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
      .then((r) => {
        if (!r.ok) {
          console.warn("[Shift] stone brief save returned", r.status);
          return;
        }
        setSavedAt(Date.now());
      })
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

  function addCustomKpi(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    persist({
      customKpis: [...brief.customKpis, { label: trimmed, role: "primary" }],
    });
  }

  function updateCustomKpi(idx: number, patch: Partial<CustomKpi>) {
    const next = brief.customKpis.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    persist({ customKpis: next });
  }

  function deleteCustomKpi(idx: number) {
    persist({ customKpis: brief.customKpis.filter((_, i) => i !== idx) });
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

          {/* Custom KPIs — free text, per-stone */}
          <div className="mt-3 space-y-2">
            {brief.customKpis.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                  Stage-specific KPIs
                </div>
                {brief.customKpis.map((ck, idx) => (
                  <CustomKpiRow
                    key={idx}
                    ck={ck}
                    hex={stone.hex}
                    onLabelBlur={(label) => updateCustomKpi(idx, { label })}
                    onCycleRole={() =>
                      updateCustomKpi(idx, {
                        role: ck.role === "primary" ? "secondary" : "primary",
                      })
                    }
                    onDelete={() => deleteCustomKpi(idx)}
                  />
                ))}
              </div>
            )}
            <AddCustomKpiForm hex={stone.hex} onAdd={addCustomKpi} />
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
      title={kpi.measuredBy}
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

function CustomKpiRow({
  ck,
  hex,
  onLabelBlur,
  onCycleRole,
  onDelete,
}: {
  ck: CustomKpi;
  hex: string;
  onLabelBlur: (label: string) => void;
  onCycleRole: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
      style={{ borderColor: `${hex}55`, background: `${hex}10` }}
    >
      <input
        type="text"
        defaultValue={ck.label}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== ck.label) onLabelBlur(v);
        }}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] font-medium text-fg placeholder:text-muted/60 focus:outline-none"
        placeholder="KPI label…"
        aria-label="Custom KPI label"
      />
      <button
        type="button"
        onClick={onCycleRole}
        className="shrink-0"
        aria-label="Toggle Primary / Secondary"
        title="Toggle Primary / Secondary"
      >
        <RoleBadge role={ck.role} hex={hex} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition hover:bg-line/40 hover:text-fg"
        aria-label="Delete this KPI"
        title="Delete"
      >
        <svg
          width="10"
          height="10"
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
    </div>
  );
}

function AddCustomKpiForm({
  hex,
  onAdd,
}: {
  hex: string;
  onAdd: (label: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-1.5"
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center text-muted">
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
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a stage-specific KPI…"
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg placeholder:text-muted/70 focus:outline-none"
        aria-label="Add a custom KPI"
      />
      {value.trim() && (
        <button
          type="submit"
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink"
          style={{ background: hex }}
        >
          Add
        </button>
      )}
    </form>
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

/* ===== KPIs overview modal ============================================== */

function KpiOverviewModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kpi-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl border border-line bg-bg shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Measuring success
            </div>
            <h2
              id="kpi-modal-title"
              className="text-xl font-semibold text-fg"
            >
              Six KPIs — how we'll measure the AI transition
            </h2>
            <p className="mt-1 text-sm text-muted">
              Each Stone Brief commits to one or two of these as Primary, plus optional
              Secondaries.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-accent/40 hover:bg-line/30 hover:text-fg"
          >
            <CloseIcon />
          </button>
        </header>

        {/* KPI grid */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {KPIS.map((kpi) => (
            <KpiOverviewCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiOverviewCard({ kpi }: { kpi: KpiDef }) {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card/50"
      style={{ boxShadow: `inset 0 3px 0 0 ${kpi.hex}` }}
    >
      {/* Title bar */}
      <header
        className="px-4 py-3"
        style={{ background: `${kpi.hex}14` }}
      >
        <h3
          className="text-[15px] font-bold leading-tight"
          style={{ color: kpi.hex }}
        >
          {kpi.label}
        </h3>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* Measured by */}
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Measured by
          </div>
          <p className="text-[12.5px] leading-snug text-fg">{kpi.measuredBy}</p>
        </div>

        {/* Examples */}
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Examples
          </div>
          <ul className="space-y-1.5">
            {kpi.examples.map((ex) => (
              <li
                key={ex}
                className="flex items-start gap-2 text-[12px] leading-snug text-fg"
              >
                <span
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: kpi.hex }}
                  aria-hidden
                />
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
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
