"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import StageNode, { type StageNodeData } from "./StageNode";
import type { OverviewData } from "@/lib/overview";
import type { StageRow } from "@/lib/queries";
import { ROLES, ROLE_COLOR_HEX, getRole, type RoleKey } from "@/lib/roles";
import { TAGS } from "@/lib/tags";
import { useTheme, CANVAS_PALETTE } from "@/lib/useTheme";
import type { Theme } from "@/lib/theme";

const nodeTypes = { stage: StageNode };

const MAIN_Y = 60;
const MAIN_STEP_X = 340;
const DEPT_LANE_HEIGHT = 220;
const DEPT_START_Y = 320;

export default function OverviewCanvas({ data, initialTheme }: { data: OverviewData; initialTheme: Theme }) {
  return (
    <ReactFlowProvider>
      <Inner data={data} initialTheme={initialTheme} />
    </ReactFlowProvider>
  );
}

function Inner({ data, initialTheme }: { data: OverviewData; initialTheme: Theme }) {
  const theme = useTheme(initialTheme);
  const palette = CANVAS_PALETTE[theme];
  const { nodes, edges } = useMemo(() => buildGraph(data), [data]);
  const rf = useReactFlow();

  // Refit to screen whenever the graph changes (initial mount + data refresh).
  useEffect(() => {
    const t = setTimeout(() => {
      rf.fitView({ padding: 0.15, duration: 250 });
    }, 60);
    return () => clearTimeout(t);
  }, [rf, nodes.length, edges.length]);

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color={palette.gridDot} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable maskColor={palette.maskColor} nodeColor={(n) => (n.data as any)?.accentColor || "#7c5cff"} />
      </ReactFlow>

      <Legend />
    </div>
  );
}

function buildGraph(data: OverviewData) {
  const mainProc = data.processes.find((p) => p.type === "main")!;
  const mainStagesRaw = data.stagesByProcess[mainProc.id] ?? [];
  const mainStages = [...mainStagesRaw].sort((a, b) => a.order_index - b.order_index || a.x - b.x);

  const nodes: Node<StageNodeData>[] = [];
  const edges: Edge[] = [];

  // Position the main stages in a clean horizontal row
  const mainPosById = new Map<string, { x: number; y: number }>();
  mainStages.forEach((s, i) => {
    const pos = { x: 80 + i * MAIN_STEP_X, y: MAIN_Y };
    mainPosById.set(s.id, pos);
    nodes.push(makeNode(s, pos, "#7c5cff", "Main", undefined, data));
  });

  // Re-create main-process edges using the new layout
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

  // Lay out each department in its own lane
  const deptProcs = data.processes.filter((p) => p.type === "department");
  deptProcs.forEach((proc, dIdx) => {
    const role = (proc.department_role ?? "gm") as RoleKey;
    const accent = ROLE_COLOR_HEX[role];
    const stages = data.stagesByProcess[proc.id] ?? [];
    if (stages.length === 0) return;

    const laneY = DEPT_START_Y + dIdx * DEPT_LANE_HEIGHT;

    // Group stages by which main stage they connect to (or "unlinked")
    const groups = new Map<string, StageRow[]>();
    for (const s of stages) {
      const key = s.connected_main_stage_id ?? "_unlinked";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }

    let unlinkedXStart = 80;

    for (const [mainKey, members] of groups) {
      const sorted = [...members].sort((a, b) => a.order_index - b.order_index || a.x - b.x);

      if (mainKey === "_unlinked") {
        sorted.forEach((s, i) => {
          const pos = { x: unlinkedXStart + i * 290, y: laneY };
          nodes.push(makeNode(s, pos, accent, getRole(role)?.label ?? role, role, data));
        });
        unlinkedXStart += sorted.length * 290 + 40;
      } else {
        const anchor = mainPosById.get(mainKey);
        if (!anchor) continue;
        // Spread members horizontally centered under the main stage
        const groupWidth = (sorted.length - 1) * 290;
        const startX = anchor.x - groupWidth / 2;
        sorted.forEach((s, i) => {
          const pos = { x: startX + i * 290, y: laneY };
          nodes.push(makeNode(s, pos, accent, getRole(role)?.label ?? role, role, data));
          // Dashed connection from main stage to first dept stage in the group
          if (i === 0) {
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
      }
    }

    // Add the department's own internal edges
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

function makeNode(
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

function Legend() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 w-72 space-y-3 rounded-xl border border-line bg-card/90 p-4 backdrop-blur">
      <div>
        <div className="mb-1.5 text-xs uppercase tracking-wider text-muted">Departments</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Swatch hex="#7c5cff" label="Main" />
          {ROLES.filter((r) => r.key !== "gm").map((r) => (
            <Swatch key={r.key} hex={ROLE_COLOR_HEX[r.key]} label={r.label.replace("Director of ", "")} />
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
        Dashed lines show how a department workflow attaches to a stage in the main process.
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
