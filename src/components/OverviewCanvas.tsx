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
import type { StageRow } from "@/lib/queries";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import { TAGS } from "@/lib/tags";
import { useTheme, CANVAS_PALETTE } from "@/lib/useTheme";
import type { Theme } from "@/lib/theme";

/* ---------- Layout constants ---------- */

const MAIN_Y = 60;
const MAIN_STEP_X = 340;

const TILES_Y = 320;
const TILE_WIDTH = 280;
const TILE_HEIGHT = 132;
const TILE_GAP_X = 24;
const TILE_GAP_Y = 24;
const TILES_PER_ROW = 5;
const TILES_START_X = 80;

const LANES_START_Y = 540;
const LANE_HEIGHT = 240;
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

  // Set of department-workflow process IDs that are currently expanded.
  // Default: all collapsed (only main workflow visible).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const deptProcessIds = useMemo(
    () => data.processes.filter((p) => p.type === "department").map((p) => p.id),
    [data.processes]
  );

  const toggleWorkflow = useCallback((processId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(processId)) next.delete(processId);
      else next.add(processId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(deptProcessIds));
  }, [deptProcessIds]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const { nodes, edges } = useMemo(
    () => buildGraph(data, expanded),
    [data, expanded]
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
      if (node.type === "workflow") {
        const data = node.data as WorkflowNodeData;
        if (data.processId) toggleWorkflow(data.processId);
      }
    },
    [toggleWorkflow]
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
        totalDeptCount={deptProcessIds.length}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
    </div>
  );
}

/* ---------- Node types ---------- */

type WorkflowNodeData = {
  processId: string;
  name: string;
  deptLabel: string;
  deptRole: RoleKey;
  accentColor: string;
  stageCount: number;
  itemCount: number;
  isExpanded: boolean;
};

function WorkflowNode({ data }: NodeProps) {
  const d = data as WorkflowNodeData;
  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl border-2 text-fg shadow-card transition hover:-translate-y-0.5"
      style={{
        width: d.isExpanded ? LANE_HEADER_WIDTH : TILE_WIDTH,
        background: `linear-gradient(135deg, ${d.accentColor}22 0%, rgb(var(--card)) 70%)`,
        borderColor: d.accentColor,
      }}
      title={d.isExpanded ? "Click to collapse this workflow" : "Click to expand this workflow"}
    >
      {/* Connection handles so dashed edges from main stages can land here when expanded */}
      <Handle type="target" position={Position.Top} style={{ visibility: "hidden" }} />
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />

      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0">
          <div
            className="text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: d.accentColor }}
          >
            {d.deptLabel}
          </div>
          <div className="mt-0.5 truncate text-base font-semibold">{d.name}</div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${d.accentColor}22`, color: d.accentColor }}
        >
          {d.isExpanded ? "▾ Collapse" : "▸ Expand"}
        </span>
      </div>

      {!d.isExpanded && (
        <div className="mt-3 flex items-center gap-3 border-t border-line/60 px-4 py-2 text-[11px] text-muted">
          <span>
            <span className="text-fg">{d.stageCount}</span>{" "}
            stage{d.stageCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="text-fg">{d.itemCount}</span>{" "}
            item{d.itemCount === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { stage: StageNode, workflow: WorkflowNode };

/* ---------- Graph builder ---------- */

function buildGraph(
  data: OverviewData,
  expanded: Set<string>
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

  /* Department workflows — collapsed = tile, expanded = full lane */
  const deptProcs = data.processes.filter((p) => p.type === "department");

  // Split into collapsed (rendered as tiles) and expanded (rendered as lanes)
  const collapsedList = deptProcs.filter((p) => !expanded.has(p.id));
  const expandedList = deptProcs.filter((p) => expanded.has(p.id));

  // 1. Tile row for collapsed workflows
  collapsedList.forEach((proc, idx) => {
    const role = (proc.department_role ?? "gm") as RoleKey;
    const accent = ROLE_COLOR_HEX[role];
    const stages = data.stagesByProcess[proc.id] ?? [];
    const itemCount = stages.reduce(
      (sum, s) => sum + (data.itemsByStage[s.id]?.length ?? 0),
      0
    );

    const col = idx % TILES_PER_ROW;
    const row = Math.floor(idx / TILES_PER_ROW);
    const x = TILES_START_X + col * (TILE_WIDTH + TILE_GAP_X);
    const y = TILES_Y + row * (TILE_HEIGHT + TILE_GAP_Y);

    nodes.push({
      id: `wf_${proc.id}`,
      type: "workflow",
      position: { x, y },
      draggable: false,
      data: {
        processId: proc.id,
        name: proc.name,
        deptLabel: getRole(role)?.label ?? role,
        deptRole: role,
        accentColor: accent,
        stageCount: stages.length,
        itemCount,
        isExpanded: false,
      } satisfies WorkflowNodeData,
    });

    // Show a hint connection from each connected main stage to the collapsed tile
    const connectedMainIds = new Set<string>();
    for (const s of stages) {
      if (s.connected_main_stage_id) connectedMainIds.add(s.connected_main_stage_id);
    }
    for (const mainId of connectedMainIds) {
      if (!mainPosById.has(mainId)) continue;
      edges.push({
        id: `tileLink_${proc.id}_${mainId}`,
        source: mainId,
        target: `wf_${proc.id}`,
        type: "smoothstep",
        animated: false,
        style: { stroke: accent, strokeWidth: 1.25, strokeDasharray: "3 5", opacity: 0.7 },
      });
    }
  });

  // 2. Lanes for expanded workflows — stacked vertically below the tile row
  expandedList.forEach((proc, lIdx) => {
    const role = (proc.department_role ?? "gm") as RoleKey;
    const accent = ROLE_COLOR_HEX[role];
    const stages = data.stagesByProcess[proc.id] ?? [];
    const laneY = LANES_START_Y + lIdx * LANE_HEIGHT;

    // Lane header on the left — also a workflow-type node so clicking it collapses
    const itemCount = stages.reduce(
      (sum, s) => sum + (data.itemsByStage[s.id]?.length ?? 0),
      0
    );
    nodes.push({
      id: `wf_${proc.id}`,
      type: "workflow",
      position: { x: LANE_HEADER_X, y: laneY },
      draggable: false,
      data: {
        processId: proc.id,
        name: proc.name,
        deptLabel: getRole(role)?.label ?? role,
        deptRole: role,
        accentColor: accent,
        stageCount: stages.length,
        itemCount,
        isExpanded: true,
      } satisfies WorkflowNodeData,
    });

    if (stages.length === 0) return;

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
          // Center stages under the anchor main stage when possible, but never
          // overlap the lane header — clamp to current cursor
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

    // Department's own internal edges (between its stages)
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
  });

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
          <span>Department workflows</span>
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
        Click a department tile to expand its workflow. Dashed lines show how each
        workflow attaches to the main process.
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
