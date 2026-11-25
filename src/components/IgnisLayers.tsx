"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { IGNIS_FRAMES, IGNIS_PLATFORM, IGNIS_TERMS } from "@/lib/ignisFrames";
import { enteredAtEnd, usePresentStops, usePresenting } from "./PresentMode";

/* -----------------------------------------------------------------------------
 * Phase 2 · 3 · Architecture — Ignis, layer by layer. Two sections:
 *
 *   Product Development — one graph that grows a frame at a time: what's added
 *   in the current frame is green, everything from earlier frames is greyed.
 *   Beside it, three gauges and the kinds of task each frame unlocks.
 *
 *   Platform & Infrastructure — the continuous work that runs beside every
 *   frame: built once, inherited by every product.
 *
 * ← → (or 1–6) move between frames, I switches section, N hides the notes. In
 * present mode the six frames and then the platform section are the page's stops.
 * The place is kept in the link (#frame=3, #tab=platform), so it can be shared.
 * -------------------------------------------------------------------------- */

/** What the page adds to each frame in IGNIS_FRAMES, in the same order. */
type FrameView = {
  /** The diagram grows with each frame — this is the part of it in view. */
  viewBox: string;
  complexity: number;
  velocity: number;
  confidence: number;
  notes: React.ReactNode;
};

const FRAME_VIEWS: FrameView[] = [
  {
    viewBox: "0 228 1040 340",
    complexity: 10,
    velocity: 10,
    confidence: 10,
    notes: (
      <>
        Engineers keep working in Jira. When a ticket is assigned to Ignis and moved to In
        Progress, the Windmill pipeline launches a Newton coding session, opens a merge request,
        runs verification, and once reviewed, ships to <b>Release</b>. Scope today: simple UI
        tasks, not business logic.
      </>
    ),
  },
  {
    viewBox: "0 24 1040 686",
    complexity: 10,
    velocity: 10,
    confidence: 35,
    notes: (
      <>
        Each product keeps a self-updating <Code>&lt;product&gt;-ignis-context</Code> repo — the
        product brain. A Windmill backlog agent reads it (strategy, shipped changelogs, past PM
        votes) and surfaces ideas in the <b>Ignis Controller</b>. The PM can work{" "}
        <b>either in the Ignis Controller or directly in Jira</b> — changes made in the Ignis
        Controller reflect automatically on Jira. When MRs merge into <b>Release</b>, scheduled
        docs automation diffs the shipped code and updates <Code>product/</Code> docs and
        CHANGELOGs so future suggestions always build on what actually shipped.
      </>
    ),
  },
  {
    viewBox: "0 -196 1040 906",
    complexity: 10,
    velocity: 10,
    confidence: 65,
    notes: (
      <>
        High-level usage in <b>Philippe</b> (DAU &amp; macro metrics) is the input to{" "}
        <b>A/B tests and feature-level KPIs</b>: it supplies the usage baseline, and the A/B
        tests and KPIs show what a specific change moved. Ignis ingests these{" "}
        <b>directly measurable signals (A/B test results, funnel conversions, feature KPIs)</b>{" "}
        — metrics directly impacted by shipped changes — alongside <b>store ratings</b> and{" "}
        <b>store reviews &amp; user comments</b>.
      </>
    ),
  },
  {
    viewBox: "0 -196 1040 906",
    complexity: 10,
    velocity: 45,
    confidence: 65,
    notes: (
      <>
        With R&amp;D fast track, <b>risk is checked upfront during feature planning</b> — before
        any MR is created — and tagged on the ticket. After verification, both paths lead to{" "}
        <b>Release</b>: <b>low-risk</b> changes go straight to Release (PM can merge), while{" "}
        <b>high-risk</b> changes pass through <b>R&amp;D review</b> before Release.
      </>
    ),
  },
  {
    viewBox: "0 -196 1092 920",
    complexity: 10,
    velocity: 75,
    confidence: 65,
    notes: (
      <>
        Ignis runtime can also dispatch to external <b>3rd-party services</b> — for example an
        outside <b>UGC agent</b> that generates marketing assets outside the coding loop and
        flows straight into <b>Release</b> when ready.
      </>
    ),
  },
  {
    viewBox: "0 -196 1092 1136",
    complexity: 55,
    velocity: 75,
    confidence: 80,
    notes: (
      <>
        Feature planning expands for complex cross-functional work: before a ticket enters Jira,
        Ignis runs <b>Design</b>, <b>Analytics</b>, and <b>Marketing</b> skills to validate and
        align UX, tracking events/KPIs, and messaging. Each discipline has its own <b>gate</b> —
        if human review from a Designer, Analyst, or Marketer is needed, they approve at the
        gate before implementation starts.
      </>
    ),
  },
];

