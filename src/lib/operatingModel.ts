/**
 * Phase 2 · 5 · Operational model — the proposal, as plain data. How we run the
 * architecture from step 3 day to day: one central AI team that builds the platform
 * once, product pods that own their outcomes, and domain owners who hold each
 * profession's bar in every pod. Reword freely; the page reads everything from here.
 * Client-safe (plain data).
 */

import { ROLES, type RoleKey } from "./taskPlan";

/* ---------- The four bodies ---------- */

export type BodyKey = "steering" | "central" | "pods" | "domains";

export type Body = {
  key: BodyKey;
  name: string;
  /** What it does, in two or three words. */
  role: string;
  /** Who sits in it. */
  who: string;
  /** What it does, in one plain sentence (the simple view). */
  brief: string;
  /** Identity color: borders, dots and tints only. Text stays in ink. */
  hex: string;
  owns: string[];
  decides: string[];
  accountable: string[];
  not: string[];
};

export const BODIES: Body[] = [
  {
    key: "steering",
    name: "B2C AI steering",
    role: "Sets direction",
    who: "The GM, the domain owners and the central AI team lead",
    brief: "Sets the priorities and the budget.",
    hex: "#6250d6",
    owns: ["Priorities across the pods", "The budget", "B2C's AI policy"],
    decides: [
      "Approve, scale or stop",
      "Which pod gets what first",
      "How much capacity the central team has",
    ],
    accountable: ["B2C's AI numbers: time saved, adoption and business outcomes"],
    not: ["Managing delivery", "Picking tools for the pods"],
  },
  {
    key: "central",
    name: "Central AI team",
    role: "Builds the platform",
    who: "AI platform lead, AI engineers, data engineer, AI product manager, AI ops and enablement",
    brief: "Builds the platform once, for every pod.",
    hex: "#2a78d6",
    owns: [
      "The Ignis platform",
      "The product-brain setup and the data feeds",
      "The skill framework and the guardrails",
      "The funnel",
    ],
    decides: [
      "The route of every request",
      "The platform roadmap",
      "What gets promoted from a pod to the platform",
    ],
    accountable: [
      "Shipping: funnel cycle time and platform reliability",
      "Quality (Eval) and cost per ticket",
    ],
    not: ["Adoption inside a pod", "Owning a pod's workflows", "Product decisions"],
  },
  {
    key: "pods",
    name: "Product pods",
    role: "Own outcomes",
    who: "A PM who owns the pod, engineers and an AI builder",
    brief: "Own their product and its results.",
    hex: "#199e70",
    owns: [
      "Their product's workflows",
      "Its product brain and backlog",
      "What they ship, with a primary and a backup maintainer",
    ],
    decides: [
      "What they send to the funnel first",
      "How AI fits into their daily work",
      "Merging low-risk changes",
    ],
    accountable: ["Adoption and measured results on their product's KPIs"],
    not: ["Building their own pipeline or infrastructure", "Working outside the guardrails"],
  },
  {
    key: "domains",
    name: "Domain owners",
    role: "Hold the bar",
    who: "The stakeholders of each profession: one owner per domain",
    brief: "Keep the standard the same in every pod.",
    hex: "#c98500",
    owns: [
      "Their profession's skill and gate in Ignis",
      "The quality standard, the same in every pod",
    ],
    decides: ["What needs a human review at their gate", "What good looks like in their domain"],
    accountable: ["Quality and consistency across the pods", "Gate turnaround time"],
    not: ["Setting a pod's priorities", "Reviewing everything: only what their gate flags"],
  },
];

export function body(key: BodyKey): Body {
  return BODIES.find((b) => b.key === key)!;
}

/* ---------- Operating principles ---------- */

