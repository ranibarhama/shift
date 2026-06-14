"use client";

import Link from "next/link";
import { useState } from "react";
import { BIG_STONES, type BacklogAnalysis, type StoneAnalysis } from "@/lib/bigStones";
import {
  LEADER_NAMES,
  KPIS,
  emptyBrief,
  type StoneBrief,
  type LeaderName,
  type KpiKey,
  type KpiRole,
} from "@/lib/stoneBriefs";

type Props = {
  analysis: BacklogAnalysis;
  briefs: StoneBrief[];
};

export default function BigStonesView({ analysis, briefs }: Props) {
  const [tab, setTab] = useState<"overview" | "next-steps">("overview");

  // Map briefs by stone key, defaulting to empty so every stone has one
  const briefByKey = new Map(briefs.map((b) => [b.stoneKey, b]));
  for (const s of BIG_STONES) {
    if (!briefByKey.has(s.key)) briefByKey.set(s.key, emptyBrief(s.key));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <Hero />

      {/* Tabs */}
      <div className="mb-6 border-b border-line">
        <div className="flex gap-6">
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TabButton>
          <TabButton
            active={tab === "next-steps"}
            onClick={() => setTab("next-steps")}
          >
            Next steps
          </TabButton>
        </div>
      </div>

      {tab === "overview" && <OverviewTab analysis={analysis} />}
      {tab === "next-steps" && (
        <NextStepsTab analysis={analysis} briefByKey={briefByKey} />
      )}
    </main>
  );
}

/* ========================================================================= */
/* Hero + tab bar                                                            */
/* ========================================================================= */

