/**
 * Shift Phase 2 — the steps, in order. One list drives the Phase 2 header nav,
 * the Phase 2 page, the landing card and the placeholder pages for steps that
 * have no content yet. Client-safe (plain data).
 */

export type Stage2Step = {
  n: number;
  /** URL segment under /stage-2. */
  slug: string;
  title: string;
  /** false = planned, page is an empty placeholder for now. */
  ready: boolean;
};

export const STAGE2_STEPS: Stage2Step[] = [
  { n: 1, slug: "session-1", title: "Gaps and Connections", ready: true },
  { n: 2, slug: "backlog", title: "Backlog", ready: true },
  { n: 3, slug: "detailed-definition", title: "Detailed definition", ready: false },
  { n: 4, slug: "technical-architecture", title: "Technical architecture", ready: false },
  { n: 5, slug: "work-plan", title: "Gantt and tracked work plan", ready: false },
  { n: 6, slug: "operational-principles", title: "Operational principles", ready: false },
  { n: 7, slug: "operational-model", title: "Operational model", ready: false },
];

export const stage2Href = (s: Stage2Step) => `/stage-2/${s.slug}`;

export function stage2Step(slug: string): Stage2Step | null {
  return STAGE2_STEPS.find((s) => s.slug === slug) ?? null;
}
