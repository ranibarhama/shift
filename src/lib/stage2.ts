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
  /** One line on what the step is for (the Process so far diagram). */
  summary: string;
  /** false = planned, page is an empty placeholder for now. */
  ready: boolean;
};

export const STAGE2_STEPS: Stage2Step[] = [
  {
    n: 1,
    slug: "session-1",
    title: "Gaps and Connections",
    summary: "Map what we already built, what's missing and what needs connecting — stage by stage.",
    ready: true,
  },
  {
    n: 2,
    slug: "backlog",
    title: "Backlog",
    summary: "Everything missing or needing a connection in one list — and where it all connects.",
    ready: true,
  },
  {
    n: 3,
    slug: "detailed-definition",
    title: "Detailed definition",
    summary: "Define each backlog item: what it is, who owns it and what done looks like.",
    ready: false,
  },
  {
    n: 4,
    slug: "operational-principles",
    title: "Operational principles",
    summary: "Agree the principles we build and work by.",
    ready: false,
  },
  {
    n: 5,
    slug: "technical-architecture",
    title: "Technical architecture",
    summary: "Design how the systems, tools and data fit together.",
    ready: false,
  },
  {
    n: 6,
    slug: "work-plan",
    title: "Gantt and tracked work plan",
    summary: "Put the work on a timeline with owners, and track it.",
    ready: false,
  },
  {
    n: 7,
    slug: "operational-model",
    title: "Operational model",
    summary: "How we run it day to day: roles, rhythm and ownership.",
    ready: false,
  },
];

export const stage2Href = (s: Stage2Step) => `/stage-2/${s.slug}`;

export function stage2Step(slug: string): Stage2Step | null {
  return STAGE2_STEPS.find((s) => s.slug === slug) ?? null;
}
