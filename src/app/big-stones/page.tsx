import Link from "next/link";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { getCurrentRole } from "@/lib/session";
import { getAllMissingItems } from "@/lib/queries";
import { analyzeBacklog, type StoneAnalysis } from "@/lib/bigStones";

export const metadata = {
  title: "Big Stones · Shift",
};
export const dynamic = "force-dynamic";

export default async function BigStonesPage() {
  const role = await getCurrentRole();
  if (role !== "product") redirect("/");

  const items = await getAllMissingItems();
  const analysis = analyzeBacklog(items);
  const stonesWithMass = analysis.stones.filter((sa) => sa.itemCount > 0).length;
  const totalScore = analysis.stones.reduce((s, sa) => s + sa.totalScore, 0);
  const concentrations = [...analysis.stones]
    .filter((s) => s.itemCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        {/* Hero */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Backlog · zoomed out
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            Big Stones
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Six strategic moves rolled up from every gap on the backlog. Each stone is
            connected to the part of{" "}
            <Link href="/blueprint" className="text-accent hover:underline">
              How good looks like
            </Link>{" "}
            it pushes the company toward.
          </p>
        </header>

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

        {/* Concentrations of pain — top 3 */}
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

        {/* 6 big-stone cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {analysis.stones.map((sa) => (
            <StoneCard
              key={sa.stone.key}
              sa={sa}
              mappedItems={analysis.mappedItems}
            />
          ))}
        </section>

        {/* Needs alignment */}
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
              These items don&apos;t obviously belong to any of the six stones. Review
              them in the backlog and reword, or let the workshop assign them.
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
      </main>
    </div>
  );
}

/* ===== UI bits ============================================================ */

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

      {/* Connects to */}
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

      {/* Mass metrics */}
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

      {/* Top items */}
      {sa.topItems.length > 0 && (
        <>
          <div className="mx-5 border-t border-line/50" />
          <div className="px-5 py-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Top items in this stone
            </div>
            <ul className="space-y-2.5">
              {sa.topItems.map(({ item, score }) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5"
                >
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

      {/* Empty state */}
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