export const PRINCIPLES: { title: string; text: string }[] = [
  {
    title: "Priorities from the top, ideas from everyone",
    text: "B2C leadership sets the priorities by expected impact. Anyone in a pod or a domain can put an idea into the funnel.",
  },
  {
    title: "One central AI team, one platform",
    text: "Ignis, the product brain, the data feeds and the skills are built once and serve every pod. The team's capacity is its own: it doesn't compete with any product's roadmap.",
  },
  {
    title: "Pods own their product",
    text: "Each pod owns its workflows, its product brain, adoption and its numbers. The platform serves the pod; it doesn't run it.",
  },
  {
    title: "Domain owners hold the bar",
    text: "Design, data, marketing, product, R&D and ops each own their skill and their gate, the same in every pod.",
  },
  {
    title: "One funnel, a named owner",
    text: "Every request takes the same path and is routed to a pod, the central team, a domain or a vendor. Nothing ships without an owner.",
  },
  {
    title: "Agents recommend, humans decide",
    text: "The risk check, the gates, Eval and cost tracking are part of the first build. Human review sits where the risk is.",
  },
];

/* ---------- The model: pods × domains ---------- */

/** Placeholder names: replace with the real products. `next` = a pod not onboarded yet. */
export const PODS: { name: string; short: string; next?: boolean }[] = [
  { name: "Product pod 1", short: "Pod 1" },
  { name: "Product pod 2", short: "Pod 2" },
  { name: "Product pod 3", short: "Pod 3" },
  { name: "Next pod", short: "Next", next: true },
];

/** The domains are the same six roles the effort template in step 4 uses. */
const DOMAIN_BRINGS: Record<RoleKey, string> = {
  product: "Planning standard · ticket Skill",
  design: "Design skill and gate",
  data: "Analytics skill and gate · Philippe",
  marketing: "Marketing skill and gate · UGC",
  rnd: "Risk check · high-risk review",
  ops: "Guardrails · ownership register",
};

const DOMAIN_ORDER: RoleKey[] = ["product", "design", "data", "marketing", "rnd", "ops"];

export const DOMAINS: { key: RoleKey; name: string; brings: string }[] = DOMAIN_ORDER.map((key) => ({
  key,
  name: ROLES.find((r) => r.key === key)!.label,
  brings: DOMAIN_BRINGS[key],
}));

export const CENTRAL_CAPABILITIES: { name: string; text: string }[] = [
  { name: "Ignis platform", text: "Runtime · pipeline · harnesses" },
  { name: "Product brain & data", text: "Brain setup · backlog agent · Philippe and store feeds" },
  { name: "Skill framework", text: "Shared skill library · gate tooling" },
  { name: "Eval, cost & guardrails", text: "Quality · pass rates · cost per ticket" },
  { name: "AI product & funnel", text: "Intake · scoring · specs · routing" },
  { name: "Enablement", text: "Trains the AI builders · onboards new pods" },
];

/* ---------- Built-in governance ---------- */

export const GUARDRAILS: { title: string; text: string }[] = [
  {
    title: "Risk check before build",
    text: "Every feature is tagged low or high risk in planning. Low risk: the PM merges. High risk: R&D reviews first.",
  },
  {
    title: "Profession gates",
    text: "Design, analytics and marketing check the plan before the ticket reaches Jira.",
  },
  {
    title: "Eval and cost",
    text: "Quality, pass rates and cost per ticket are measured all the time, per pod.",
  },
  {
    title: "Security and privacy",
    text: "The company's rules on data, tools and agents apply to every pod. The central team builds them into the platform.",
  },
  {
    title: "Ownership register",
    text: "Everything that ships is listed with its owner, its backup and its adoption number.",
  },
];

/* ---------- How work flows ---------- */

export type FlowStep = { title: string; text: string; who: BodyKey[] };

/** The daily flow inside a pod: the architecture from step 3, read as who acts where. */
export const DAILY_FLOW: FlowStep[] = [
  {
    title: "Signal",
    text: "The product brain, Philippe and store reviews surface ideas. The PM rates them.",
    who: ["pods"],
  },
  {
    title: "Plan",
    text: "The PM plans the feature. The design, analytics and marketing skills check it; a person approves at a gate when needed.",
    who: ["pods", "domains"],
  },
  {
    title: "Risk check",
    text: "The feature is tagged low or high risk before any code is written.",
    who: ["domains"],
  },
  {
    title: "Build",
    text: "Ignis picks up the Jira ticket. Newton opens a merge request and verification runs.",
    who: ["central"],
  },
  {
    title: "Merge and release",
    text: "Low risk: the PM merges. High risk: R&D reviews first.",
    who: ["pods", "domains"],
  },
  {
    title: "Learn",
    text: "Docs automation updates the product brain. The result is measured against the baseline.",
    who: ["pods", "central"],
  },
];

