"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  BUILD_OPERATING_MODEL,
  BUILD_STREAMS,
  FUTURE_STAGES,
  GTM_ITEMS,
  INSIGHTS_REPLACES,
  LAYERS,
  LEARNING_LOOP_HEX,
  LEARNING_LOOP_ITEMS,
  LEARNING_LOOP_SUMMARY,
  ORG_BRAIN,
  TRANSFORM_STAGES,
  TRANSITIONS,
  type FutureStage,
  type Layer,
} from "@/lib/blueprintData";
import { BUILDING_BLOCKS, isFoundation, type BlockInput } from "@/lib/buildingBlocks";
import { BotIcon, BrainIcon } from "./DecisionIcons";
import { BlocksProvider, BuildingBlocksSlide } from "./BuildingBlocks";

/* -----------------------------------------------------------------------------
 * "How good looks like — HL": the Transformation structure and Details tabs
 * of the Blueprint page, retold as graphic sections on one page (no slides —
 * user request, 2026-10-26). Full screen is the site-wide present mode in the
 * header (PresentMode), which walks the stages here with ← →.
 * -------------------------------------------------------------------------- */

type Slide = {
  key: string;
  kicker: string;
  title: string;
  hero?: boolean;
  body: React.ReactNode;
};

/** Shown first, in this order (user request, 2026-10-25): the overview, then the stages. */
const LEAD_SLIDES = ["title", "blocks"];

/**
 * Hidden for now (user request, 2026-10-25). "Bring back the hidden slides"
 * = empty this set. Hidden: 02 Transformation structure · 03 The target, stage
 * by stage · 04 Seven shifts · 05 Eight layers at a glance · 06–12 Layers 1–7 ·
 * 13 Organizational memory & learning loop.
 */
const HIDDEN_SLIDES = new Set<string>([
  "transform",
  "target",
  "shifts",
  "layers",
  ...LAYERS.map((l) => `layer-${l.num}`),
  "foundation",
]);

