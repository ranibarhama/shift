import Link from "next/link";
import { IGNIS_FRAMES } from "@/lib/ignisFrames";
import {
  BODIES,
  CENTRAL_CAPABILITIES,
  COMPANY_FIT,
  DAILY_FLOW,
  DECISIONS,
  DOMAINS,
  FUNNEL_FLOW,
  GUARDRAILS,
  LAYER_OWNERS,
  PODS,
  PRINCIPLES,
  RHYTHM,
  ROUTES,
  body,
  type Body,
  type BodyKey,
  type FlowStep,
} from "@/lib/operatingModel";
import PresentSections from "./PresentSections";

/* Phase 2 · 5 · Operational model — the proposal. Static: all content is in
 * src/lib/operatingModel.ts. Color marks the four bodies (borders, dots, tints);
 * text stays in ink. */

const SECTIONS = [
  { id: "principles", label: "Principles" },
  { id: "model", label: "The model" },
  { id: "ownership", label: "Who owns what" },
  { id: "flows", label: "How work flows" },
  { id: "layers", label: "Architecture by owner" },
  { id: "rhythm", label: "Rhythm" },
  { id: "company", label: "Company fit" },
  { id: "decisions", label: "Open decisions" },
] as const;

const link = "font-semibold text-fg underline-offset-4 hover:underline";

/** Width of the diagram's left column: the row labels of the matrix, and the funnel under them. */
const LABEL_COL = 220;

export default function OperatingModel() {
  return (
    <div className="space-y-14">
      <PresentSections ids={SECTIONS.map((s) => s.id)} />

      <nav
        aria-label="On this page"
        className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-card/40 p-2"
      >
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-muted transition hover:border-fg/30 hover:text-fg"
          >
            <span className="tabular-nums font-normal">{i + 1}</span>
            {s.label}
          </a>
        ))}
      </nav>

      <Principles />
      <Model />
      <Ownership />
      <Flows />
      <Layers />
      <Rhythm />
      <CompanyFit />
      <Decisions />
    </div>
  );
}

/* ---------- 1 · Principles ---------- */

