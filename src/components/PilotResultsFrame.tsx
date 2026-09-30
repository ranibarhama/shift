"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Embeds the standalone Pilot results microsite under the Shift header.
 * The microsite reports its content height via postMessage so the iframe
 * grows to fit (single page scroll, no nested scrollbar), and follows the
 * site's light/dark theme (passed in `src` and re-synced by ThemeToggle).
 */
export default function PilotResultsFrame({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2400);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data as { type?: string; height?: number } | null;
      if (d && d.type === "pilot-height" && typeof d.height === "number") {
        setHeight(Math.max(600, Math.ceil(d.height)));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      data-theme-sync
      title="Pilot results"
      scrolling="no"
      className="w-full border-0 bg-transparent"
      style={{ height, display: "block" }}
    />
  );
}
