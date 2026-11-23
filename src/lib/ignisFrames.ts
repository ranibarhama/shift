/**
 * The Ignis architecture, frame by frame (Phase 2 · 3 · Architecture). Each frame
 * adds one layer to the graph. The names are shared by the diagram and by the
 * task plan in step 4, which groups its tasks by the same layers. Client-safe.
 */

export type IgnisFrame = {
  name: string;
  /** Frames that add to the one before show as "+ name" on the frame picker. */
  plus?: boolean;
  title: string;
  /** The kind of task this frame unlocks. */
  unlock: string;
};

export const IGNIS_FRAMES: IgnisFrame[] = [
  {
    name: "Implement ticket",
    title: "Implement a Jira ticket",
    unlock: "Simple UI tasks — not business logic",
  },
  {
    name: "Self-updating product brain",
    plus: true,
    title: "Self-updating <product>-ignis-context & backlog ideas",
    unlock: "PM gets ideas from a self-updating system (learns from shipped tickets)",
  },
  {
    name: "Live data sources",
    plus: true,
    title: "Add Philippe & store ratings, reviews, comments to product brain",
    unlock: "Higher confidence on shipped tasks (Philippe & store reviews)",
  },
  {
    name: "R&D fast track",
    plus: true,
    title: "R&D fast track (risk checked in planning → PM vs R&D merge)",
    unlock: "Small tasks are shipped quicker (PM fast track)",
  },
  {
    name: "3rd-party agents (UGC)",
    plus: true,
    title: "3rd-party services (UGC → Release)",
    unlock: "3rd-party agents like UGC agent (provided by outside company)",
  },
  {
    name: "Planning skills & gates",
    plus: true,
    title: "Expand planning: Design, Analytics & Marketing skills + profession gates",
    unlock: "More complex features requiring Design, Marketing & Analytics",
  },
  {
    name: "Parallel in Ignis",
    title: "In parallel inside Ignis: dynamic skills, Eval, code learning & alt harnesses",
    unlock: "Support more complex features (dynamic skills, Eval, MR learning, alt harnesses)",
  },
];
