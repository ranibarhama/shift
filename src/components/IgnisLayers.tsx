"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { IGNIS_FRAMES } from "@/lib/ignisFrames";
import { enteredAtEnd, usePresentStops, usePresenting } from "./PresentMode";

/* -----------------------------------------------------------------------------
 * Phase 2 · 3 · Architecture — Ignis, layer by layer. One graph that grows a
 * frame at a time: what's added in the current frame is green, everything from
 * earlier frames is greyed. Beside it, three gauges and the kinds of task each
 * frame unlocks. ← → (or 1–7) move between frames; in present mode the frames
 * are the page's stops.
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
        runs verification, and once reviewed, ships to <b>Release</b>.
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
        votes) and posts up to 5 ideas to the Ignis Controller for the PM to review and rate.
        When MRs merge into <b>Release</b>, scheduled docs automation diffs the shipped code and
        updates <Code>product/</Code> docs and CHANGELOGs, closing the loop so future suggestions
        always build on what actually shipped.
      </>
    ),
  },
  {
    viewBox: "0 -96 1040 806",
    complexity: 10,
    velocity: 10,
    confidence: 65,
    notes: (
      <>
        A fast, low-effort data integration connects live user and business signals into{" "}
        <Code>&lt;product&gt;-ignis-context</Code>: <b>Philippe</b> (DAU &amp; product metrics)
        alongside <b>store ratings, reviews, and user comments</b>. That sharply raises
        confidence that suggested and planned tickets target real user pain and usage trends.
      </>
    ),
  },
  {
    viewBox: "0 -96 1040 806",
    complexity: 10,
    velocity: 45,
    confidence: 65,
    notes: (
      <>
        With R&amp;D fast track, <b>risk is checked upfront during feature planning</b> — before
        any PR is created — and tagged on the ticket. After verification, both paths lead to{" "}
        <b>Release</b>: <b>low-risk</b> changes go straight to Release (PM can merge), while{" "}
        <b>high-risk</b> changes pass through <b>R&amp;D review</b> before Release.
      </>
    ),
  },
  {
    viewBox: "0 -96 1092 820",
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
    viewBox: "0 -96 1092 1036",
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
  {
    viewBox: "0 -96 1092 1080",
    complexity: 85,
    velocity: 85,
    confidence: 92,
    notes: (
      <>
        In parallel, dedicated Ignis R&amp;D advances four platform multipliers across every
        product: <b>(1) Dynamic agent skills</b> — adding or changing skills per agent during
        development; <b>(2) Continuous Eval</b> — continuously measuring the quality of results
        Ignis delivers; <b>(3) Continuous code-writing improvement</b> — feeding MR requested
        changes and product comments back into the coding loop; and{" "}
        <b>(4) Alternative harnesses</b> — evaluating runners such as <b>GitLab Actions</b> and{" "}
        <b>OpenCode</b> alongside Newton.
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
  { key: "complexity", label: "Task complexity" },
  { key: "velocity", label: "Team velocity" },
  { key: "confidence", label: "Confidence level" },
] as const;

/** What's new in the frame on screen. Light and dark steps of the same green. */
const NEW_STROKE = "stroke-green-600 dark:stroke-green-500";
const NEW_BG = "bg-green-600 dark:bg-green-500";