/** The funnel: how a new capability gets built. */
export const FUNNEL_FLOW: FlowStep[] = [
  {
    title: "Intake",
    text: "Anyone in a pod or a domain submits. The pod's AI builder sponsors it.",
    who: ["pods", "domains"],
  },
  {
    title: "Score and spec",
    text: "Scored on expected impact and effort. Accepted items get an MVP spec with one or two numbers that must move.",
    who: ["central"],
  },
  {
    title: "Route",
    text: "Pod, central, domain, buy, company or wait. The route decides who builds it.",
    who: ["central"],
  },
  {
    title: "Ship owned",
    text: "A named owner and a backup maintainer at launch. Guardrails are part of the build.",
    who: ["pods"],
  },
  {
    title: "Measure",
    text: "At 90 days: scale to more pods, fix or stop. Reported every month.",
    who: ["pods", "steering"],
  },
];

export const ROUTES: { name: string; when: string; then: string }[] = [
  {
    name: "Pod",
    when: "One product needs it.",
    then: "The pod's AI builder builds it on the platform.",
  },
  {
    name: "Central",
    when: "Two or more pods need it, or it changes the platform.",
    then: "The central AI team builds it once.",
  },
  {
    name: "Domain",
    when: "It is a profession's skill or gate.",
    then: "The domain owner defines it; the central team wires it in.",
  },
  {
    name: "Buy",
    when: "A vendor does it better, like the UGC agent.",
    then: "The domain owner owns the vendor; the central team connects it.",
  },
  {
    name: "Company",
    when: "It needs company systems or policy.",
    then: "It goes to the company's central AI team.",
  },
  {
    name: "Wait",
    when: "Not now.",
    then: "It stays in the backlog, with the reason.",
  },
];

/* ---------- The architecture, by owner ---------- */

/** One row per layer of the architecture, in the order of IGNIS_LAYERS. */
export const LAYER_OWNERS: { central: string; pods: string; domains: string }[] = [
  {
    central: "Builds and runs the pipeline.",
    pods: "Write tickets with the Skill; review and merge.",
    domains: "R&D: the verification standard and code review.",
  },
  {
    central: "Builds the brain setup, the backlog agent, the Ignis Controller and docs automation.",
    pods: "Own their product's brain. The PM rates the ideas.",
    domains: "Product: what a good idea and a good plan look like.",
  },
  {
    central: "Connects usage, A/B test and store signals into every product brain.",
    pods: "Use the signals to choose what to build, and to see what a change moved.",
    domains: "Data & Analytics: Philippe, the A/B tests and the metric definitions.",
  },
  {
    central: "Builds the risk check into planning.",
    pods: "The PM merges low-risk changes.",
    domains: "R&D: defines low and high risk; reviews high-risk changes.",
  },
  {
    central: "Connects outside services to the runtime.",
    pods: "Use them for their product's launches.",
    domains: "Marketing: chooses and owns the vendor.",
  },
  {
    central: "Provides the skill framework and the gate tooling.",
    pods: "Plan features through the skills.",
    domains: "Design, Data & Analytics, Marketing: each owns its skill and its gate.",
  },
  {
    central: "Runs it continuously: Eval, guardrails, code learning, skills, agent runtime, harnesses.",
    pods: "Feed back merge-request comments and results. Inherit every improvement.",
    domains: "R&D: the quality bar Eval measures against, and the guardrails.",
  },
];

/* ---------- Rhythm ---------- */

