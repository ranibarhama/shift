"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  canEdit?: boolean;
};

export default function CanvasTip({ canEdit = true }: Props) {
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
    <div
      ref={ref}
      className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-col items-end gap-2"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close tips" : "Show tips"}
        title="Tips"
        className={
          "grid h-9 w-9 place-items-center rounded-full border shadow-card backdrop-blur transition " +
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
          aria-label="Canvas tips"
          className="w-72 origin-top-right rounded-xl border border-line bg-card/95 p-3 text-xs shadow-card backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg">Tips</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-fg"
              aria-label="Close tips"
            >
              ✕
            </button>
          </div>

          <ul className="space-y-1.5 text-muted">
            <li className="flex gap-2">
              <span className="text-accent">•</span>
              <span>
                <span className="text-fg">Click</span> a stage to open its details on the right.
              </span>
            </li>
            {canEdit && (
              <>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    <span className="text-fg">Drag</span> from a node's right handle to draw an arrow into the next stage.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    <span className="text-fg">Click an edge</span> to remove the connection.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    <span className="text-fg">Drag a stage</span> to reposition. Position auto-saves.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>
                    Inside a stage, tag each <span className="text-drop">item</span> as Drop /
                    Automate / Hybrid / Own.
                  </span>
                </li>
              </>
            )}
            {!canEdit && (
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>This view is read-only — switch to the relevant role to edit.</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function LampIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v.3h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  );
}
