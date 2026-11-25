"use client";

import { useEffect } from "react";
import { enteredAtEnd, usePresentStops } from "./PresentMode";

/** A section counts as reached once its top is at or above this line (below the sticky header). */
const LINE = 100;

/**
 * Present mode for a long page: ← → walk its sections (by element id) before
 * moving on to the previous / next page. Renders nothing.
 */
export default function PresentSections({ ids }: { ids: string[] }) {
  usePresentStops((dir) => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const page = document.scrollingElement;
    if (!els.length || !page) return false;

    // The section we're in: the last one whose top has reached the line.
    let current = -1;
    els.forEach((el, i) => {
      if (el.getBoundingClientRect().top <= LINE) current = i;
    });

    if (dir > 0) {
      const atBottom = page.scrollTop + window.innerHeight >= page.scrollHeight - 4;
      const next = els[current + 1];
      if (atBottom || !next) return false;
      next.scrollIntoView({ block: "start", behavior: "smooth" });
      return true;
    }

    if (page.scrollTop <= 4) return false;
    // Scrolled well into the current section: go back to its start first.
    const here = els[current];
    const target = here && here.getBoundingClientRect().top < LINE - 60 ? here : els[current - 1];
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  });

  // Stepped back into from the next page: open at the end.
  useEffect(() => {
    if (!enteredAtEnd()) return;
    document.getElementById(ids[ids.length - 1])?.scrollIntoView({ block: "start" });
  }, [ids]);

  return null;
}