const FRAMES = IGNIS_FRAMES.map((f, i) => ({
  ...f,
  ...FRAME_VIEWS[i],
  /** Short name on the frame picker. */
  tab: (f.plus ? "+ " : "") + f.name,
}));

const GAUGES = [
  { key: "complexity", label: "Task complexity handled" },
  { key: "velocity", label: "Team velocity" },
  { key: "confidence", label: "Confidence level" },
] as const;

type Tab = "product" | "platform";

const TABS: { key: Tab; label: string; pill: string }[] = [
  { key: "product", label: "Product Development", pill: `Frames 1–${FRAMES.length}` },
  { key: "platform", label: "Platform & Infrastructure", pill: "Continuous" },
];

/** What's new in the frame on screen. Light and dark steps of the same green. */
const NEW_STROKE = "stroke-green-600 dark:stroke-green-500";
const NEW_BG = "bg-green-600 dark:bg-green-500";

/** Keep the place in the link, so a frame or the platform section can be shared. */
function link(hash: string) {
  try {
    window.history.replaceState(null, "", hash);
  } catch {
    /* a sandboxed frame may refuse — the page works the same without it */
  }
}

export default function IgnisLayers() {
  const [tab, setTab] = useState<Tab>("product");
  const [frame, setFrame] = useState(1);
  const [notesOn, setNotesOn] = useState(true);
  const presenting = usePresenting();
  const stageRef = useRef<HTMLDivElement>(null);
  const f = FRAMES[frame - 1];
  const prev = FRAMES[Math.max(0, frame - 2)];

  function goFrame(n: number) {
    setTab("product");
    setFrame(n);
    link(`#frame=${n}`);
  }

  function goTab(t: Tab) {
    setTab(t);
    link(t === "platform" ? "#tab=platform" : `#frame=${frame}`);
  }

  // Present mode: ← → walk the six frames, then the platform section, then the next / previous page.
  usePresentStops((dir) => {
    const next = (tab === "platform" ? FRAMES.length + 1 : frame) + dir;
    if (next < 1 || next > FRAMES.length + 1) return false;
    if (next > FRAMES.length) goTab("platform");
    else goFrame(next);
    stageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    return true;
  });

  // Opened from a link to a frame or to the platform section — or stepped back
  // into from the next page, which opens at the last stop.
  useEffect(() => {
    function fromLink() {
      const hash = window.location.hash;
      const n = Number(/frame=(\d+)/.exec(hash)?.[1]);
      if (n >= 1 && n <= FRAMES.length) {
        setFrame(n);
        setTab("product");
      }
      if (/tab=(platform|infra)/.test(hash)) setTab("platform");
    }
    if (enteredAtEnd()) {
      setTab("platform");
      stageRef.current?.scrollIntoView({ block: "start" });
    } else fromLink();
    // A link to another frame, opened while already on the page.
    window.addEventListener("hashchange", fromLink);
    return () => window.removeEventListener("hashchange", fromLink);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = e.key.toLowerCase();
      if (key === "n") return setNotesOn((on) => !on);
      if (key === "i") return goTab(tab === "product" ? "platform" : "product");
      if (tab !== "product") return;
      const n = Number(e.key);
      if (n >= 1 && n <= FRAMES.length) goFrame(n);
      else if (presenting) return; // present mode owns the arrows
      else if (e.key === "ArrowRight" && frame < FRAMES.length) goFrame(frame + 1);
      else if (e.key === "ArrowLeft" && frame > 1) goFrame(frame - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section aria-label="Ignis — layered overview" className="space-y-4">
      <div className="flex items-baseline gap-x-4 text-[12px] leading-relaxed text-muted">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Terms</span>
        <dl aria-label="Terms" className="flex flex-wrap gap-x-4 gap-y-0.5">
          {IGNIS_TERMS.map((t) => (
            <div key={t.term} className="flex gap-1.5">
              <dt className="font-semibold text-fg">{t.term}</dt>
              <dd>{t.means}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div role="group" aria-label="Section" className="inline-flex max-w-full flex-wrap rounded-3xl border border-line bg-card/40 p-1">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={on}
              onClick={() => goTab(t.key)}
              className={
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition " +
                (on ? "bg-accent/15 text-fg shadow-[0_0_0_1px_#7c5cff]" : "text-muted hover:text-fg")
              }
            >
              {t.label}
              <span
                className={
                  "rounded-full border px-1.5 py-px text-[10px] font-medium " +
                  (on ? "border-fg/30 text-fg" : "border-line text-muted")
                }
              >
                {t.pill}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "product" && (
        <nav
          aria-label="Frames"
          className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-card/40 p-2"
        >
          <span className="px-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">Frame</span>
          {FRAMES.map((x, i) => {
            const on = i + 1 === frame;
            return (
              <button
                key={x.tab}
                type="button"
                aria-pressed={on}
                onClick={() => goFrame(i + 1)}
                className={
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition " +
                  (on
                    ? "border-accent bg-accent/15 text-fg shadow-[0_0_0_1px_#7c5cff]"
                    : "border-line text-muted hover:border-fg/30 hover:text-fg")
                }
              >
                <span className="tabular-nums font-normal text-muted">{i + 1}</span>
                {x.tab}
              </button>
            );
          })}
        </nav>
      )}

      <div ref={stageRef} className="scroll-mt-20">
        {tab === "platform" ? (
          <Platform onBack={() => goTab("product")} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside
              aria-label="Task scope and team metrics"
              className="space-y-5 rounded-3xl border border-line bg-card/40 p-4 sm:p-5 lg:sticky lg:top-[4.5rem]"
            >
              <div>
                <PanelTitle note="Illustrative, not measured.">Capability gauges (0–100)</PanelTitle>
                <div className="space-y-3.5">
                  {GAUGES.map((g) => (
                    <Gauge key={g.key} label={g.label} value={f[g.key]} gain={frame === 1 ? 0 : f[g.key] - prev[g.key]} />
                  ))}
                </div>
              </div>

              <div className="border-t border-line/70 pt-4">
                <PanelTitle>Types of tasks &amp; unlocked value</PanelTitle>
                <ol className="space-y-1.5">
                  {FRAMES.slice(0, frame).map((x, i) => {
                    const on = i + 1 === frame;
                    return (
                      <li key={x.tab}>
                        <button
                          type="button"
                          onClick={() => goFrame(i + 1)}
                          aria-current={on ? "step" : undefined}
                          className={
                            "flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left text-[12.5px] leading-snug transition " +
                            (on
                              ? "border-green-600 bg-green-500/10 text-fg shadow-[0_0_0_1px_#16a34a] dark:border-green-500 dark:shadow-[0_0_0_1px_#22c55e]"
                              : "border-line bg-bg/60 text-muted hover:border-fg/30 hover:text-fg")
                          }
                        >
                          <span
                            className={
                              "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-semibold tabular-nums " +
                              (on ? "border-green-600 bg-green-500/15 text-fg dark:border-green-500" : "border-line text-muted")
                            }
                          >
                            {i + 1}
                          </span>
                          <span>{x.unlock}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                {`In parallel throughout all ${FRAMES.length} frames, continuous platform & infrastructure work compounds complexity, velocity, guardrails & compliance. `}
                <button
                  type="button"
                  onClick={() => goTab("platform")}
                  className="font-semibold text-fg underline decoration-fg/30 underline-offset-2 transition hover:decoration-fg"
                >
                  Open Platform &amp; Infrastructure →
                </button>
              </p>
            </aside>

            <div className="min-w-0 rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                <h3 className="text-base font-semibold text-fg" aria-live="polite">
                  <span className="font-normal text-muted">Frame {frame} — </span>
                  {f.title}
                </h3>
                {frame > 1 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-[3px] border border-muted/50 bg-line/30" aria-hidden />
                      Existing graph
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-[3px] border-2 border-green-600 bg-green-500/10 dark:border-green-500" aria-hidden />
                      Added in this frame
                    </span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <Diagram frame={frame} viewBox={f.viewBox} />
              </div>
            </div>
          </div>
        )}
      </div>

      {tab === "product" && notesOn && (
        <section aria-label={`Presenter notes, frame ${frame}`} className="rounded-2xl border border-line bg-card/40 px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Presenter · Frame {frame}
          </div>
          <p className="mt-1.5 max-w-[74ch] text-sm leading-relaxed text-fg/90 [&_b]:font-semibold [&_b]:text-fg">
            {f.notes}
          </p>
        </section>
      )}
    </section>
  );
}

/* ---------- Platform & Infrastructure ---------- */

const CONTEXT_REPO = "<product>-ignis-context";

/** The continuous track: no graph, one card per kind of work. */
function Platform({ onBack }: { onBack: () => void }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <li className="flex flex-col p-1 sm:p-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">Continuous</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-fg">Platform &amp; Infrastructure</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{IGNIS_PLATFORM.intro}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 self-start rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-muted transition hover:border-fg/30 hover:text-fg sm:mt-auto"
        >
          ← Product Development frames
        </button>
      </li>
      {IGNIS_PLATFORM.items.map((it) => {
        const [before, after] = it.text.split(CONTEXT_REPO);
        return (
          <li key={it.name} className="rounded-2xl border border-line bg-card/60 p-4 shadow-card">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{it.tag}</div>
            <h3 className="mt-1 text-[15px] font-semibold text-fg">{it.name}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-fg/90">
              {before}
              {after !== undefined && (
                <>
                  <Code>{CONTEXT_REPO}</Code>
                  {after}
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Side panel ---------- */

function PanelTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-2.5">
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted">{children}</h3>
      {note && <p className="mt-0.5 text-[11.5px] text-muted">{note}</p>}
    </div>
  );
}

/** A 0–100 meter. `gain` is how much this frame added — it turns the bar green. */
function Gauge({ label, value, gain }: { label: string; value: number; gain: number }) {
  const up = gain > 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-fg">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] tabular-nums text-muted">
          {up && (
            <span className="rounded-full border border-green-600 bg-green-500/10 px-1.5 text-[11px] font-semibold text-fg dark:border-green-500">
              +{gain}
            </span>
          )}
          {value} / 100
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/60"
      >
        <div
          className={
            "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none " +
            (up ? NEW_BG : "bg-accent")
          }
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-muted/80" aria-hidden>
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-line/50 px-1 py-px font-mono text-[0.88em] text-fg">{children}</code>;
}

/* ---------- Diagram ---------- */

/** How a layer is drawn: added in the frame on screen, or carried over from an earlier one. */
type LayerState = "current" | "prior";
const LayerCtx = createContext<{ state: LayerState; id: string }>({ state: "current", id: "" });

/** One frame's additions. Not drawn until its frame is reached; greyed once passed. */
function Layer({ n, frame, id, children }: { n: number; frame: number; id: string; children: React.ReactNode }) {
  if (n > frame) return null;
  return (
    <LayerCtx.Provider value={{ state: n === frame ? "current" : "prior", id }}>
      <g>{children}</g>
    </LayerCtx.Provider>
  );
}

/** The three families of the base graph, shown in color only on frame 1 (same
 *  validated steps as the stage palette). Later additions are all green. */
const FAMILY = { people: "#6250d6", runtime: "#199e70", delivery: "#c98500" } as const;
type NodeKind = keyof typeof FAMILY | "neutral" | "add";

const PRIOR_BOX = "fill-line/30 stroke-muted/50";

function boxProps(kind: NodeKind, state: LayerState): React.SVGProps<SVGRectElement> {
  if (state === "prior") return { className: PRIOR_BOX, strokeWidth: 1.3 };
  if (kind === "add") return { className: `fill-green-500/10 ${NEW_STROKE}`, strokeWidth: 2.4 };
  if (kind === "neutral") return { className: "fill-card stroke-muted/70", strokeWidth: 1.5 };
  return { fill: `${FAMILY[kind]}1f`, stroke: FAMILY[kind], strokeWidth: 1.5 };
}

/** A line of text inside a node: the words and the y they sit on. */
type Line = [text: string, y: number];

function Node({
  kind,
  x,
  y,
  w,
  h,
  rx = 10,
  title,
  role,
  sub,
}: {
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  title: Line;
  /** What the node is — the second line of a node added in a later frame. */
  role?: Line;
  sub?: Line;
}) {
  const { state } = useContext(LayerCtx);
  const cx = x + w / 2;
  const prior = state === "prior";
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} vectorEffect="non-scaling-stroke" {...boxProps(kind, state)} />
      <text x={cx} y={title[1]} textAnchor="middle" fontSize={13.5} fontWeight={500} className={prior ? "fill-muted" : "fill-fg"}>
        {title[0]}
      </text>
      {role && (
        <text x={cx} y={role[1]} textAnchor="middle" fontSize={11} className={prior ? "fill-muted" : "fill-fg"}>
          {role[0]}
        </text>
      )}
      {sub && (
        <text x={cx} y={sub[1]} textAnchor="middle" fontSize={11} className="fill-muted">
          {sub[0]}
        </text>
      )}
    </>
  );
}

type EdgeKind = "main" | "return" | "add" | "dashed" | "bi";

/** An arrow. `main` and `return` belong to the base graph; `add`, `dashed`
 *  (a softer, feedback-style link) and `bi` (it goes both ways) to later frames. */
function Edge({ kind, d, arrow = true }: { kind: EdgeKind; d: string; arrow?: boolean }) {
  const { state, id } = useContext(LayerCtx);
  const dash = kind === "return" || kind === "dashed" ? "6 4" : undefined;
  const look =
    state === "prior"
      ? { className: "stroke-muted/50", strokeWidth: 1.4, marker: "prior" }
      : kind === "main"
        ? { className: "stroke-muted", strokeWidth: 1.6, marker: "main" }
        : kind === "return"
          ? { className: "stroke-accent", strokeWidth: 1.6, marker: "return" }
          : { className: NEW_STROKE, strokeWidth: kind === "dashed" ? 1.8 : 2, marker: "new" };
  return (
    <path
      d={d}
      fill="none"
      className={look.className}
      strokeWidth={look.strokeWidth}
      strokeDasharray={dash}
      markerStart={kind === "bi" ? `url(#${id}-${look.marker}-start)` : undefined}
      markerEnd={arrow ? `url(#${id}-${look.marker})` : undefined}
      vectorEffect="non-scaling-stroke"
    />
  );
}

/** A straight edge between two points. */
const ln = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} L ${x2} ${y2}`;

/** Words beside an edge. */
function Label({
  x,
  y,
  anchor,
  children,
}: {
  x: number;
  y: number;
  anchor?: "middle" | "end";
  children: React.ReactNode;
}) {
  const { state } = useContext(LayerCtx);
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={11} className={state === "prior" ? "fill-muted" : "fill-fg"}>
      {children}
    </text>
  );
}

/** `start` is the head at the beginning of a two-way edge, pointing back along it. */
function Arrowhead({ id, className, start }: { id: string; className: string; start?: boolean }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX={start ? 1 : 7} refY="4" orient="auto">
      <path d={start ? "M8,1 L0,4 L8,7 Z" : "M0,1 L8,4 L0,7 Z"} className={className} />
    </marker>
  );
}

function Diagram({ frame, viewBox }: { frame: number; viewBox: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // From frame 6 the planning skills take the middle band, so the delivery row moves down.
  const dy = frame >= 6 ? 216 : 0;
  const lower = dy ? `translate(0, ${dy})` : undefined;
  // From frame 4 the risk check decides who merges, so the MR is no longer "for human review".
  const fastTrack = frame >= 4;
  const layer = (n: number) => ({ n, frame, id });

  return (
    <svg viewBox={viewBox} role="img" aria-labelledby={`${id}-title ${id}-desc`} className="block h-auto w-full min-w-[640px]">
      <title id={`${id}-title`}>Ignis layered architecture</title>
      <desc id={`${id}-desc`}>
        Ignis graph built in six product frames: Jira ticket to merge request, product-memory
        ideas, measurable signals, risk-tiered review, third-party non-code work, and
        cross-functional planning gates.
      </desc>
      <defs>
        <Arrowhead id={`${id}-main`} className="fill-muted" />
        <Arrowhead id={`${id}-return`} className="fill-accent" />
        <Arrowhead id={`${id}-prior`} className="fill-muted/50" />
        <Arrowhead id={`${id}-prior-start`} className="fill-muted/50" start />
        <Arrowhead id={`${id}-new`} className="fill-green-600 dark:fill-green-500" />
        <Arrowhead id={`${id}-new-start`} className="fill-green-600 dark:fill-green-500" start />
      </defs>

      {/* 1 · Base graph: a Jira ticket becomes a merge request */}
      <Layer {...layer(1)}>
        <Node kind="people" x={84} y={256} w={156} h={72} title={["PM / Engineer", 287]} sub={["creates & assigns", 307]} />
        <Node kind="neutral" x={296} y={256} w={164} h={72} title={["Jira ticket", 287]} sub={["In Progress → Ignis", 307]} />

        <RuntimeGroup />
        <Node kind="neutral" x={530} y={272} w={108} h={56} rx={8} title={["Ingress", 297]} sub={["routing", 314]} />
        <Node kind="neutral" x={658} y={272} w={108} h={56} rx={8} title={["Pipeline", 297]} sub={["SW1–SW6", 314]} />
        <Edge kind="main" d={ln(638, 300, 656, 300)} />

        <Node kind="neutral" x={836} y={256} w={164} h={72} title={["Newton", 287]} sub={["coding agent", 307]} />

        {/* Delivery row: MR created → Verification → Release */}
        <g transform={lower}>
          <Node
            kind="delivery"
            x={716}
            y={476}
            w={176}
            h={72}
            title={["MR created", fastTrack ? 517 : 507]}
            sub={fastTrack ? undefined : ["for human review", 527]}
          />
          <Node kind="delivery" x={416} y={476} w={176} h={72} title={["Verification", 507]} sub={["CI · contract · staging", 527]} />
          <Node kind="delivery" x={84} y={476} w={164} h={72} title={["Release", 507]} sub={["merged & shipped", 527]} />
          <Edge kind="main" d={ln(716, 512, 594, 512)} />
          {!fastTrack && <Edge kind="main" d={ln(416, 512, 250, 512)} />}
        </g>

        <Edge kind="main" d={ln(240, 292, 294, 292)} />
        <Edge kind="main" d={ln(460, 292, 514, 292)} />
        <Edge kind="main" d={ln(780, 292, 834, 292)} />
        <Edge kind="main" d={`M 918 328 L 918 ${512 + dy} L 894 ${512 + dy}`} />

        {/* Back to Jira */}
        <Edge kind="return" d={ln(452, 476 + dy, 452, 330)} />
        <Label x={458} y={388}>status</Label>
        <Label x={458} y={402}>&amp; outcome</Label>
      </Layer>

      {/* 2 · Ideas from product memory: the product brain, backlog ideas and docs automation */}
      <Layer {...layer(2)}>
        <Node
          kind="add"
          x={84}
          y={48}
          w={232}
          h={78}
          title={["<product>-ignis-context", 75]}
          role={["product brain", 94]}
          sub={["README · changelogs · feedback", 112]}
        />
        <Node
          kind="add"
          x={384}
          y={48}
          w={220}
          h={78}
          title={["Backlog agent", 75]}
          role={["Windmill · daily / on-demand", 94]}
          sub={["reads brain → up to 5 ideas", 112]}
        />
        <Node
          kind="add"
          x={672}
          y={48}
          w={220}
          h={78}
          title={["Ignis Controller", 75]}
          role={["ideas & ticket workspace", 94]}
          sub={["backlog snapshot · syncs to Jira", 112]}
        />
        <Edge kind="add" d={ln(316, 87, 382, 87)} />
        <Edge kind="add" d={ln(604, 87, 670, 87)} />

        {/* Both ways: the PM works in the Controller — or directly in Jira */}
        <Edge kind="bi" d="M 196 254 L 196 160 L 736 160 L 736 128" />
        <Label x={466} y={150} anchor="middle">PM talks with Ignis Controller (or directly with Jira)</Label>

        {/* Controller → Jira ticket: what changes in the Controller shows up in Jira */}
        <Edge kind="add" d="M 790 126 L 790 210 L 378 210 L 378 254" />
        <Label x={584} y={200} anchor="middle">changes in Controller reflect on Jira</Label>

        {/* PM / Engineer → feedback back to the brain */}
        <Edge kind="dashed" d={ln(118, 256, 118, 128)} />
        <Label x={108} y={186} anchor="end">like / dislike</Label>
        <Label x={108} y={201} anchor="end">feedback</Label>

        {/* Closed loop: shipped releases refresh the product brain */}
        <g transform={lower}>
          <Node
            kind="add"
            x={84}
            y={592}
            w={232}
            h={72}
            title={["Docs automation", 618]}
            role={["CI in <product>-ignis-context", 637]}
            sub={["diffs shipped code · updates docs", 654]}
          />
          <Edge kind="add" d={ln(166, 548, 166, 590)} />
          <Label x={156} y={574} anchor="end">shipped changes</Label>
          <Label x={46} y={682}>updates docs &amp; CHANGELOG</Label>
        </g>
        <Edge kind="add" d={`M 200 ${664 + dy} L 200 ${690 + dy} L 36 ${690 + dy} L 36 87 L 82 87`} />
      </Layer>

      {/* 3 · Proof it worked: usage, A/B tests & KPIs, store ratings and reviews feed the product brain */}
      <Layer {...layer(3)}>
        <Node kind="add" x={198} y={-176} w={244} h={66} title={["Philippe", -148]} role={["DAU & macro metrics", -130]} />
        {/* Philippe is the baseline for the A/B tests and feature KPIs */}
        <Edge kind="add" d={ln(320, -110, 320, -84)} />
        <Node
          kind="add"
          x={198}
          y={-82}
          w={244}
          h={72}
          title={["A/B tests & feature KPIs", -55]}
          role={["e.g. A/B tests · funnels · conversion", -37]}
          sub={["measurable · directly moved by changes", -21]}
        />
        <Node kind="add" x={456} y={-82} w={150} h={72} title={["Store ratings", -55]} role={["star ratings", -37]} sub={["user feedback signals", -21]} />
        <Node kind="add" x={620} y={-82} w={150} h={72} title={["Store reviews", -55]} role={["reviews · comments", -37]} sub={["user feedback signals", -21]} />

        {/* All three feed the product brain, without crossing */}
        <Edge kind="add" d={ln(212, -10, 212, 46)} />
        <Edge kind="add" d="M 531 -10 L 531 22 L 254 22 L 254 46" />
        <Edge kind="add" d="M 695 -10 L 695 34 L 296 34 L 296 46" />
      </Layer>

      {/* 4 · Risk-tiered review: risk checked in planning, both paths end in Release */}
      <Layer {...layer(4)}>
        <Node
          kind="add"
          x={140}
          y={364}
          w={216}
          h={70}
          title={["Feature planning", 389]}
          role={["risk check (before MR)", 407]}
          sub={["classifies low vs high risk", 423]}
        />
        <Edge kind="add" d={ln(196, 328, 196, 362)} />
        <Edge kind="add" d={ln(320, 364, 320, 330)} />
        <Label x={328} y={351}>risk tag</Label>

        <g transform={lower}>
          {/* Low risk: straight from Verification into Release */}
          <Edge kind="add" d={ln(416, 502, 250, 502)} />
          <Label x={333} y={491} anchor="middle">low risk · PM merges</Label>

          {/* High risk: R&D review, then Release */}
          <Node
            kind="add"
            x={416}
            y={592}
            w={192}
            h={72}
            title={["R&D review", 619]}
            role={["high risk · R&D looks at it", 637]}
            sub={["engineer reviews & merges", 653]}
          />
          <Edge kind="add" d={ln(504, 548, 504, 590)} />
          <Label x={514} y={574}>high risk</Label>
          <Edge kind="add" d="M 416 628 L 352 628 L 352 528 L 250 528" />
          <Label x={360} y={582}>R&amp;D approves</Label>
        </g>
      </Layer>

      {/* 5 · 3rd-party services (e.g. a UGC agent), straight to Release */}
      <Layer {...layer(5)}>
        <Edge kind="add" d="M 780 266 L 808 266 L 808 182 L 834 182" />
        <Node
          kind="add"
          x={836}
          y={146}
          w={208}
          h={74}
          title={["3rd-party service", 171]}
          role={["e.g. UGC agent · creates UGC", 190]}
          sub={["non-code execution", 207]}
        />
        <Edge
          kind="add"
          d={`M 1044 182 L 1068 182 L 1068 ${700 + dy} L 332 ${700 + dy} L 332 ${566 + dy} L 224 ${566 + dy} L 224 ${550 + dy}`}
        />
        <Label x={700} y={689 + dy} anchor="middle">created UGC → straight to Release</Label>
      </Layer>

      {/* 6 · Cross-functional planning: Design, Analytics and Marketing skills, each with a human gate */}
      <Layer {...layer(6)}>
        <Edge kind="add" d="M 140 399 L 56 399 L 56 484 L 74 484" />
        <Edge kind="add" d="M 56 484 L 56 556 L 74 556" />
        <Edge kind="add" d="M 56 556 L 56 628 L 74 628" />

        <Node kind="add" x={76} y={456} w={152} h={56} rx={8} title={["Design skill", 480]} role={["validates UX & UI", 498]} />
        <Edge kind="add" d={ln(228, 484, 252, 484)} />
        <Node kind="add" x={254} y={456} w={156} h={56} rx={8} title={["Designer gate", 480]} role={["human review if needed", 498]} />

        <Node kind="add" x={76} y={528} w={152} h={56} rx={8} title={["Analytics skill", 552]} role={["validates events & KPIs", 570]} />
        <Edge kind="add" d={ln(228, 556, 252, 556)} />
        <Node kind="add" x={254} y={528} w={156} h={56} rx={8} title={["Analyst gate", 552]} role={["human review if needed", 570]} />

        <Node kind="add" x={76} y={600} w={152} h={56} rx={8} title={["Marketing skill", 624]} role={["validates messaging", 642]} />
        <Edge kind="add" d={ln(228, 628, 252, 628)} />
        <Node kind="add" x={254} y={600} w={156} h={56} rx={8} title={["Marketer gate", 624]} role={["human review if needed", 642]} />

        {/* The three gates join and go up into the Jira ticket */}
        <Edge kind="add" d={ln(410, 484, 424, 484)} arrow={false} />
        <Edge kind="add" d={ln(410, 556, 424, 556)} arrow={false} />
        <Edge kind="add" d="M 410 628 L 424 628 L 424 330" />
        <Label x={416} y={392} anchor="end">validated</Label>
        <Label x={416} y={407} anchor="end">&amp; aligned</Label>
      </Layer>
    </svg>
  );
}

/** The box around Ingress and Pipeline. */
function RuntimeGroup() {
  const { state } = useContext(LayerCtx);
  const prior = state === "prior";
  return (
    <>
      <rect
        x={516}
        y={242}
        width={264}
        height={100}
        rx={10}
        vectorEffect="non-scaling-stroke"
        {...(prior
          ? { fill: "none", className: "stroke-muted/50", strokeWidth: 1 }
          : { fill: `${FAMILY.runtime}1a`, stroke: FAMILY.runtime, strokeWidth: 1.25 })}
      />
      <text x={530} y={261} fontSize={11} fontWeight={500} className={prior ? "fill-muted" : "fill-fg"}>
        Ignis runtime (Windmill)
      </text>
    </>
  );
}
