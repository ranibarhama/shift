"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { STAGE2_STEPS, stage2Href } from "@/lib/stage2";

/* -----------------------------------------------------------------------------
 * Present mode for Phase 2: the whole site goes full screen and ← → walk
 * through it in order — Process so far, then every step. A page with stops of
 * its own (Gaps and Connections walks its stages) takes the keys first, via
 * usePresentStops; once it has no stop left that way, the next page opens.
 * Full screen survives page changes (client-side navigation, same document).
 * -------------------------------------------------------------------------- */

const PAGES = ["/stage-2", ...STAGE2_STEPS.map(stage2Href)];
const NAV_EVENT = "shift:present-nav";

type Dir = 1 | -1;

/** The page we're stepping back into — it opens at its last stop, not its first. */
let enteringAtEnd: string | null = null;

/** True when this page was reached by stepping back (← from the next page). Consumes it. */
export function enteredAtEnd(): boolean {
  if (enteringAtEnd !== window.location.pathname) return false;
  enteringAtEnd = null;
  return true;
}

/* Present mode is its own state (module-level, so it survives page changes):
 * full screen is asked for on start, but if the browser refuses, the keys and
 * on-screen controls still work. Leaving full screen (Esc) ends present mode. */
let presenting = false;
let wentFullscreen = false;
let watching = false;
const listeners = new Set<() => void>();

function setPresenting(v: boolean) {
  presenting = v;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  if (!watching) {
    watching = true;
    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) wentFullscreen = true;
      else if (wentFullscreen) {
        wentFullscreen = false;
        setPresenting(false);
      }
    });
  }
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function startPresenting() {
  setPresenting(true);
  void document.documentElement.requestFullscreen?.().catch(() => {});
}

function stopPresenting() {
  setPresenting(false);
  if (document.fullscreenElement)
    void document.exitFullscreen?.().catch(() => {});
}

export function usePresenting(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => presenting,
    () => false,
  );
}

/** Walk a page's own stops in present mode. `step` returns true when it moved
 *  within the page; false hands over to the previous / next page. */
export function usePresentStops(step: (dir: Dir) => boolean) {
  const ref = useRef(step);
  useEffect(() => {
    ref.current = step;
  });
  useEffect(() => {
    const on = (e: Event) => {
      if (ref.current((e as CustomEvent<Dir>).detail)) e.preventDefault();
    };
    window.addEventListener(NAV_EVENT, on);
    return () => window.removeEventListener(NAV_EVENT, on);
  }, []);
}

/** True when a key press is aimed at a form field — don't hijack it for navigation. */
function isTyping(e: KeyboardEvent) {
  const t = e.target;
  return (
    t instanceof HTMLElement &&
    !!t.closest("input, textarea, select, [contenteditable='true']")
  );
}

/** Header button + on-screen controls. Rendered in the Phase 2 header on every page. */
export default function PresentMode() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const presenting = usePresenting();

  const go = useCallback(
    (dir: Dir) => {
      const ev = new CustomEvent<Dir>(NAV_EVENT, {
        detail: dir,
        cancelable: true,
      });
      if (!window.dispatchEvent(ev)) return; // the page took a step of its own
      const i = PAGES.indexOf(pathname);
      const next = i < 0 ? PAGES[0] : PAGES[i + dir];
      if (!next) return;
      enteringAtEnd = dir < 0 ? next : null;
      router.push(next);
    },
    [pathname, router],
  );

  useEffect(() => {
    if (!presenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        stopPresenting(); // in full screen the browser handles Esc; this covers the rest
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, go]);

  const navBtn =
    "grid h-7 w-7 place-items-center rounded-full border border-line text-sm text-fg transition hover:border-accent/50 hover:text-accent";

  return (
    <>
      <button
        type="button"
        onClick={presenting ? stopPresenting : startPresenting}
        title={
          presenting
            ? "Exit present mode (Esc)"
            : "Present full screen — ← → to move"
        }
        className={
          "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition " +
          (presenting
            ? "border border-line text-muted hover:bg-line/40 hover:text-fg"
            : "bg-accent text-ink hover:brightness-110")
        }
      >
        {presenting ? (
          "Exit ✕"
        ) : (
          <>
            <PlayIcon /> Present
          </>
        )}
      </button>

      {/* Portal: the header's backdrop blur would otherwise pin "fixed" to the header. */}
      {presenting &&
        createPortal(
          <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-card/90 px-2 py-1.5 shadow-card backdrop-blur">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className={navBtn}
            >
              ←
            </button>
            <span className="whitespace-nowrap px-1 text-[11px] text-muted">
              <Kbd>←</Kbd> <Kbd>→</Kbd> to move · <Kbd>Esc</Kbd> to exit
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className={navBtn}
            >
              →
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-bg px-1 font-sans text-[10px] font-semibold text-fg">
      {children}
    </kbd>
  );
}

function PlayIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}
