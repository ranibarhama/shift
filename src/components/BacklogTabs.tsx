"use client";

import { useMemo, useState } from "react";
import BacklogTable from "./BacklogTable";
import ActionPlan from "./ActionPlan";
import type { MissingItemRow } from "@/lib/queries";

type Tab = "backlog" | "plan";

export default function BacklogTabs({ items }: { items: MissingItemRow[] }) {
  const [tab, setTab] = useState<Tab>("backlog");

  const planCounts = useMemo(() => {
    let quick = 0;
    let bets = 0;
    for (const i of items) {
      if (i.roi === "high" && i.horizon === "short") quick += 1;
      else if (i.roi === "high" && (i.horizon === "mid" || i.horizon === "long")) bets += 1;
    }
    return { quick, bets };
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      {/* Header + tab pills */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Todo Backlog</h1>
          <p className="mt-1 text-sm text-muted">
            Every &quot;What&apos;s missing&quot; item logged across the org. {items.length} total.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Backlog views"
          className="flex rounded-full border border-line bg-card/60 p-1"
        >
          <TabPill
            label="Backlog"
            badge={items.length}
            active={tab === "backlog"}
            onClick={() => setTab("backlog")}
          />
          <TabPill
            label="Action Plan"
            badge={`${planCounts.quick} quick · ${planCounts.bets} bets`}
            active={tab === "plan"}
            onClick={() => setTab("plan")}
          />
        </div>
      </div>

      {tab === "backlog" ? (
        // The existing BacklogTable renders its own outer container with its own h1
        // and summary chips, so we hide the wrapper's heading visually when this
        // tab is active by rendering it raw — it already includes a max-width.
        <div className="-mx-6 -mt-6">
          <BacklogTable items={items} />
        </div>
      ) : (
        <ActionPlan items={items} />
      )}
    </div>
  );
}

function TabPill({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge: string | number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-xs font-medium transition " +
        (active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-line/40 hover:text-fg")
      }
    >
      {label}
      <span
        className={
          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] " +
          (active ? "bg-accent/20 text-accent" : "bg-line/60 text-muted")
        }
      >
        {badge}
      </span>
    </button>
  );
}
