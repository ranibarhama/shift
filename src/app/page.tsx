import Link from "next/link";
import { ROLES, ROLE_COLOR_HEX } from "@/lib/roles";
import { getCurrentRole } from "@/lib/session";
import { TAGS } from "@/lib/tags";
import { TrashIcon, BotIcon, MergeIcon, BrainIcon } from "@/components/DecisionIcons";

export default async function Home() {
  const signedIn = !!(await getCurrentRole());

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 pb-20 pt-16 sm:pt-24">
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
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
            The main Decision Point to Make
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
            icon={<TrashIcon size={44} />}
          />
          <DecisionCard
            number="02"
            title="Automate it"
            desc="AI handles it end-to-end"
            hex={tagHex("automate")}
            icon={<BotIcon size={44} />}
          />
          <DecisionCard
            number="03"
            title="Hybrid"
            desc="Human + AI together"
            hex={tagHex("hybrid")}
            icon={<MergeIcon size={44} />}
          />
          <DecisionCard
            number="04"
            title="Own it"
            desc="Only humans can do this"
            hex={tagHex("own")}
            icon={<BrainIcon size={44} />}
          />
        </div>
      </section>

      {/* Role picker */}
      <section className="w-full">
        <div className="mb-3 text-center text-xs uppercase tracking-wider text-muted">
          {signedIn ? "Switch role" : "Pick your role to enter"}
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
      className="group relative flex min-h-[260px] flex-col items-center overflow-hidden rounded-2xl border border-line bg-card p-6 pl-7 text-center shadow-card transition hover:-translate-y-0.5"
      style={{ boxShadow: `inset 4px 0 0 0 ${hex}` }}
    >
      <div
        className="absolute left-4 top-4 font-mono text-xs font-semibold tracking-[0.15em]"
        style={{ color: hex }}
      >
        {number}
      </div>
      <div
        className="mt-6 grid h-16 w-16 place-items-center"
        style={{ color: hex }}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-bold uppercase tracking-wide text-fg">{title}</h3>
      <p
        className="mt-2 text-xs font-medium leading-snug"
        style={{ color: hex }}
      >
        {desc}
      </p>
    </div>
  );
}

