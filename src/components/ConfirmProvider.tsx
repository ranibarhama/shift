"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If true, the primary button is styled in the drop/red palette. */
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Async drop-in replacement for window.confirm — renders an in-app toast
 * styled to match the rest of the app, with proper keyboard support.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ message: "Delete this?", danger: true })) { ... }
 */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) {
    // Defensive fallback: if a caller is rendered outside the provider,
    // fall through to the native dialog so destructive actions never silently
    // execute without confirmation.
    return async (opts) => window.confirm(opts.message);
  }
  return fn;
}

type State = {
  opts: ConfirmOptions;
  resolve: (ok: boolean) => void;
} | null;

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({ opts, resolve });
    });
  }, []);

  const close = useCallback((ok: boolean) => {
    setState((s) => {
      s?.resolve(ok);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    // Focus the confirm button so Enter confirms by default
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        // Don't intercept Enter inside form fields elsewhere — but the toast
        // itself owns focus once visible, so this is safe.
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <>
          {/* Click-outside catcher */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => close(false)}
            className="fixed inset-0 z-[55] cursor-default bg-transparent"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={state.opts.title ?? "Confirm action"}
            className="pointer-events-auto fixed bottom-6 right-6 z-[60] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-card p-4 shadow-2xl backdrop-blur"
            style={{
              boxShadow: state.opts.danger
                ? "0 0 0 1px rgb(239 68 68 / 0.4), 0 25px 50px -12px rgb(0 0 0 / 0.5)"
                : "0 0 0 1px rgb(124 92 255 / 0.35), 0 25px 50px -12px rgb(0 0 0 / 0.5)",
            }}
          >
            {state.opts.title && (
              <div className="mb-1 text-sm font-semibold text-fg">{state.opts.title}</div>
            )}
            <div className="text-sm text-fg/90">{state.opts.message}</div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-line/40 hover:text-fg"
              >
                {state.opts.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => close(true)}
                className={
                  state.opts.danger
                    ? "rounded-md bg-drop px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:brightness-110"
                    : "rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:brightness-110"
                }
              >
                {state.opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
}