function Principles() {
  return (
    <Section id="principles" eyebrow="Operating principles" title="Six principles for how we run it">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className="rounded-2xl border border-line bg-card/60 p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-automate/15 text-[13px] font-semibold tabular-nums text-fg">
                {i + 1}
              </span>
              <h3 className="pt-0.5 text-[15px] font-semibold leading-snug text-fg">{p.title}</h3>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{p.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- 2 · The model ---------- */

function Model() {
  const steering = body("steering");
  const central = body("central");
  const pods = body("pods");
  const domains = body("domains");
  // Rows of the matrix: the pods' header, the domains' header, then one per domain.
  const rows = 2 + DOMAINS.length;

  return (
    <Section
      id="model"
      eyebrow="Operating model"
      title="One central AI team, product pods, shared domains"
      sub="The pods run down, one per product. The domains run across, one per profession. The central AI team is the platform under all of them."
    >
      <div className="overflow-x-auto rounded-2xl border border-line bg-card/40 p-4 sm:p-5">
        <div className="min-w-[920px]">
          {/* Steering */}
          <div
            className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
            style={{ borderColor: `${steering.hex}80`, background: `${steering.hex}14` }}
          >
            <div>
              <Overline hex={steering.hex}>
                {steering.name} · {steering.role}
              </Overline>
              <div className="mt-1 text-[13px] font-medium text-fg">{steering.who}</div>
            </div>
            <Outside>The company&apos;s AI Council</Outside>
          </div>

          <Exchange down="priorities · budget · scale or stop" up="results · adoption · requests" />

          {/* The matrix: pods (lanes) × domains (lines) */}
          <div
            className="grid gap-x-2.5 rounded-xl border border-line bg-bg/50 p-3"
            style={{
              gridTemplateColumns: `${LABEL_COL}px repeat(${PODS.length}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, auto)`,
            }}
          >
            {/* Lanes sit behind everything, one per pod, top to bottom. */}
            {PODS.map((p, i) => (
              <div
                key={p.name}
                aria-hidden
                className={"rounded-xl border " + (p.next ? "border-dashed" : "")}
                style={{
                  gridColumn: i + 2,
                  gridRow: "1 / -1",
                  borderColor: p.next ? `${pods.hex}66` : `${pods.hex}80`,
                  background: p.next ? "transparent" : `${pods.hex}12`,
                }}
              />
            ))}

            <div className="pb-3 pr-3" style={{ gridColumn: 1, gridRow: 1 }}>
              <Overline hex={pods.hex}>{pods.name}</Overline>
              <p className="mt-1 text-[11.5px] leading-snug text-muted">
                {pods.role}. One pod per product, with needs of its own.
              </p>
            </div>
            {PODS.map((p, i) => (
              <div
                key={p.name}
                className="relative px-3 pb-3 pt-2.5"
                style={{ gridColumn: i + 2, gridRow: 1 }}
              >
                <div className="text-[13px] font-semibold text-fg">
                  {p.next ? "+ " : ""}
                  {p.name}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-muted">
                  {p.next ? "Onboarded by the central AI team" : "PM owner · engineers · AI builder"}
                </div>
                {!p.next && (
                  <div className="mt-1.5 inline-flex rounded-full border border-line bg-card px-2 py-0.5 text-[10.5px] font-medium text-fg">
                    Its own product brain
                  </div>
                )}
              </div>
            ))}

            <div className="pb-1.5 pr-3 pt-2" style={{ gridColumn: 1, gridRow: 2 }}>
              <Overline hex={domains.hex}>{domains.name}</Overline>
              <p className="mt-1 text-[11.5px] leading-snug text-muted">
                {domains.role}: one standard per profession, in every pod.
              </p>
            </div>

            {DOMAINS.map((d, r) => (
              <DomainRow key={d.key} name={d.name} brings={d.brings} row={r + 3} hex={domains.hex} />
            ))}
          </div>

          <Exchange
            up="platform · standards · guardrails · enablement"
            down="requests · feedback · results"
          />

          {/* Funnel + central AI team */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: `${LABEL_COL}px minmax(0, 1fr)` }}>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-bg/50 px-3 py-3">
              <div>
                <Overline>One funnel</Overline>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  Open intake · scored by impact · routed
                </p>
              </div>
              <span aria-hidden className="ml-auto text-lg text-muted">
                →
              </span>
            </div>
            <div
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: `${central.hex}80`, background: `${central.hex}14` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Overline hex={central.hex}>
                  {central.name} · builds once, serves every pod
                </Overline>
                <Outside>The company&apos;s central AI team</Outside>
              </div>
              <ul className="mt-2.5 grid grid-cols-3 gap-2">
                {CENTRAL_CAPABILITIES.map((c) => (
                  <li key={c.name} className="rounded-lg border border-line bg-card px-3 py-2">
                    <div className="text-[12.5px] font-semibold text-fg">{c.name}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-muted">{c.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Note title="Why this shape">
          A pod knows its product, so it owns the outcome. A domain owner knows the profession, so
          they own the standard. Neither should build infrastructure, so the central AI team
          builds it once. A new pod gets the whole platform on its first day.
        </Note>
        <Note title="The Organization brain gets an owner">
          In{" "}
          <Link href="/stage-2/session-1" className={link}>
            step 1
          </Link>{" "}
          it was the one building block with no owner. Here the central AI team owns how the brain
          is built and fed, and each pod owns the brain of its own product.
        </Note>
      </div>
    </Section>
  );
}

/** One domain: a label, then a line across every pod with a point in each lane. */
function DomainRow({
  name,
  brings,
  row,
  hex,
}: {
  name: string;
  brings: string;
  row: number;
  hex: string;
}) {
  return (
    <>
      <div className="py-1.5 pr-3" style={{ gridColumn: 1, gridRow: row }}>
        <div className="text-[12.5px] font-semibold leading-tight text-fg">{name}</div>
        <div className="text-[11px] leading-snug text-muted">{brings}</div>
      </div>
      <div
        aria-hidden
        className="relative grid items-center gap-x-2.5"
        style={{
          gridColumn: "2 / -1",
          gridRow: row,
          gridTemplateColumns: `repeat(${PODS.length}, minmax(0, 1fr))`,
        }}
      >
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" style={{ background: hex }} />
        {PODS.map((p) => (
          <span
            key={p.name}
            className="relative mx-auto h-3 w-3 rounded-full border-2 bg-card"
            style={{ borderColor: hex, opacity: p.next ? 0.45 : 1 }}
          />
        ))}
      </div>
    </>
  );
}

/** What passes between two levels of the model. */
function Exchange({ down, up }: { down: string; up: string }) {
  return (
    <div className="flex items-center justify-center gap-10 py-2 text-[11px] text-muted">
      <span>
        <span aria-hidden className="mr-1.5 text-sm text-fg">
          ↓
        </span>
        {down}
      </span>
      <span>
        <span aria-hidden className="mr-1.5 text-sm text-fg">
          ↑
        </span>
        {up}
      </span>
    </div>
  );
}

/** A body outside B2C that this level answers to. */
function Outside({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line bg-bg/60 px-2.5 py-1 text-[11px] text-muted">
      <span aria-hidden>↔</span>
      {children}
    </span>
  );
}

/* ---------- 3 · Who owns what ---------- */

const RR_ROWS: { key: "owns" | "decides" | "accountable" | "not"; label: string }[] = [
  { key: "owns", label: "Owns" },
  { key: "decides", label: "Decides" },
  { key: "accountable", label: "Accountable for" },
  { key: "not", label: "Does not" },
];

function Ownership() {
  return (
    <Section
      id="ownership"
      eyebrow="R&R and governance"
      title="Who owns what, who decides, and what each one leaves alone"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(5,auto)]">
        {BODIES.map((b) => (
          <BodyCard key={b.key} body={b} />
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Built-in governance
      </h3>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {GUARDRAILS.map((g) => (
          <li key={g.title} className="rounded-2xl border border-line bg-card/40 p-3.5">
            <div className="text-[13px] font-semibold text-fg">{g.title}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{g.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function BodyCard({ body: b }: { body: Body }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-line bg-card/60 shadow-card lg:row-span-5 lg:grid lg:grid-rows-subgrid"
      style={{ boxShadow: `inset 0 3px 0 0 ${b.hex}` }}
    >
      <header className="px-4 pb-3 pt-4">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          <Dot hex={b.hex} />
          {b.name}
        </h3>
        <div className="mt-0.5 text-[12px] font-medium text-fg">{b.role}</div>
        <p className="mt-1 text-[11.5px] leading-snug text-muted">{b.who}</p>
      </header>
      {RR_ROWS.map((row) => (
        <div
          key={row.key}
          className={"border-t border-line px-4 py-3 " + (row.key === "not" ? "bg-line/25" : "")}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {row.label}
          </div>
          <ul className="mt-1.5 space-y-1">
            {b[row.key].map((item) => (
              <li key={item} className="flex gap-2 text-[12.5px] leading-snug text-fg">
                <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

/* ---------- 4 · How work flows ---------- */

function Flows() {
  return (
    <Section
      id="flows"
      eyebrow="How work flows"
      title="Two flows: the daily one inside a pod, and the funnel for new capabilities"
    >
      <FlowBlock
        label="Every day, inside a pod"
        title="A product change, from signal to release"
        note={
          <>
            This is the{" "}
            <Link href="/stage-2/architecture" className={link}>
              architecture from step 3
            </Link>
            , read as who acts where. The pod runs it; nobody waits for the central team.
          </>
        }
        steps={DAILY_FLOW}
      />

      <div className="mt-8">
        <FlowBlock
          label="The funnel"
          title="A new capability, from request to measured impact"
          note="This is how the platform grows. The central AI team owns the funnel; the backlog from steps 2 and 4 is its first intake."
          steps={FUNNEL_FLOW}
        />
      </div>

      <h3 className="mb-3 mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        The routing decision
      </h3>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTES.map((r) => (
          <li key={r.name} className="rounded-2xl border border-line bg-card/40 p-3.5">
            <div className="text-[13px] font-semibold text-fg">{r.name}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{r.when}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-fg">{r.then}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <Note title="From a pod to the platform">
          What one pod builds and a second pod needs is promoted to the platform, and the central
          AI team takes over its upkeep. It has already happened once: the ticket format from the
          pilot became the Skill that Ignis tickets are written with.
        </Note>
      </div>
    </Section>
  );
}

function FlowBlock({
  label,
  title,
  note,
  steps,
}: {
  label: string;
  title: string;
  note: React.ReactNode;
  steps: FlowStep[];
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</div>
      <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-fg">{title}</h3>
      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted">{note}</p>
      <ol className="mt-4 flex flex-col items-stretch lg:flex-row">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col lg:min-w-0 lg:flex-1 lg:flex-row">
            <div className="flex h-full w-full flex-col rounded-2xl border border-line bg-card/60 p-3.5 shadow-card">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line bg-bg text-[11px] font-semibold tabular-nums text-fg">
                  {i + 1}
                </span>
                <span className="text-[13.5px] font-semibold leading-tight text-fg">{s.title}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">{s.text}</p>
              <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3">
                {s.who.map((k) => (
                  <Who key={k} k={k} />
                ))}
              </div>
            </div>
            {i < steps.length - 1 && <FlowArrow />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Who({ k }: { k: BodyKey }) {
  const b = body(k);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-fg">
      <Dot hex={b.hex} />
      {b.name}
    </span>
  );
}

/** Same arrow as the Process so far diagram. */
function FlowArrow() {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center py-1.5 text-[#f97316] lg:px-1 lg:py-0"
    >
      <svg
        className="h-5 w-5 rotate-90 lg:rotate-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </div>
  );
}

/* ---------- 5 · The architecture, by owner ---------- */

function Layers() {
  const cols: { key: "central" | "pods" | "domains"; b: Body }[] = [
    { key: "central", b: body("central") },
    { key: "pods", b: body("pods") },
    { key: "domains", b: body("domains") },
  ];
  return (
    <Section
      id="layers"
      eyebrow="The architecture, by owner"
      title="Who builds and who owns each layer"
      sub={
        <>
          The seven layers of{" "}
          <Link href="/stage-2/architecture" className={link}>
            3 · Architecture
          </Link>
          . The effort each one takes is in{" "}
          <Link href="/stage-2/tasks-resources" className={link}>
            4 · Updated Backlog Tasks &amp; Resources
          </Link>
          , and that is what sizes the central AI team.
        </>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-line bg-card/60 shadow-card">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="w-[24%] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Layer
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-4 py-3 text-[12.5px] font-semibold text-fg">
                  <span className="inline-flex items-center gap-2">
                    <Dot hex={c.b.hex} />
                    {c.b.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IGNIS_FRAMES.map((f, i) => (
              <tr key={f.name} className="border-b border-line/60 align-top last:border-b-0">
                <th scope="row" className="px-4 py-3 text-[13px] font-semibold text-fg">
                  <span className="mr-2 tabular-nums font-normal text-muted">{i + 1}</span>
                  {f.name}
                </th>
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-[12.5px] leading-relaxed text-fg">
                    {LAYER_OWNERS[i]?.[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ---------- 6 · Rhythm ---------- */

function Rhythm() {
  return (
    <Section id="rhythm" eyebrow="Rhythm" title="How it runs, from every day to every quarter">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RHYTHM.map((r) => (
          <li key={r.forum} className="rounded-2xl border border-line bg-card/60 p-4 shadow-card">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {r.when}
            </div>
            <h3 className="mt-1 text-[15px] font-semibold text-fg">{r.forum}</h3>
            <p className="mt-0.5 text-[12px] text-muted">{r.who}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-fg">{r.what}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- 7 · Company fit ---------- */

function CompanyFit() {
  return (
    <Section
      id="company"
      eyebrow="Company fit"
      title="A model inside the company's model"
      sub="The company's AI operating model has three levels: a council, a central AI delivery team and the functional teams. B2C differs from most functional teams: it has its own engineers and its own delivery engine, Ignis. So we run the same three levels one step down, and connect at each one."
    >
      <ul className="space-y-2.5">
        {COMPANY_FIT.map((c) => (
          <li
            key={c.oursLabel}
            className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 rounded-2xl border border-line bg-card/60 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,2fr)]"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-fg">
              {c.ours && <Dot hex={body(c.ours).hex} />}
              {c.oursLabel}
            </span>
            <span aria-hidden className="hidden text-muted md:inline">
              ↔
            </span>
            <span className="text-[13px] font-medium text-fg">{c.theirs}</span>
            <span className="text-[12.5px] leading-relaxed text-muted">{c.text}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- 8 · Open decisions ---------- */

function Decisions() {
  return (
    <Section
      id="decisions"
      eyebrow="Open decisions"
      title="What we still need to decide"
      sub="The model is a proposal. These five choices turn it into a plan."
    >
      <ol className="space-y-2.5">
        {DECISIONS.map((d, i) => (
          <li
            key={d.question}
            className="flex gap-3 rounded-2xl border border-line bg-card/60 px-4 py-3.5"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-bg text-xs font-semibold tabular-nums text-fg">
              {i + 1}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-fg">{d.question}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                <span className="font-semibold text-fg">Suggested: </span>
                {d.suggested}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- Shared pieces ---------- */

function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-automate">
        {eyebrow}
      </div>
      <h2
        id={`${id}-title`}
        className="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-[28px]"
      >
        {title}
      </h2>
      {sub && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Overline({ hex, children }: { hex?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg">
      {hex && <Dot hex={hex} />}
      {children}
    </div>
  );
}

function Dot({ hex }: { hex: string }) {
  return <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: hex }} />;
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card/40 px-4 py-3.5">
      <div className="text-[13px] font-semibold text-fg">{title}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}
