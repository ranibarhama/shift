"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeMouseHandler,
  MarkerType,
} from "@xyflow/react";
import StageNode, { type StageNodeData } from "./StageNode";
import type { OverviewData } from "@/lib/overview";
import type { ProcessRow, StageRow } from "@/lib/queries";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import { TAGS } from "@/lib/tags";
import { useTheme, CANVAS_PALETTE } from "@/lib/useTheme";
import type { Theme } from "@/lib/theme";

/* ---------- Layout constants ---------- */

const MAIN_Y = 60;
const MAIN_STEP_X = 340;

// Tile row — sits below the main row with enough breathing room to never
// overlap the tallest stage card.
const TILES_Y = 480;
const TILE_WIDTH = 280;
const TILE_HEIGHT = 150;
const TILE_GAP_X = 28;
const TILE_GAP_Y = 28;
const TILES_PER_ROW = 6;
const TILES_START_X = 80;

// Expanded lanes start below the tile row.
const LANES_START_Y = 760;
const LANE_HEIGHT = 260;
const LANE_HEADER_WIDTH = 220;
const LANE_HEADER_X = 80;
const LANE_STAGES_START_X = LANE_HEADER_X + LANE_HEADER_WIDTH + 80;
const STAGE_STEP_X = 290;

/* ---------- Component ---------- */

export default function OverviewCanvas({
  data,
  initialTheme,
}: {
  data: OverviewData;
  initialTheme: Theme;
}) {
  return (
    <ReactFlowProvider>
      <Inner data={data} initialTheme={initialTheme} />
    </ReactFlowProvider>
  );
}

function Inner({ data, initialTheme }: { data: OverviewData; initialTheme: Theme }) {
  const theme = useTheme(initialTheme);
  const palette = CANVAS_PALETTE[theme];
  const rf = useReactFlow();

  // Set of department role keys that are currently expanded.
  // Default: all collapsed (only the main workflow is open).
  const [expanded, setExpanded] = useState<Set<RoleKey>>(new Set());

  // Group department processes by role so each department renders as one tile.
  const procsByDept = useMemo(() => {
    const m = new Map<RoleKey, ProcessRow[]>();
    for (const p of data.processes) {
      if (p.type !== "department" || !p.department_role) continue;
      const role = p.department_role as RoleKey;
      if (!m.has(role)) m.set(role, []);
      m.get(role)!.push(p);
    }
    return m;
  }, [data.processes]);

  // Stable ordering of department tiles: follow the order of ROLES, skipping GM.
  const orderedDepts = useMemo(
    () =>
      ROLES.filter((r) => r.key !== "gm" && procsByDept.has(r.key as RoleKey)).map(
        (r) => r.key as RoleKey
      ),
    [procsByDept]
  );

  const toggleDept = useCallback((role: RoleKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(orderedDepts));
  }, [orderedDepts]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const { nodes, edges } = useMemo(
    () => buildGraph(data, procsByDept, orderedDepts, expanded),
    [data, procsByDept, orderedDepts, expanded]
  );

  // Refit whenever the visible graph changes
  useEffect(() => {
    const t = setTimeout(() => {
      rf.fitView({ padding: 0.15, duration: 250 });
    }, 60);
    return () => clearTimeout(t);
  }, [rf, nodes.length, edges.length]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      if (node.type === "department") {
        const d = node.data as DepartmentNodeData;
        if (d.deptRole) toggleDept(d.deptRole);
      }
    },
    [toggleDept]
  );

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color={palette.gridDot} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor={palette.maskColor}
          nodeColor={(n) => (n.data as { accentColor?: string })?.accentColor || "#7c5cff"}
        />
      </ReactFlow>

      <Legend
        expandedCount={expanded.size}
        totalDeptCount={orderedDepts.length}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
    </div>
  );
}

/* ---------- Node types ---------- */

type DepartmentNodeData = {
  deptRole: RoleKey;
  deptLabel: string;
  workflowCount: number;
  stageCount: number;
  itemCount: number;
  accentColor: string;
  isExpanded: boolean;
};