export const RHYTHM: { when: string; forum: string; who: string; what: string }[] = [
  {
    when: "Every day",
    forum: "The pod's flow",
    who: "Each pod",
    what: "Tickets flow through Ignis with no sprint queue. The PM reviews when the merge request is ready.",
  },
  {
    when: "Every week",
    forum: "Funnel triage",
    who: "AI product manager, the pods' AI builders, domain owners as needed",
    what: "New requests are scored, specced and routed.",
  },
  {
    when: "Every two weeks",
    forum: "Builders' forum",
    who: "The pods' AI builders and the central AI team",
    what: "Share what worked. Decide what moves from a pod to the platform.",
  },
  {
    when: "Every month",
    forum: "B2C AI steering",
    who: "The GM, the domain owners, the central AI team lead",
    what: "Priorities, budget, scale or stop. Review the ownership register. Report to the company.",
  },
  {
    when: "Every quarter",
    forum: "Planathon",
    who: "Steering and the pod owners",
    what: "Set the next bets: per pod, and for the platform.",
  },
  {
    when: "At 90 days",
    forum: "The gate",
    who: "The owner of each shipped capability",
    what: "Scale, fix or stop, against the numbers written in the spec.",
  },
];

/* ---------- Fit with the company model ---------- */

export const COMPANY_FIT: { ours: BodyKey | null; oursLabel: string; theirs: string; text: string }[] = [
  {
    ours: "steering",
    oursLabel: "B2C AI steering",
    theirs: "The company's AI Council",
    text: "We follow its priorities and policy, and report B2C's numbers every month.",
  },
  {
    ours: "central",
    oursLabel: "Central AI team",
    theirs: "The company's central AI delivery team",
    text: "We build on its standards for infrastructure, AI spend and deployment, and hand over what is cross-company.",
  },
  {
    ours: "pods",
    oursLabel: "The pods' AI builders",
    theirs: "The company's enablement program",
    text: "Our builders train there; the central AI team adds what is specific to Ignis.",
  },
  {
    ours: null,
    oursLabel: "Every pod and the platform",
    theirs: "Security, privacy and compliance",
    text: "Company rules, applied in the platform so that a pod gets them by default.",
  },
];

/* ---------- Open decisions ---------- */

export const DECISIONS: { question: string; suggested: string }[] = [
  {
    question: "Who leads the central AI team, and where does it report?",
    suggested:
      "A lead from R&D with the AI product manager as a counterpart. Both sit in the steering.",
  },
  {
    question: "Dedicated people, or part of their time?",
    suggested:
      "A small core that is fully dedicated, so platform work never loses to a product's roadmap.",
  },
  {
    question: "Which products get a pod, and which goes first?",
    suggested:
      "Start with the team that ran the pilot, then one pod at a time. Onboarding a pod means a product brain, the ticket Skill and a trained AI builder.",
  },
  {
    question: "Who are the domain owners?",
    suggested:
      "The department leads from Phase 1: Product, Design, Data & Analytics, Marketing, R&D and Ops. Match them to the building-block owners of step 1.",
  },
  {
    question: "How big is the central AI team?",
    suggested:
      "Size it from the estimates in step 4: layers 1, 2, 3 and 7 of the architecture are platform work.",
  },
];

/* ---------- The simple view ---------- */

/** Who builds a new capability: the routing decision, in three rules. */
export const SIMPLE_RULES: { when: string; then: string; who: BodyKey }[] = [
  { when: "One product needs it", then: "The pod builds it, on the platform.", who: "pods" },
  {
    when: "Two or more pods need it",
    then: "The central AI team builds it once.",
    who: "central",
  },
  {
    when: "It is a professional standard",
    then: "The domain owner sets it. The central AI team wires it in.",
    who: "domains",
  },
];

export const SIMPLE_RHYTHM: { when: string; what: string }[] = [
  { when: "Every day", what: "Pods ship through Ignis." },
  { when: "Every week", what: "New requests are scored and routed." },
  { when: "Every month", what: "Steering sets priorities: scale or stop." },
  { when: "Every quarter", what: "Planathon sets the next bets." },
];
