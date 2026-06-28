"use client";

import { useCallback, useState } from "react";

export type ToastKind = "error" | "info";
export type ToastMsg = {
  id: string;
  text: string;
  kind: ToastKind;
};

/**
 * Lightweight in-page toaster. Pages call useToasts() to get a pushToast
 * function and the list to render at the bottom-right via <ToastContainer />.
 * Each toast auto-dismisses after 6s; the user can also click X to dismiss.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (text: string, kind: ToastKind = "info") => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((arr) => [...arr, { id, text, kind }]);
      window.setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast]
  );

  return { toasts, pushToast, dismissToast };
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={
            "pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-2.5 rounded-lg border bg-card px-4 py-3 shadow-card " +
            (t.kind === "error" ? "border-drop/60" : "border-line")
          }
        >
          <span
            className={
              "mt-0.5 shrink-0 " +
              (t.kind === "error" ? "text-drop" : "text-accent")
            }
            aria-hidden
          >
            {t.kind === "error" ? <WarnIcon /> : <InfoIcon />}
          </span>
          <div className="flex-1 text-[12.5px] leading-snug text-fg">{t.text}</div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition hover:bg-line/40 hover:text-fg"
            aria-label="Dismiss"
          >
            <CrossIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

function WarnIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