function Hero() {
  return (
    <header className="mb-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
        Backlog · zoomed out
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
        Backlog Zoom Out
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Six strategic moves rolled up from every gap on the backlog. Each stone connects
        to the part of{" "}
        <Link href="/blueprint" className="text-accent hover:underline">
          How good looks like
        </Link>{" "}
        it pushes the company toward.
      </p>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative -mb-px border-b-2 px-1 pb-3 text-sm font-medium transition " +
        (active
          ? "border-accent text-fg"
          : "border-transparent text-muted hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

/* ========================================================================= */
/* Tab 1 — Overview                                                          */
/* ========================================================================= */

function OverviewTab({ analysis }: { analysis: BacklogAnalysis }) {
  const stonesWithMass = analysis.stones.filter((sa) => sa.itemCount > 0).length;
  const totalScore = analysis.stones.reduce((s, sa) => s + sa.totalScore, 0);
  const concentrations = [...analysis.stones]
    .filter((s) => s.itemCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  return (
    <>
      {/* Summary strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCell label="Items in backlog" value={analysis.totalItems} />
        <SummaryCell label="Mapped to stones" value={analysis.mappedItems} />
        <SummaryCell
          label="Stones with mass"
          value={`${stonesWithMass} / ${analysis.stones.length}`}
        />
        <SummaryCell label="Total impact captured" value={totalScore} />
      </section>

      {concentrations.length > 0 && (
        <section className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            Concentrations of pain
          </div>
          <p className="mb-3 text-sm text-fg">
            Where the backlog is loudest right now, by impact captured:
          </p>
          <ol className="space-y-1.5">
            {concentrations.map((sa, i) => (
              <li
                key={sa.stone.key}
                className="flex items-center gap-3 text-[13px] text-fg"
              >
                <span
                  className="grid h-5 min-w-[22px] place-items-center rounded-full text-[10px] font-bold"
                  style={{ background: `${sa.stone.hex}1a`, color: sa.stone.hex }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">{sa.stone.name}</span>
                <span className="text-[11px] text-muted">
                  {sa.itemCount} items · {sa.totalScore} impact
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {analysis.stones.map((sa) => (
          <StoneCard key={sa.stone.key} sa={sa} mappedItems={analysis.mappedItems} />
        ))}
      </section>

      {analysis.unmappedItems.length > 0 && (
        <section className="mt-8 rounded-2xl border border-line bg-card/40 p-5">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Needs alignment
          </div>
          <h2 className="text-base font-semibold text-fg">
            {analysis.unmappedItems.length} item
            {analysis.unmappedItems.length === 1 ? "" : "s"} didn&apos;t auto-map to a
            stone
          </h2>
          <p className="mt-1 text-sm text-muted">
            These items don&apos;t obviously belong to any of the six stones. Review them
            in the backlog and reword, or let the workshop assign them.
          </p>
          <ul className="mt-3 space-y-1">
            {analysis.unmappedItems.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 text-[12px] text-fg"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                <span>
                  {item.content}
                  <span className="ml-2 text-[10px] text-muted">
                    · {item.stage_name}
                  </span>
                </span>
              </li>
            ))}
            {analysis.unmappedItems.length > 10 && (
              <li className="text-[11px] text-muted">
                + {analysis.unmappedItems.length - 10} more
              </li>
            )}
          </ul>
          <Link
            href="/backlog"
            className="mt-3 inline-block text-xs text-accent hover:underline"
          >
            Open in backlog →
          </Link>
        </section>
      )}
    </>
  );
}

function SummaryCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-card/40 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-fg">{value}</div>
    </div>
  );
}

function StoneCard({
  sa,
  mappedItems,
}: {
  sa: StoneAnalysis;
  mappedItems: number;
}) {
  const ratedPct =
    sa.itemCount > 0 ? Math.round((sa.ratedCount / sa.itemCount) * 100) : 0;
  const sharePct =
    mappedItems > 0 ? Math.round((sa.itemCount / mappedItems) * 100) : 0;
  const empty = sa.itemCount === 0;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card/60 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
      style={{ boxShadow: `inset 3px 0 0 0 ${sa.stone.hex}` }}
    >
      <header className="px-5 pb-3 pt-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold"
            style={{ background: `${sa.stone.hex}1a`, color: sa.stone.hex }}
          >
            {sa.stone.num}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: sa.stone.hex }}
            >
              Stone {String(sa.stone.num).padStart(2, "0")}
            </div>
            <h3 className="text-[16px] font-semibold leading-tight text-fg">
              {sa.stone.name}
            </h3>
          </div>
        </div>
        <p className="mt-2 text-[12.5px] leading-snug text-muted">
          {sa.stone.description}
        </p>
      </header>

      <div className="px-5 pb-4">
        <Link
          href="/blueprint"
          className="inline-flex items-center gap-1.5 rounded-full border bg-bg/40 px-2.5 py-1 text-[11px] transition hover:bg-bg"
          style={{ borderColor: `${sa.stone.hex}55` }}
        >
          <span className="text-muted">Connects to:</span>
          <span className="font-semibold" style={{ color: sa.stone.hex }}>
            {sa.stone.connectsTo}
          </span>
          <span style={{ color: sa.stone.hex }}>→</span>
        </Link>
      </div>

      <div className="mx-5 border-t border-line/50" />

      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <MetricCell
          label="Items"
          value={sa.itemCount}
          sublabel={empty ? "no mass yet" : `${sharePct}% of mapped`}
          hex={sa.stone.hex}
        />
        <MetricCell
          label="Impact captured"
          value={sa.totalScore}
          sublabel="sum of action scores"
          hex={sa.stone.hex}
        />
        <MetricCell
          label="Quick wins"
          value={sa.quickWinCount}
          sublabel="High impact · S effort"
          hex={sa.stone.hex}
        />
        <MetricCell
          label="Rated coverage"
          value={empty ? "—" : `${ratedPct}%`}
          sublabel="all three rated"
          hex={sa.stone.hex}
        />
      </div>

      {sa.topItems.length > 0 && (
        <>
          <div className="mx-5 border-t border-line/50" />
          <div className="px-5 py-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Top items in this stone
            </div>
            <ul className="space-y-2.5">
              {sa.topItems.map(({ item, score }) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 grid h-5 min-w-[36px] place-items-center whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold tabular-nums"
                    style={{ background: `${sa.stone.hex}1a`, color: sa.stone.hex }}
                  >
                    {score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] leading-snug text-fg">
                      {item.content}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">
                      {item.stage_name} · {item.process_name}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {empty && (
        <div className="mx-5 mb-5 rounded-xl border border-dashed border-line p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Blind spot
          </div>
          <div className="mt-0.5 text-[12px] text-fg">
            Nothing in the backlog maps to this stone yet — likely the most important
            thing to put on it.
          </div>
        </div>
      )}
    </article>
  );
}

function MetricCell({
  label,
  value,
  sublabel,
  hex,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  hex: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div
        className="text-[20px] font-semibold leading-tight tabular-nums"
        style={{ color: hex }}
      >
        {value}
      </div>
      <div className="text-[10px] leading-tight text-muted">{sublabel}</div>
    </div>
  );
}

/* ========================================================================= */
/* Tab 2 — Next steps                                                        */
/* ========================================================================= */

function NextStepsTab({
  analysis,
  briefByKey,
}: {
  analysis: BacklogAnalysis;
  briefByKey: Map<string, StoneBrief>;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          Leader handoff
        </div>
        <h2 className="text-base font-semibold text-fg">
          One brief per stone. Five lines, filled by the nominated leader.
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Pick the leader(s) for each stone, set the KPI commitment (Primary or
          Secondary), and write the outcome + first pilot. Edits save automatically.
        </p>
      </div>

      {analysis.stones.map((sa) => (
        <StoneBriefRow
          key={sa.stone.key}
          sa={sa}
          initialBrief={briefByKey.get(sa.stone.key)!}
        />
      ))}
    </section>
  );
}

function StoneBriefRow({
  sa,
  initialBrief,
}: {
  sa: StoneAnalysis;
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
    void fetch(`/api/stone-briefs/${sa.stone.key}`, {
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
      current === undefined ? "primary" : current === "primary" ? "secondary" : undefined;
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
      style={{ boxShadow: `inset 3px 0 0 0 ${sa.stone.hex}` }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold"
            style={{ background: `${sa.stone.hex}1a`, color: sa.stone.hex }}
          >
            {sa.stone.num}
          </span>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: sa.stone.hex }}
            >
              Stone {String(sa.stone.num).padStart(2, "0")}
            </div>
            <h3 className="text-[16px] font-semibold leading-tight text-fg">
              {sa.stone.name}
            </h3>
          </div>
        </div>
        <SaveIndicator savingAt={savingAt} savedAt={savedAt} />
      </header>

      <div className="space-y-5 px-5 pb-5 pt-4">
        {/* Leader(s) */}
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
                          borderColor: sa.stone.hex,
                          background: `${sa.stone.hex}22`,
                          color: sa.stone.hex,
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

        {/* KPI mapping */}
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
                hex={sa.stone.hex}
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

          <Field label="First pilot" help="Smallest concrete thing to ship in 2 weeks.">
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
  kpi: { key: KpiKey; label: string; description: string };
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
          ? {
              borderColor: hex,
              background: `${hex}22`,
            }
          : isSecondary
          ? {
              borderColor: `${hex}77`,
              background: "transparent",
            }
          : {
              borderColor: "rgb(var(--line))",
              background: "transparent",
            }
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

function RoleBadge({ role, hex }: { role: KpiRole | undefined; hex: string }) {
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
      <span className="text-[10px] uppercase tracking-wider text-muted">
        Saving…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-[10px] uppercase tracking-wider text-muted">Saved</span>
    );
  }
  return null;
}