function DepartmentNode({ data }: NodeProps) {
  const d = data as DepartmentNodeData;
  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl border-2 text-fg shadow-card transition hover:-translate-y-0.5"
      style={{
        width: TILE_WIDTH,
        background: `linear-gradient(135deg, ${d.accentColor}22 0%, rgb(var(--card)) 70%)`,
        borderColor: d.accentColor,
      }}
      title={
        d.isExpanded
          ? "Click to collapse this department"
          : "Click to expand all workflows in this department"
      }
    >
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden" }} />

      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <div
            className="text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: d.accentColor }}
          >
            Department
          </div>
          <div className="mt-0.5 truncate text-base font-semibold">{d.deptLabel}</div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${d.accentColor}22`, color: d.accentColor }}
        >
          {d.isExpanded ? "▾ Collapse" : "▸ Expand"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-line/60 px-4 py-2 text-[11px] text-muted">
        <span>
          <span className="text-fg">{d.workflowCount}</span> workflow
          {d.workflowCount === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="text-fg">{d.stageCount}</span> stage
          {d.stageCount === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="text-fg">{d.itemCount}</span> item
          {d.itemCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

type WorkflowHeaderData = {
  name: string;
  deptLabel: string;
  accentColor: string;
};

function WorkflowHeaderNode({ data }: NodeProps) {
  const d = data as WorkflowHeaderData;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2 text-fg shadow-card"
      style={{
        width: LANE_HEADER_WIDTH,
        background: `linear-gradient(135deg, ${d.accentColor}1f 0%, rgb(var(--card)) 70%)`,
        borderColor: `${d.accentColor}99`,
      }}
    >
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
      <div className="px-4 py-3">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: d.accentColor }}
        >
          {d.deptLabel}
        </div>
        <div className="mt-0.5 truncate text-base font-semibold">{d.name}</div>
      </div>
    </div>
  );
}

const nodeTypes = {
  stage: StageNode,
  department: DepartmentNode,
  workflowHeader: WorkflowHeaderNode,
};

/* ---------- Graph builder ---------- */

function buildGraph(
  data: OverviewData,
  procsByDept: Map<RoleKey, ProcessRow[]>,
  orderedDepts: RoleKey[],
  expanded: Set<RoleKey>
): { nodes: Node[]; edges: Edge[] } {
  const mainProc = data.processes.find((p) => p.type === "main");
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!mainProc) return { nodes, edges };

  /* Main workflow — always rendered as a row at the top */
  const mainStagesRaw = data.stagesByProcess[mainProc.id] ?? [];
  const mainStages = [...mainStagesRaw].sort(
    (a, b) => a.order_index - b.order_index || a.x - b.x
  );

  const mainPosById = new Map<string, { x: number; y: number }>();
  mainStages.forEach((s, i) => {
    const pos = { x: 80 + i * MAIN_STEP_X, y: MAIN_Y };
    mainPosById.set(s.id, pos);
    nodes.push(makeStageNode(s, pos, "#7c5cff", "Main", undefined, data));
  });

  const mainEdges = data.edgesByProcess[mainProc.id] ?? [];
  for (const e of mainEdges) {
    edges.push({
      id: `mainE_${e.id}`,
      source: e.source_stage_id,
      target: e.target_stage_id,
      type: "smoothstep",
      style: { stroke: "#7c5cff", strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#7c5cff" },
    });
  }

  /* One tile per department, always in the tile row */
  orderedDepts.forEach((role, idx) => {
    const accent = ROLE_COLOR_HEX[role];
    const procs = procsByDept.get(role) ?? [];

    // Aggregate counts across every workflow in this department
    let stageCount = 0;
    let itemCount = 0;
    const connectedMainStages = new Set<string>();
    for (const proc of procs) {
      const stages = data.stagesByProcess[proc.id] ?? [];
      stageCount += stages.length;
      for (const s of stages) {
        itemCount += data.itemsByStage[s.id]?.length ?? 0;
        if (s.connected_main_stage_id) connectedMainStages.add(s.connected_main_stage_id);
      }
    }

    const col = idx % TILES_PER_ROW;
    const row = Math.floor(idx / TILES_PER_ROW);
    const x = TILES_START_X + col * (TILE_WIDTH + TILE_GAP_X);
    const y = TILES_Y + row * (TILE_HEIGHT + TILE_GAP_Y);

    const isExpanded = expanded.has(role);

    nodes.push({
      id: `dept_${role}`,
      type: "department",
      position: { x, y },
      draggable: false,
      data: {
        deptRole: role,
        deptLabel: getRole(role)?.label ?? role,
        workflowCount: procs.length,
        stageCount,
        itemCount,
        accentColor: accent,
        isExpanded,
      } satisfies DepartmentNodeData,
    });

    // Dashed connectors from each connected main stage to this department tile
    for (const mainId of connectedMainStages) {
      if (!mainPosById.has(mainId)) continue;
      edges.push({
        id: `deptLink_${role}_${mainId}`,
        source: mainId,
        target: `dept_${role}`,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: accent,
          strokeWidth: 1.5,
          strokeDasharray: "5 5",
          opacity: 0.75,
        },
      });
    }
  });

  /* Expanded departments — render every workflow as its own lane below */
  let laneIndex = 0;
  for (const role of orderedDepts) {
    if (!expanded.has(role)) continue;
    const accent = ROLE_COLOR_HEX[role];
    const procs = procsByDept.get(role) ?? [];

    for (const proc of procs) {
      const stages = data.stagesByProcess[proc.id] ?? [];
      const laneY = LANES_START_Y + laneIndex * LANE_HEIGHT;
      laneIndex += 1;

      // Lane header (workflow name) on the left
      nodes.push({
        id: `wfh_${proc.id}`,
        type: "workflowHeader",
        position: { x: LANE_HEADER_X, y: laneY },
        draggable: false,
        data: {
          name: proc.name,
          deptLabel: getRole(role)?.label ?? role,
          accentColor: accent,
        } satisfies WorkflowHeaderData,
      });

      if (stages.length === 0) continue;

      // Group stages by which main stage they connect to (or "unlinked")
      const groups = new Map<string, StageRow[]>();
      for (const s of stages) {
        const key = s.connected_main_stage_id ?? "_unlinked";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(s);
      }

      let cursorX = LANE_STAGES_START_X;

      for (const [mainKey, members] of groups) {
        const sorted = [...members].sort(
          (a, b) => a.order_index - b.order_index || a.x - b.x
        );

        if (mainKey === "_unlinked") {
          sorted.forEach((s, i) => {
            const pos = { x: cursorX + i * STAGE_STEP_X, y: laneY };
            nodes.push(
              makeStageNode(s, pos, accent, getRole(role)?.label ?? role, role, data)
            );
          });
          cursorX += sorted.length * STAGE_STEP_X + 40;
        } else {
          const anchor = mainPosById.get(mainKey);
          sorted.forEach((s, i) => {
            let x = cursorX + i * STAGE_STEP_X;
            if (anchor) {
              const ideal = anchor.x - ((sorted.length - 1) * STAGE_STEP_X) / 2;
              x = Math.max(cursorX, ideal + i * STAGE_STEP_X);
            }
            const pos = { x, y: laneY };
            nodes.push(
              makeStageNode(s, pos, accent, getRole(role)?.label ?? role, role, data)
            );

            // Dashed connection from main stage → first stage of the group
            if (i === 0 && anchor) {
              edges.push({
                id: `link_${s.id}`,
                source: mainKey,
                target: s.id,
                type: "smoothstep",
                animated: true,
                style: { stroke: accent, strokeWidth: 1.5, strokeDasharray: "6 4" },
                markerEnd: { type: MarkerType.ArrowClosed, color: accent },
              });
            }
          });
          cursorX += sorted.length * STAGE_STEP_X + 40;
        }
      }

      // Workflow's own internal edges
      const internal = data.edgesByProcess[proc.id] ?? [];
      for (const e of internal) {
        edges.push({
          id: `deptE_${e.id}`,
          source: e.source_stage_id,
          target: e.target_stage_id,
          type: "smoothstep",
          style: { stroke: `${accent}cc`, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: accent },
        });
      }
    }
  }

  return { nodes, edges };
}

function makeStageNode(
  s: StageRow,
  pos: { x: number; y: number },
  accent: string,
  badge: string,
  deptRole: RoleKey | undefined,
  data: OverviewData
): Node<StageNodeData> {
  const its = data.itemsByStage[s.id] ?? [];
  const counts = { participant: 0, task: 0, pain_point: 0, missing: 0 };
  const tagCounts = { drop: 0, automate: 0, hybrid: 0, own: 0 };
  let decisionTagged = 0;
  let decisionTotal = 0;
  for (const it of its) {
    if (it.kind in counts) {
      counts[it.kind as keyof typeof counts] += 1;
    }
    if (it.kind !== "missing") {
      decisionTotal += 1;
      if (it.tag) {
        decisionTagged += 1;
        if (it.tag in tagCounts) {
          tagCounts[it.tag as keyof typeof tagCounts] += 1;
        }
      }
    }
  }
  return {
    id: s.id,
    type: "stage",
    position: pos,
    draggable: false,
    data: {
      name: s.name,
      description: s.description,
      tag: s.tag,
      ownerRole: s.owner_role,
      itemCounts: counts,
      tagCounts,
      taggedCount: decisionTagged,
      totalItems: decisionTotal,
      commentCount: 0,
      accentColor: accent,
      departmentRole: deptRole,
      badge,
    },
  };
}

/* ---------- Legend ---------- */

function Legend({
  expandedCount,
  totalDeptCount,
  onExpandAll,
  onCollapseAll,
}: {
  expandedCount: number;
  totalDeptCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute right-4 top-4 w-72 space-y-3 rounded-xl border border-line bg-card/90 p-4 backdrop-blur">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-wider text-muted">
          <span>Departments</span>
          <span className="text-fg">
            {expandedCount}/{totalDeptCount} open
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            disabled={expandedCount === totalDeptCount}
            className="flex-1 rounded-md border border-line bg-bg/40 px-2 py-1 text-[11px] font-medium text-fg hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            disabled={expandedCount === 0}
            className="flex-1 rounded-md border border-line bg-bg/40 px-2 py-1 text-[11px] font-medium text-fg hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Collapse all
          </button>
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">Departments</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Swatch hex="#7c5cff" label="Main" />
          {ROLES.filter((r) => r.key !== "gm").map((r) => (
            <Swatch
              key={r.key}
              hex={ROLE_COLOR_HEX[r.key]}
              label={r.label.replace("Director of ", "")}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">Decision tags</div>
        <div className="grid grid-cols-2 gap-1.5">
          {TAGS.map((t) => (
            <Swatch key={t.key} hex={t.hex} label={t.label} />
          ))}
        </div>
      </div>
      <div className="text-[10px] leading-snug text-muted">
        Click a department tile to expand every workflow it owns. Dashed lines show how
        each department attaches to the main process.
      </div>
    </div>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-fg">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: hex }} />
      <span className="truncate">{label}</span>
    </div>
  );
}