export default function IgnisLayers() {
  const [frame, setFrame] = useState(1);
  const presenting = usePresenting();
  const stageRef = useRef<HTMLDivElement>(null);
  const f = FRAMES[frame - 1];
  const prev = FRAMES[Math.max(0, frame - 2)];

  // Present mode: ← → walk the frames first, then move on to the next / previous page.
  usePresentStops((dir) => {
    const next = frame + dir;
    if (next < 1 || next > FRAMES.length) return false;
    setFrame(next);
    stageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    return true;
  });

  // Stepped back into from the next page: open at the last frame.
  useEffect(() => {
    if (!enteredAtEnd()) return;
    setFrame(FRAMES.length);
    stageRef.current?.scrollIntoView({ block: "start" });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest("input, textarea, select, [contenteditable='true']")) return;
      const n = Number(e.key);
      if (n >= 1 && n <= FRAMES.length) setFrame(n);
      else if (presenting) return; // present mode owns the arrows
      else if (e.key === "ArrowRight") setFrame((x) => Math.min(FRAMES.length, x + 1));
      else if (e.key === "ArrowLeft") setFrame((x) => Math.max(1, x - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting]);

  return (
    <section aria-label="Ignis — layered overview" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Management deck
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            Ignis — layered overview
          </h2>
          <p className="mt-1 text-sm text-muted">Same graph, built layer by layer.</p>
        </div>
        <p className="text-[11px] text-muted">
          <Kbd>←</Kbd> <Kbd>→</Kbd> or <Kbd>1</Kbd>–<Kbd>{FRAMES.length}</Kbd> to move between frames
        </p>
      </div>

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
              onClick={() => setFrame(i + 1)}
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

      <div ref={stageRef} className="grid scroll-mt-20 grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          aria-label="Task scope and team metrics"
          className="space-y-5 rounded-3xl border border-line bg-card/40 p-4 sm:p-5 lg:sticky lg:top-[4.5rem]"
        >
          <div>
            <PanelTitle>Capability gauges (0–100)</PanelTitle>
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
                      onClick={() => setFrame(i + 1)}
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
        </aside>

        <div className="min-w-0 rounded-3xl border border-line bg-card/40 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
            <h3 className="text-base font-semibold text-fg">
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

      <section aria-label={`Presenter notes, frame ${frame}`} className="rounded-2xl border border-line bg-card/40 px-5 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          Presenter · Frame {frame}
        </div>
        <p className="mt-1.5 max-w-[74ch] text-sm leading-relaxed text-fg/90 [&_b]:font-semibold [&_b]:text-fg">
          {f.notes}
        </p>
      </section>
    </section>
  );
}

/* ---------- Side panel ---------- */

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 text-[10px] uppercase tracking-[0.18em] text-muted">{children}</h3>;
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

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-bg px-1 font-sans text-[10px] font-semibold text-fg">
      {children}
    </kbd>
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

type EdgeKind = "main" | "return" | "add" | "dashed";

/** An arrow. `main` and `return` belong to the base graph; `add` and `dashed`
 *  (a softer, feedback-style link) to later frames. */
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

function Arrowhead({ id, className }: { id: string; className: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,1 L8,4 L0,7 Z" className={className} />
    </marker>
  );
}

function Diagram({ frame, viewBox }: { frame: number; viewBox: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // From frame 6 the planning skills take the middle band, so the delivery row moves down.
  const dy = frame >= 7 ? 260 : frame >= 6 ? 216 : 0;
  const lower = dy ? `translate(0, ${dy})` : undefined;
  // From frame 4 the risk check decides who merges, so the MR is no longer "for human review".
  const fastTrack = frame >= 4;
  const layer = (n: number) => ({ n, frame, id });

  return (
    <svg viewBox={viewBox} role="img" aria-labelledby={`${id}-title ${id}-desc`} className="block h-auto w-full min-w-[640px]">
      <title id={`${id}-title`}>Ignis layered architecture</title>
      <desc id={`${id}-desc`}>
        Unified Ignis graph starting with Jira ticket implementation, then adding one capability
        per frame: the product brain and backlog ideas, live data sources, the R&amp;D fast track,
        3rd-party services, planning skills with profession gates, and the parallel Ignis tracks.
      </desc>
      <defs>
        <Arrowhead id={`${id}-main`} className="fill-muted" />
        <Arrowhead id={`${id}-return`} className="fill-accent" />
        <Arrowhead id={`${id}-prior`} className="fill-muted/50" />
        <Arrowhead id={`${id}-new`} className="fill-green-600 dark:fill-green-500" />
      </defs>

      {/* 1 · Base graph: implement a Jira ticket */}
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

      {/* 2 · Self-updating product brain, backlog ideas and docs automation */}
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
          role={["backlog snapshot", 94]}
          sub={["title · rationale · copy", 112]}
        />
        <Edge kind="add" d={ln(316, 87, 382, 87)} />
        <Edge kind="add" d={ln(604, 87, 670, 87)} />

        {/* Controller → the PM / Engineer already on the graph */}
        <Edge kind="add" d="M 782 126 L 782 186 L 200 186 L 200 254" />
        <Label x={492} y={176} anchor="middle">PM reviews &amp; takes to Jira (no auto-create)</Label>

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

      {/* 3 · Live data sources feeding the product brain */}
      <Layer {...layer(3)}>
        <Node kind="add" x={24} y={-76} w={168} h={72} title={["Philippe", -49]} role={["DAU & metrics", -31]} sub={["product usage data", -15]} />
        <Node
          kind="add"
          x={208}
          y={-76}
          w={236}
          h={72}
          title={["Store ratings & reviews", -49]}
          role={["ratings · reviews · comments", -31]}
          sub={["user feedback signals", -15]}
        />
        <Edge kind="add" d={ln(144, -4, 144, 46)} />
        <Edge kind="add" d={ln(256, -4, 256, 46)} />
        <Label x={270} y={25}>feeds product brain</Label>
      </Layer>

      {/* 4 · R&D fast track: risk checked in planning, both paths end in Release */}
      <Layer {...layer(4)}>
        <Node
          kind="add"
          x={140}
          y={364}
          w={216}
          h={70}
          title={["Feature planning", 389]}
          role={["risk check (before PR)", 407]}
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

      {/* 6 · Planning skills (Design, Analytics, Marketing), each with a human gate */}
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

      {/* 7 · Parallel R&D tracks inside Ignis itself */}
      <Layer {...layer(7)}>
        <Node
          kind="add"
          x={484}
          y={502}
          w={200}
          h={70}
          title={["Dynamic agent skills", 527]}
          role={["add / change skills per agent", 545]}
          sub={["configurable during dev", 561]}
        />
        <Edge kind="add" d={ln(584, 502, 584, 344)} />

        <Node
          kind="add"
          x={484}
          y={612}
          w={204}
          h={70}
          title={["Continuous Eval", 637]}
          role={["measures Ignis results", 655]}
          sub={["ongoing quality & pass rates", 671]}
        />
        <Edge kind="add" d={ln(536, 736, 536, 684)} />
        <Edge kind="add" d="M 736 736 L 736 647 L 690 647" />

        <Node
          kind="add"
          x={664}
          y={852}
          w={240}
          h={72}
          title={["Code-writing learning", 878]}
          role={["MR changes & product comments", 896]}
          sub={["continuously sharpens coding", 912]}
        />
        <Edge kind="add" d={ln(804, 808, 804, 850)} />
        <Label x={814} y={834}>MR changes</Label>
        <Edge kind="add" d={ln(608, 888, 662, 888)} />
        <Label x={635} y={878} anchor="middle">comments</Label>
        <Edge kind="dashed" d="M 904 888 L 968 888 L 968 330" />
        <Label x={976} y={610}>improves</Label>
        <Label x={976} y={625}>code writing</Label>

        <Node
          kind="add"
          x={700}
          y={502}
          w={202}
          h={70}
          title={["Alt coding harnesses", 527]}
          role={["GitLab Actions · OpenCode", 545]}
          sub={["evaluated alongside Newton", 561]}
        />
        <Edge kind="dashed" d={ln(808, 292, 808, 500)} />
        <Edge kind="dashed" d={ln(868, 572, 868, 734)} />
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
