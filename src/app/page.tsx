import Link from "next/link";
import { ROLES, ROLE_COLOR_HEX } from "@/lib/roles";
import { TAGS } from "@/lib/tags";
import { TrashIcon, BotIcon, MergeIcon, BrainIcon } from "@/components/DecisionIcons";
import ThemeToggle from "@/components/ThemeToggle";
import DecideTooltip from "@/components/DecideTooltip";
import { getCurrentTheme } from "@/lib/theme";

export default async function Home() {
  const theme = await getCurrentTheme();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 pb-20 pt-16 sm:pt-24">
      <div className="absolute right-6 top-6">
        <ThemeToggle initial={theme} />
      </div>
      {/* Hero */}
      <div className="mb-14 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> B2C · AI Implementation Playbook
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          Map today. Define tomorrow.
          <br />
          <span className="text-accent">Decide where AI fits.</span>{" "}
          <span className="text-automate font-bold">Shift!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted">
          The B2C AI Implementation Playbook. Not just a snapshot of how we work today —
          it's where we define how we want to work next, and for every stage and task
          choose what to <span className="text-drop">drop</span>,{" "}
          <span className="text-automate">automate</span>,{" "}
          <span className="text-hybrid">make hybrid</span>, or{" "}
          <span className="text-own">own</span>.
        </p>
      </div>

      {/* Workshop CTA */}
      <section className="mb-14 w-full">
        <Link
          href="/workshop"
          className="group block overflow-hidden rounded-2xl border border-accent/40 bg-accent/10 p-5 transition hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-lg sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                Today's session
              </div>
              <div className="mt-1 text-lg font-semibold text-fg sm:text-xl">
                B2C AI Transition Workshop
              </div>
              <div className="mt-0.5 text-xs text-muted">
                11:00 → 15:00 · 30 min lunch around 12:30
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/60 bg-card px-3 py-1.5 text-xs font-medium text-accent transition group-hover:bg-accent group-hover:text-ink">
              Open agenda →
            </span>
          </div>
        </Link>
      </section>

      {/* How it works */}
      <section className="mb-16 w-full">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
            How it works
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Five steps, one playbook
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StepCard
            num="1"
            title="Map"
            desc="Capture today's process A-to-Z — stages, people, tasks, pain points."
          />
          <StepCard
            num="2"
            title="Define"
            desc="Set how we want to work tomorrow. End state first."
          />
          <StepCard
            num="3"
            title="Decide"
            desc="For every stage & task, pick: drop, automate, hybrid, or own."
          />
          <StepCard
            num="4"
            title="Build / Buy / get what's missing"
            desc="Spec the AI tools and process changes we don't have yet."
          />
          <StepCard
            num="5"
            title="Implement"
            desc="Roll out the new way of working, measure, iterate."
          />
        </ol>
      </section>

      {/* The four decisions */}
      <section className="mb-20 w-full">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
              The main Decision Point to Make
            </div>
            <DecideTooltip />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            For every stage & task, decide
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            You'll tag every task and pain point inside every stage with one of these four
            choices. The visualization color-codes them so you can see where the work goes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DecisionCard
            number="01"
            title="Drop it"
            desc="Outdated or no-longer-useful steps"
            hex={tagHex("drop")}
            icon={<TrashIcon size={14} strokeWidth={2.2} />}
          />
          <DecisionCard
            number="02"
            title="Automate it"
            desc="AI handles it end-to-end"
            hex={tagHex("automate")}
            icon={<BotIcon size={14} strokeWidth={2.2} />}
          />
          <DecisionCard
            number="03"
            title="Hybrid"
            desc="Human + AI together"
            hex={tagHex("hybrid")}
            icon={<MergeIcon size={14} strokeWidth={2.2} />}
          />
          <DecisionCard
            number="04"
            title="Own it"
            desc="Only humans can do this"
            hex={tagHex("own")}
            icon={<BrainIcon size={14} strokeWidth={2.2} />}
          />
        </div>
      </section>

      {/* Role picker */}
      <section className="w-full">
        <div className="mb-3 text-center text-xs uppercase tracking-wider text-muted">
          Pick your role to enter
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <form key={r.key} action="/api/session" method="post">
              <input type="hidden" name="role" value={r.key} />
              <button
                type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-card/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-card"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-ink"
                  style={{ background: ROLE_COLOR_HEX[r.key] }}
                >
                  {r.initials}
                </span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted">Sign in as</div>
                  <div className="text-lg font-medium text-fg">{r.label}</div>
                </div>
              </button>
            </form>
          ))}
        </div>
      </section>

      <p className="mt-12 text-xs text-muted">
        Prototype mode — no password. Pick a role to enter.{" "}
        <Link href="/overview" className="underline hover:text-fg">
          Public overview
        </Link>
      </p>
    </main>
  );
}

function tagHex(key: string) {
  return TAGS.find((t) => t.key === key)?.hex ?? "#7c5cff";
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <li className="relative flex flex-col rounded-2xl border border-line bg-card/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
          {num}
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted">Step {num}</span>
      </div>
      <div className="text-base font-semibold text-fg">{title}</div>
      <p className="mt-1 text-xs leading-snug text-muted">{desc}</p>
    </li>
  );
}

function DecisionCard({
  number,
  title,
  desc,
  hex,
  icon,
}: {
  number: string;
  title: string;
  desc: string;
  hex: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl border border-line bg-card/60 p-4"
      style={{ boxShadow: `inset 4px 0 0 0 ${hex}` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold"
          style={{ background: `${hex}22`, color: hex }}
          aria-hidden
        >
          {icon}
        </span>
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.15em]"
          style={{ color: hex }}
        >
          {number}
        </span>
      </div>
      <div className="text-base font-semibold uppercase tracking-wide text-fg">{title}</div>
      <p className="mt-1 text-xs leading-snug" style={{ color: hex }}>
        {desc}
      </p>
    </div>
  );
}

