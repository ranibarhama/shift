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
    slug: "architecture",
    title: "Architecture",
    summary: "Define each backlog item in detail and design how the systems, tools and data fit together.",
    ready: true,
  },
  {
    n: 4,
    slug: "tasks-resources",
    title: "Updated Backlog Tasks & Resources",
    summary: "The backlog, updated after the architecture work: the tasks, their owners and the resources each one needs.",
    ready: false,
  },
  {
    n: 5,
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