const MUTED_HEX = "#94a3b8";
const PALETTE = ["#22d3ee", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#7c5cff"];

function layer(num: string): Layer {
  return LAYERS.find((l) => l.num === num)!;
}

function buildSlides(): Slide[] {
  // Display order = LEAD_SLIDES, then the rest in their original order.
  const all = allSlides();
  const lead = LEAD_SLIDES.map((k) => all.find((s) => s.key === k)).filter(
    (s): s is Slide => !!s
  );
  const rest = all.filter((s) => !LEAD_SLIDES.includes(s.key));
  return [...lead, ...rest].filter((s) => !HIDDEN_SLIDES.has(s.key));
}

function allSlides(): Slide[] {
  return [
    {
      key: "blocks",
      kicker: "Start here · The stages",
      title: "Where we are today, stage by stage",
      body: <BuildingBlocksSlide />,
    },
    { key: "title", kicker: "Phase 2 · Step 1", title: "How good looks like — HL", hero: true, body: <TitleSlide /> },
    {
      key: "transform",
      kicker: "Transformation structure",
      title: "From today's relay race to how good looks like",
      body: <TransformSlide />,
    },
    {
      key: "target",
      kicker: "Transformation structure",
      title: "The target, stage by stage",
      body: <TargetSlide />,
    },
    { key: "shifts", kicker: "Details", title: "Seven shifts behind the model", body: <ShiftsSlide /> },
    { key: "layers", kicker: "Details", title: "Eight layers at a glance", body: <LayersOverviewSlide /> },
    ...LAYERS.map((l) => ({
      key: `layer-${l.num}`,
      kicker: `Details · Layer ${l.num}`,
      title: l.title,
      body: <LayerSlide layer={l} />,
    })),
    {
      key: "foundation",
      kicker: "Details · Layer 8 · Foundation",
      title: "Organizational memory & learning loop",
      body: <FoundationSlide />,
    },
  ];
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ============================== Page ============================== */

export default function HowGoodHL({ initialBlockInputs }: { initialBlockInputs: BlockInput[] }) {
  const sections = useMemo(buildSlides, []);
  return (
    <BlocksProvider initial={initialBlockInputs}>
      <div className="space-y-6">
        {sections.map((s) => (
          <section
            key={s.key}
            id={s.key}
            className="scroll-mt-20 rounded-3xl border border-line bg-card/40 p-5 sm:p-8"
          >
            {!s.hero && (
              <div className="mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {s.kicker}
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
                  {s.title}
                </h2>
              </div>
            )}
            {s.body}
          </section>
        ))}
      </div>
    </BlocksProvider>
  );
}

/* ============================== Slides ============================== */

function TitleSlide() {
  // The same stages as the building-block cards below. OPS and the Organization
  // brain span the whole process, so they're bands under the stages, not stages.
  const stages = BUILDING_BLOCKS.filter((b) => !isFoundation(b.key));
  const spanning = BUILDING_BLOCKS.filter((b) => isFoundation(b.key));
  const rowRef = useRef<HTMLDivElement>(null);
  const [ends, setEnds] = useState<[number, number]>([7, 93]);

  // Anchor the learning loop on the real first and last stage (re-measured on resize).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      const chips = row.querySelectorAll<HTMLElement>("[data-stage]");
      const box = row.getBoundingClientRect();
      if (chips.length < 2 || !box.width) return;
      const centre = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return Math.round(((r.left + r.width / 2 - box.left) / box.width) * 1000) / 10;
      };
      setEnds([centre(chips[0]), centre(chips[chips.length - 1])]);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="py-6 text-center sm:py-12">
      <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-automate/40 bg-automate/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-automate">
        Phase 2 · Step 1
      </div>
      <h2 className="text-4xl font-bold tracking-tight text-fg sm:text-6xl">How good looks like</h2>
      <div className="mt-2 text-lg font-semibold text-accent sm:text-2xl">HL working model components</div>
      <p className="mx-auto mt-4 max-w-2xl text-sm text-muted sm:text-base">
        Where B2C is heading — the transformation structure from today to target, and the
        details behind it.
      </p>

      {/* One line, never wrapped — the loop must run from the last stage back to the
          first. Too narrow? It scrolls sideways inside the slide instead. */}
      <div className="mt-10 overflow-x-auto pb-1">
        {/* Sized by the stage row, so the loop and the bands span exactly across it. */}
        <div className="mx-auto flex w-max flex-col">
          <LearningLoop start={ends[0]} end={ends[1]} />
          <div ref={rowRef} className="flex items-center">
            {stages.map((b, i) => (
              <Fragment key={b.key}>
                <span
                  data-stage
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[12px] font-semibold text-fg"
                  style={{ borderColor: `${b.hex}66`, background: `${b.hex}12` }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.hex }} aria-hidden />
                  {b.label}
                </span>
                {i < stages.length - 1 && <SideArrow small />}
              </Fragment>
            ))}
          </div>
          {/* OPS and the Organization brain — full-width bands under the stages */}
          <div className="mt-3 space-y-2">
            {spanning.map((b) => (
              <SpanBand key={b.key} hex={b.hex} label={b.label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A block that spans every stage, drawn as a full-width band under the flow. */
function SpanBand({ hex, label }: { hex: string; label: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-2xl border px-4 py-2.5"
      style={{
        borderColor: `${hex}55`,
        background: `linear-gradient(90deg, ${hex}0d, ${hex}1f, ${hex}0d)`,
      }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hex }} aria-hidden />
      <span className="text-[13px] font-semibold text-fg">{label}</span>
    </div>
  );
}

/** Continuous learning isn't a stage — it's the loop from the last stage back to the first.
 *  `start` / `end` are the first and last stage centres, in % of the row's width. */
function LearningLoop({ start, end }: { start: number; end: number }) {
  return (
    <div
      className="relative mb-1 h-14"
      role="img"
      aria-label="Continuous learning: what we learn at the last stage feeds back into the first"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 56"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={`M${end} 52 C${end} 8, ${start} 8, ${start} 48`}
          fill="none"
          style={{ stroke: "rgb(var(--muted))" }}
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Arrowhead pointing down into the first stage */}
      <svg
        className="absolute bottom-0 -translate-x-1/2"
        style={{ left: `${start}%` }}
        width="12"
        height="9"
        viewBox="0 0 12 9"
        aria-hidden
      >
        <path d="M0 0 L12 0 L6 9 Z" style={{ fill: "rgb(var(--muted))" }} />
      </svg>
      <span className="absolute left-1/2 top-0 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card px-3 py-1 text-[12px] font-semibold text-fg shadow-sm">
        <LoopIcon /> Continuous learning
        <span className="font-normal text-muted">— every cycle feeds the next</span>
      </span>
    </div>
  );
}

function TransformSlide() {
  return (
    <div>
      <RowLabel>Today · a relay race between teams</RowLabel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {TRANSFORM_STAGES.map((s, i) => (
          <div key={s.key} className="rounded-2xl border border-line bg-bg/60 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              Today · {i + 1}
            </div>
            <div className="mt-1 text-[15px] font-semibold text-fg">{s.currentName}</div>
            <p className="mt-1 text-[12px] leading-snug text-muted">{s.currentSummary}</p>
          </div>
        ))}
      </div>

      {/* Which of today's stages each target stage takes over */}
      <div className="hidden md:grid md:grid-cols-4" aria-hidden>
        <div className="flex justify-center">
          <DownArrow hex={FUTURE_STAGES[0].hex} />
        </div>
        <div className="flex justify-center">
          <DownArrow hex={FUTURE_STAGES[1].hex} />
        </div>
        <div className="col-span-2">
          <MergeArrow hex={FUTURE_STAGES[2].hex} />
        </div>
      </div>
      <div className="flex justify-center py-2 md:hidden" aria-hidden>
        <DownArrow hex={MUTED_HEX} />
      </div>

      <RowLabel>How good looks like</RowLabel>
      <div className="space-y-3 rounded-3xl border border-line bg-bg/40 p-3 sm:p-4">
        <BrainBand />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {FUTURE_STAGES.map((f) => (
            <div
              key={f.key}
              className={"rounded-2xl border p-4 " + (f.from.length > 1 ? "md:col-span-2" : "")}
              style={{ borderColor: `${f.hex}55`, background: `${f.hex}12` }}
            >
              <div className="flex items-center gap-2">
                <NumBadge n={f.num} hex={f.hex} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                  style={{ color: f.hex }}
                >
                  Stage {pad(f.num)}
                </span>
              </div>
              <div className="mt-2 text-[15px] font-semibold text-fg">{f.title}</div>
              <div className="mt-1 text-[12px] text-muted">{f.essence}</div>
            </div>
          ))}
        </div>
        <OpsBand />
      </div>
    </div>
  );
}

function TargetSlide() {
  const [insights, build, gtm] = FUTURE_STAGES;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <StageDetail stage={insights} chevron>
          <div>
            <div className="text-[13px] font-semibold text-fg">Single source of signal</div>
            <div className="text-[11px] italic text-muted">Always on</div>
          </div>
          <MiniLabel>Replaces</MiniLabel>
          <Chips items={INSIGHTS_REPLACES} hex={insights.hex} />
        </StageDetail>

        <StageDetail stage={build} chevron>
          <MiniLabel>Two streams of work</MiniLabel>
          {BUILD_STREAMS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-bg/40 p-2.5"
              style={{ borderColor: `${s.hex}40` }}
            >
              <div className="mb-1.5 flex flex-wrap items-baseline gap-1.5">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: s.hex }}
                >
                  {s.label}
                </span>
                <span className="text-[10px] text-muted">· {s.sublabel}</span>
                {s.badge && (
                  <span
                    className="ml-auto rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-wider"
                    style={{ background: `${s.hex}1f`, color: s.hex }}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <CheckList items={s.items} hex={s.hex} small />
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-automate/40 bg-automate/10 px-3 py-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-automate">
              Operating model
            </span>
            <span className="text-[12px] font-semibold text-fg">{BUILD_OPERATING_MODEL}</span>
          </div>
        </StageDetail>

        <StageDetail stage={gtm}>
          <CheckList items={GTM_ITEMS} hex={gtm.hex} />
        </StageDetail>
      </div>

      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          borderColor: `${ORG_BRAIN.hex}55`,
          backgroundImage: `radial-gradient(circle at 100% 0%, ${ORG_BRAIN.hex}22, transparent 60%)`,
        }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: ORG_BRAIN.hex }}
          >
            Sits above everything
          </span>
          <span className="text-base font-semibold text-fg">{ORG_BRAIN.title}</span>
        </div>
        <p className="mt-1.5 max-w-3xl text-[12.5px] leading-snug text-muted">
          {ORG_BRAIN.description}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ORG_BRAIN.benefits.map((b) => (
            <div
              key={b}
              className="flex items-center gap-2 rounded-xl border border-line bg-bg/50 px-3 py-2 text-[12.5px] text-fg"
            >
              <Check hex={ORG_BRAIN.hex} />
              {b}
            </div>
          ))}
        </div>
      </div>

      <OpsBand />
    </div>
  );
}

