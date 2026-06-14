import Link from "next/link";
import Topbar from "@/components/Topbar";

export const metadata = {
  title: "Workshop agenda · Shift",
};

type AgendaItem = {
  start: string;
  end: string;
  duration: number;
  title: string;
  description: string;
  accent: string;
  isBreak?: boolean;
};

const AGENDA: AgendaItem[] = [
  {
    start: "11:00",
    end: "11:30",
    duration: 30,
    title: "B2C main workflow",
    description:
      "Walk the company through the main process end to end. Stage by stage, agree what's real, fix what's wrong, surface what's missing.",
    accent: "#22d3ee",
  },
  {
    start: "11:30",
    end: "12:30",
    duration: 60,
    title: "Director presentations",
    description:
      "Each director walks the room through their own workflow(s). Audience listens for two things: where it connects to the main process, and where it depends on someone else in the room.",
    accent: "#3b82f6",
  },
  {
    start: "12:30",
    end: "13:00",
    duration: 30,
    title: "Lunch",
    description: "Eat. Reset.",
    accent: "#64748b",
    isBreak: true,
  },
  {
    start: "13:00",
    end: "13:40",
    duration: 40,
    title: "Backlog review",
    description:
      "Each director presents their 3–4 top backlog items — the gaps they want the company to invest in. Quick discussion, no full scoring debate.",
    accent: "#a855f7",
  },
  {
    start: "13:40",
    end: "14:00",
    duration: 20,
    title: "How good looks like",
    description:
      "Walk the team through the target state — what the B2C org looks like once we've made the AI transition.",
    accent: "#ef4444",
  },
  {
    start: "14:00",
    end: "14:30",
    duration: 30,
    title: "Connect the backlog to the target",
    description:
      "For each top backlog item, the room agrees which part of the target it advances. Big stones emerge from the mapping.",
    accent: "#eab308",
  },
  {
    start: "14:30",
    end: "15:00",
    duration: 30,
    title: "Nominate leaders & next steps",
    description:
      "One leader per stage of the target. One clear next step per director. Close with commitments, not opinions.",
    accent: "#7c5cff",
  },
];

const WORKSHOP_IS = [
  "Aligning on how the current B2C process flows end to end.",
  "Surfacing the key gaps each department sees from its perspective.",
  "Reviewing the task backlog at a high level.",
  "Reviewing the list of items we may want to drop.",
  "Showing the team where we are heading and what “good” should look like.",
  "Zooming out from the backlog and connecting it to the broader vision.",
  "Leaving the session with a clear owner for each stage and agreed next steps.",
];

const WORKSHOP_IS_NOT = [
  "A full project plan or quarterly OKR exercise.",
  "A deep technical design for any single tool or platform.",
  "A place to debate budget or hiring — that's a separate conversation.",
  "The final word — this is the first pass. We iterate after.",
];

export default function WorkshopAgendaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* Hero */}
        <header className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
            Workshop · 4 hours
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            B2C AI Transition Workshop
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            11:00 → 15:00 · 30 min lunch around 12:30
          </p>
        </header>

        {/* What this workshop IS */}
        <section
          className="mb-5 overflow-hidden rounded-2xl border border-line bg-card/40 p-5"
          style={{ boxShadow: "inset 3px 0 0 0 rgb(124 92 255)" }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-accent">
              <CheckIcon />
            </span>
            <h2 className="text-base font-semibold text-fg">
              What this workshop is
            </h2>
          </div>
          <p className="text-sm leading-snug text-fg/85">
            A working session to create a{" "}
            <span className="font-semibold text-fg">first mapping</span> of where we
            are today and define a{" "}
            <span className="font-semibold text-fg">high-level action plan</span> we
            can take forward.
          </p>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            The session will focus on
          </div>
          <ul className="mt-2 space-y-2">
            {WORKSHOP_IS.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2.5 text-sm leading-snug text-fg"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What this workshop is NOT */}
        <section
          className="mb-10 overflow-hidden rounded-2xl border border-line bg-card/40 p-5"
          style={{ boxShadow: "inset 3px 0 0 0 #64748b" }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: "#64748b22", color: "#64748b" }}
            >
              <XIcon />
            </span>
            <h2 className="text-base font-semibold text-fg">
              What this workshop is not
            </h2>
          </div>
          <ul className="space-y-2">
            {WORKSHOP_IS_NOT.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2.5 text-sm leading-snug text-muted"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Agenda */}
        <section>
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Agenda
          </div>
          <ol className="space-y-3">
            {AGENDA.map((item, idx) => (
              <AgendaRow key={idx} item={item} index={idx + 1} />
            ))}
          </ol>
        </section>

        {/* Quick links to in-app destinations */}
        <section className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickLink href="/main" label="B2C main workflow" />
          <QuickLink href="/overview" label="Overview (A–Z)" />
          <QuickLink href="/backlog" label="Todo Backlog" />
          <QuickLink href="/blueprint" label="How good looks like" />
        </section>
      </main>
    </div>
  );
}

/* ---------- Components ---------- */

function AgendaRow({ item, index }: { item: AgendaItem; index: number }) {
  if (item.isBreak) {
    return (
      <li className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-line/60 bg-bg/30 p-4 sm:p-5">
        <div className="w-[100px] shrink-0">
          <div className="text-[15px] font-semibold tabular-nums text-fg">
            {item.start}
          </div>
          <div className="text-[10px] text-muted">→ {item.end}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted">
            {item.duration} min
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold leading-tight text-fg">
            {item.title}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">{item.description}</p>
        </div>
      </li>
    );
  }

  return (
    <li
      className="group flex items-start gap-4 rounded-2xl border border-line bg-card/50 p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg sm:p-5"
      style={{ boxShadow: `inset 3px 0 0 0 ${item.accent}` }}
    >
      {/* Time block */}
      <div className="w-[100px] shrink-0">
        <div className="text-[16px] font-bold tabular-nums text-fg">
          {item.start}
        </div>
        <div className="text-[10px] text-muted">→ {item.end}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">
          {item.duration} min
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold tabular-nums"
            style={{ background: `${item.accent}1a`, color: item.accent }}
          >
            {index}
          </span>
          <h3 className="text-[15px] font-semibold leading-tight text-fg">
            {item.title}
          </h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-muted">
          {item.description}
        </p>
      </div>
    </li>
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

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
