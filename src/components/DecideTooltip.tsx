"use client";

import { useEffect, useRef, useState } from "react";

const PROMPTS = [
  { n: "01", q: "Where are you losing time?", a: "What takes way longer than it should?" },
  { n: "02", q: "What feels repetitive?", a: "Work you do manually that could be systematic." },
  { n: "03", q: "What blocks the next person?", a: "Hand-offs and dependencies that slow others down." },
  { n: "04", q: "What's the worst-ROI work?", a: "Time-consuming tasks with low real impact." },
] as const;

export default function DecideTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close decision prompts" : "Show decision prompts"}
        title="Prompts to help you decide"
        className={
          "grid h-7 w-7 place-items-center rounded-full border shadow-sm backdrop-blur transition " +
          (open
            ? "border-accent bg-accent/15 text-accent"
            : "border-line bg-card/90 text-muted hover:border-accent/60 hover:text-accent")
        }
      >
        <LampIcon />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Decision prompts"
          className="absolute left-1/2 top-full z-30 mt-2 w-80 -translate-x-1/2 rounded-xl border border-line bg-card/95 p-4 text-left shadow-card backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg">
              Use this to decide
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-fg"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2.5">
            {PROMPTS.map((p) => (
              <li key={p.n} className="flex gap-2">
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.15em] text-drop"
                  aria-hidden
                >
                  {p.n}
                </span>
                <div>
                  <div className="text-sm font-semibold text-fg">{p.q}</div>
                  <div className="text-xs text-muted">{p.a}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LampIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  );
}