type Shift = { from: string; to: string } | { principle: string };

function ShiftsSlide() {
  const shifts: Shift[] = TRANSITIONS.map((t) => {
    const m = /^From (.+?) to (.+)$/i.exec(t);
    return m ? { from: m[1], to: m[2] } : { principle: t };
  });
  const principles = shifts.filter((s): s is { principle: string } => "principle" in s);
  const pairs = shifts.filter((s): s is { from: string; to: string } => "from" in s);

  return (
    <div className="space-y-5">
      {principles.map((p) => {
        const [left, right] = p.principle.split(/\s*;\s*/);
        return (
          <div
            key={p.principle}
            className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line sm:grid-cols-2"
          >
            <div className="flex items-center gap-3 bg-automate/10 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-automate/20 text-automate">
                <BotIcon size={18} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-semibold text-fg">{left}</span>
            </div>
            <div className="flex items-center gap-3 bg-own/10 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-own/20 text-own">
                <BrainIcon size={18} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-semibold text-fg">{right ?? ""}</span>
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {pairs.map((p, i) => {
          const hex = PALETTE[(i + 1) % PALETTE.length];
          return (
            <div
              key={p.from}
              className="flex items-center gap-3 rounded-2xl border border-line bg-bg/50 px-4 py-3"
            >
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold"
                style={{ background: `${hex}1f`, color: hex }}
              >
                {pad(i + 2)}
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-muted line-through decoration-muted/40">
                {p.from}
              </span>
              <SideArrow hex={hex} />
              <span className="min-w-0 flex-1 text-[14px] font-semibold text-fg">{p.to}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LayersOverviewSlide() {
  const chain = ["1", "2", "3", "4", "6"].map(layer);
  return (
    <div className="space-y-3">
      <LayerBand layer={layer("5")} note="People · who does the work" />
      <div className="flex flex-col items-stretch lg:flex-row">
        {chain.map((l, i) => (
          <Fragment key={l.num}>
            <div
              className="flex min-w-0 flex-1 flex-col rounded-2xl border bg-bg/50 p-3"
              style={{ borderColor: `${l.hex}55`, boxShadow: `inset 0 3px 0 0 ${l.hex}` }}
            >
              <div className="flex items-center gap-2">
                <NumBadge n={Number(l.num)} hex={l.hex} />
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted">
                  Layer {l.num}
                </span>
              </div>
              <div className="mt-2 text-[13.5px] font-semibold leading-tight text-fg">{l.title}</div>
              {l.centerpiece && (
                <span
                  className="mt-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                  style={{ background: `${l.hex}1f`, color: l.hex }}
                >
                  {l.centerpiece.label}
                </span>
              )}
              <div className="mt-auto pt-2 text-[11px] text-muted">
                {l.stages.length} capabilities
              </div>
            </div>
            {i < chain.length - 1 && <FlowArrow />}
          </Fragment>
        ))}
      </div>
      <LayerBand layer={layer("7")} note="Cross-cutting · governs every layer" dashed />
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
        style={{
          borderColor: `${LEARNING_LOOP_HEX}55`,
          background: `linear-gradient(90deg, ${LEARNING_LOOP_HEX}1f, ${LEARNING_LOOP_HEX}05)`,
        }}
      >
        <NumBadge n={8} hex={LEARNING_LOOP_HEX} />
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: LEARNING_LOOP_HEX }}
        >
          Foundation
        </span>
        <span className="text-sm font-semibold text-fg">Organizational memory & learning loop</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <LoopIcon /> feeds every next plan
        </span>
      </div>
    </div>
  );
}

function LayerSlide({ layer: l }: { layer: Layer }) {
  return (
    <div>
      <p className="mb-2 max-w-3xl text-sm text-muted">{l.summary}</p>
      <Radial
        hub={l.centerpiece?.label ?? l.title}
        hubSub={l.centerpiece?.sublabel}
        items={l.stages}
        hex={l.hex}
      />
      {l.extras?.map((ex) => (
        <Extra key={ex.label} label={ex.label} items={ex.items} hex={l.hex} />
      ))}
    </div>
  );
}

function FoundationSlide() {
  return (
    <div>
      <p className="mb-2 max-w-3xl text-sm text-muted">{LEARNING_LOOP_SUMMARY}</p>
      <Radial
        hub="Learning loop"
        hubSub="organizational memory"
        items={LEARNING_LOOP_ITEMS}
        hex={LEARNING_LOOP_HEX}
        ring
      />
    </div>
  );
}

/* ============================== Graphics ============================== */

/** Hub-and-spoke diagram (or a loop when `ring`). Falls back to a grid below lg. */
function Radial({
  hub,
  hubSub,
  items,
  hex,
  ring,
}: {
  hub: string;
  hubSub?: string;
  items: string[];
  hex: string;
  ring?: boolean;
}) {
  const RX = 38;
  const RY = 37;
  // Rounded so server and browser render identical values (no hydration mismatch).
  const r = (v: number) => Math.round(v * 100) / 100;
  const pts = items.map((_, i) => {
    const a = ((-90 + (360 / items.length) * i) * Math.PI) / 180;
    return { x: r(50 + RX * Math.cos(a)), y: r(50 + RY * Math.sin(a)) };
  });

  return (
    <>
      <div className="relative hidden h-[460px] lg:block">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {ring ? (
            <ellipse
              cx="50"
              cy="50"
              rx={RX}
              ry={RY}
              fill="none"
              stroke={hex}
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeDasharray="5 7"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            pts.map((p, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={p.x}
                y2={p.y}
                stroke={hex}
                strokeOpacity="0.45"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ))
          )}
        </svg>
        <div
          className="absolute left-1/2 top-1/2 grid h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 bg-card text-center shadow-card"
          style={{
            borderColor: hex,
            backgroundImage: `radial-gradient(circle, ${hex}38, ${hex}0d)`,
          }}
        >
          <div className="px-3">
            <div className="text-[13px] font-bold uppercase leading-tight tracking-wide text-fg">
              {hub}
            </div>
            {hubSub && <div className="mt-1 text-[10px] leading-tight text-muted">{hubSub}</div>}
          </div>
        </div>
        {items.map((it, i) => (
          <div
            key={it}
            className="absolute w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card px-2.5 py-1.5 text-center text-[11.5px] font-medium leading-tight text-fg shadow-sm"
            style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%`, borderColor: `${hex}66` }}
          >
            {it}
          </div>
        ))}
      </div>

      <div className="mt-3 lg:hidden">
        <div
          className="mx-auto mb-3 w-fit rounded-full border-2 px-4 py-2 text-center"
          style={{ borderColor: hex, background: `${hex}1a` }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wide text-fg">{hub}</div>
          {hubSub && <div className="text-[10px] text-muted">{hubSub}</div>}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <div
              key={it}
              className="rounded-xl border bg-card px-3 py-2 text-[12.5px] text-fg"
              style={{ borderColor: `${hex}55`, boxShadow: `inset 3px 0 0 0 ${hex}` }}
            >
              {it}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Extra({ label, items, hex }: { label: string; items: string[]; hex: string }) {
  // "Old: a → b → c" / "New: …" pairs render as two flows.
  const flows = items.every((i) => /^(Old|New):/.test(i))
    ? items.map((i) => {
        const at = i.indexOf(":");
        return { tag: i.slice(0, at), steps: i.slice(at + 1).trim().split(/\s*→\s*/) };
      })
    : null;

  return (
    <div className="mt-4 border-t border-line/60 pt-4">
      <MiniLabel>{label}</MiniLabel>
      {flows ? (
        <div className="space-y-2">
          {flows.map((f) => {
            const isNew = f.tag === "New";
            const c = isNew ? hex : MUTED_HEX;
            return (
              <div key={f.tag} className="flex flex-wrap items-center gap-y-1.5">
                <span
                  className="mr-2 w-12 rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `${c}1f`, color: c }}
                >
                  {f.tag}
                </span>
                {f.steps.map((s, i) => (
                  <Fragment key={s}>
                    <span
                      className={
                        "rounded-full border px-2.5 py-0.5 text-[12px] " +
                        (isNew ? "font-semibold text-fg" : "text-muted")
                      }
                      style={{ borderColor: `${c}55` }}
                    >
                      {s}
                    </span>
                    {i < f.steps.length - 1 && <SideArrow hex={c} />}
                  </Fragment>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Chips items={items} hex={hex} />
      )}
    </div>
  );
}

function StageDetail({
  stage,
  chevron,
  children,
}: {
  stage: FutureStage;
  chevron?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className="flex h-full flex-col gap-3 rounded-2xl border bg-bg/50 p-4"
        style={{ borderColor: `${stage.hex}55`, boxShadow: `inset 0 3px 0 0 ${stage.hex}` }}
      >
        <div className="flex items-center gap-2">
          <NumBadge n={stage.num} hex={stage.hex} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: stage.hex }}
          >
            Stage {pad(stage.num)}
          </span>
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-tight text-fg">{stage.title}</div>
          <p className="mt-1 text-[12px] leading-snug text-muted">{stage.description}</p>
        </div>
        {children}
      </div>
      {chevron && (
        <span
          aria-hidden
          className="absolute -right-[18px] top-10 z-10 hidden h-7 w-7 place-items-center rounded-full border bg-card lg:grid"
          style={{ borderColor: `${stage.hex}66`, color: stage.hex }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
      )}
    </div>
  );
}

function BrainBand() {
  const h = ORG_BRAIN.hex;
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3"
      style={{ borderColor: `${h}55`, background: `linear-gradient(90deg, ${h}22, ${h}06)` }}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: h }}>
        Sits above everything
      </span>
      <span className="text-sm font-semibold text-fg">{ORG_BRAIN.title}</span>
      <span className="text-[12px] text-muted">— shared memory for humans and agents</span>
    </div>
  );
}

function OpsBand() {
  const ops = layer("7");
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-dashed px-4 py-3"
      style={{ borderColor: `${ops.hex}77`, background: `${ops.hex}0d` }}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: ops.hex }}>
        Cross-cutting · every stage
      </span>
      <span className="text-sm font-semibold text-fg">{ops.title}</span>
      <span className="text-[12px] text-muted">— visibility, ownership, risk &amp; alerts</span>
    </div>
  );
}

function LayerBand({ layer: l, note, dashed }: { layer: Layer; note: string; dashed?: boolean }) {
  return (
    <div
      className={"flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-4 py-3 " + (dashed ? "border-dashed" : "")}
      style={{ borderColor: `${l.hex}66`, background: `${l.hex}0f` }}
    >
      <NumBadge n={Number(l.num)} hex={l.hex} />
      <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: l.hex }}>
        {note}
      </span>
      <span className="text-sm font-semibold text-fg">{l.title}</span>
      {l.centerpiece && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
          style={{ background: `${l.hex}1f`, color: l.hex }}
        >
          {l.centerpiece.label}
        </span>
      )}
      <span className="ml-auto text-[11px] text-muted">{l.stages.length} capabilities</span>
    </div>
  );
}

/* ============================== Small bits ============================== */

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
      {children}
    </div>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
      {children}
    </div>
  );
}

function NumBadge({ n, hex }: { n: number; hex: string }) {
  return (
    <span
      className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
      style={{ background: `${hex}22`, color: hex }}
    >
      {n}
    </span>
  );
}

function Chips({ items, hex }: { items: string[]; hex: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it}
          className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{ background: `${hex}14`, color: hex, border: `1px solid ${hex}40` }}
        >
          {it}
        </span>
      ))}
    </div>
  );
}

function CheckList({ items, hex, small }: { items: string[]; hex: string; small?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li
          key={it}
          className={"flex items-start gap-2 text-fg " + (small ? "text-[11.5px]" : "text-[13px]")}
        >
          <Check hex={hex} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Check({ hex }: { hex: string }) {
  return (
    <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={hex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowHead({ hex }: { hex: string }) {
  return (
    <svg width="12" height="9" viewBox="0 0 12 9" aria-hidden>
      <path d="M0 0 L12 0 L6 9 Z" fill={hex} />
    </svg>
  );
}

function DownArrow({ hex }: { hex: string }) {
  return (
    <div className="flex h-11 flex-col items-center" aria-hidden>
      <span className="w-0.5 flex-1" style={{ background: hex }} />
      <ArrowHead hex={hex} />
    </div>
  );
}

/** Two columns merging into one (Go to Market + Growth → GTM & Growth). */
function MergeArrow({ hex }: { hex: string }) {
  return (
    <div className="relative h-11" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M25 0 V40 H75 V0 M50 40 V82"
          fill="none"
          stroke={hex}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <ArrowHead hex={hex} />
      </div>
    </div>
  );
}

function SideArrow({ hex = "#f97316", small }: { hex?: string; small?: boolean }) {
  const size = small ? 13 : 16;
  return (
    <svg className={(small ? "mx-1" : "mx-1.5") + " shrink-0"} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function FlowArrow() {
  return (
    <div aria-hidden className="flex shrink-0 items-center justify-center py-1 text-[#f97316] lg:px-1 lg:py-0">
      <svg className="h-5 w-5 rotate-90 lg:rotate-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </div>
  );
}

function LoopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
