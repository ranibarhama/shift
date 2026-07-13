import Link from "next/link";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "Pilot Kickoff · Shift",
};

type AgendaItem = {
  title: string;
  description: string;
  accent: string;
};

const AGENDA: AgendaItem[] = [
  {
    title: "Context and key learnings",
    description:
      "A fast recap of the last two months — how we mapped the way we work today and defined where AI can make the biggest impact.",
    accent: "#22d3ee",
  },
  {
    title: "Pilot scope and goals",
    description:
      "What we're testing, why we chose it, and what a successful first pilot looks like.",
    accent: "#3b82f6",
  },
  {
    title: "Tasks, owners, and dependencies",
    description:
      "The concrete work to get the pilot moving — who owns what, and what each piece depends on.",
    accent: "#a855f7",
  },
  {
    title: "Next steps",
    description:
      "How we run from here — timelines, check-ins, and the first moves right after this session.",
    accent: "#ef4444",
  },
];

export default function KickoffPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Topbar />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Hero */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Pilot kickoff · Tomorrow
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-[34px]">
            AI Pilot Kickoff
          </h1>
          <p className="mt-1.5 text-sm text-muted">B2C team · Similarweb</p>
        </header>

        {/* Welcome copy */}
        <section className="space-y-4 text-[15.5px] leading-relaxed text-fg/90">
          <p>
            Over the past two months, we have mapped how we work today and
            defined where AI can make the biggest impact.
          </p>
          <p className="text-lg font-semibold text-fg">
            Now it is time to test it.
          </p>
          <p>
            In this kickoff, we will give you context — share the work completed
            so far, present the pilot, assign owners, and align on the next steps
            to get it moving.
          </p>
        </section>

        {/* Management pull-quote */}
        <blockquote
          className="my-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-[15.5px] leading-relaxed text-fg"
          style={{ boxShadow: "inset 3px 0 0 0 rgb(124 92 255)" }}
        >
          This is an exciting milestone for the B2C team. We have already
          presented this vision to members of the management team, and we
          believe this pilot could help shape how{" "}
          <span className="font-semibold text-accent">Similarweb</span>{" "}
          implements AI across the organization.
        </blockquote>

        <p className="mb-10 text-[15.5px] leading-relaxed text-fg/90">
          Come ready to participate, challenge, and build.{" "}
          <span className="font-medium text-fg">It should be a lot of fun.</span>
        </p>

        {/* Agenda */}
        <section>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Agenda
          </div>
          <ol className="space-y-3">
            {AGENDA.map((item, idx) => (
              <li
                key={item.title}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-card/50 p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg sm:p-5"
                style={{ boxShadow: `inset 3px 0 0 0 ${item.accent}` }}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px] font-bold tabular-nums"
                  style={{ background: `${item.accent}1a`, color: item.accent }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold leading-tight text-fg">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-[13.5px] leading-snug text-muted">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Quick links */}
        <section className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickLink href="/pilot-board" label="Pilot Board" />
          <QuickLink href="/pilot-tracker" label="Pilot Tracker" />
          <QuickLink href="/blueprint" label="How good looks like" />
          <QuickLink href="/big-stones" label="Zoom out" />
        </section>
      </main>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-card/40 px-3 py-2 text-center text-xs text-muted transition hover:border-accent/40 hover:bg-card hover:text-fg"
    >
      {label}
    </Link>
  );
}
