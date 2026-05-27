"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import StageNode, { type StageNodeData } from "./StageNode";
import StageDrawer from "./StageDrawer";
import CanvasTip from "./CanvasTip";
import type {
  CommentRow,
  EdgeRow,
  ItemRow,
  ParticipantRow,
  ProcessRow,
  StageParticipantRow,
  StageRow,
} from "@/lib/queries";
import type { ItemKind } from "@/lib/tags";
import { ROLE_COLOR_HEX } from "@/lib/roles";
import { useTheme, CANVAS_PALETTE } from "@/lib/useTheme";
import type { Theme } from "@/lib/theme";

type Props = {
  processId: string;
  initial: {
    process: ProcessRow;
    stages: StageRow[];
    edges: EdgeRow[];
    items: ItemRow[];
    comments: CommentRow[];
    participants: ParticipantRow[];
    stageParticipants: StageParticipantRow[];
  };
  canEdit: boolean;
  mainStages?: { id: string; name: string }[];
  initialTheme: Theme;
};

const nodeTypes = { stage: StageNode };

export default function ProcessCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function Canvas({ processId, initial, canEdit, mainStages, initialTheme }: Props) {
  const theme = useTheme(initialTheme);
  const palette = CANVAS_PALETTE[theme];
  const rf = useReactFlow();
  const [stages, setStages] = useState<StageRow[]>(initial.stages);
  const [edges, setEdges] = useState<EdgeRow[]>(initial.edges);
  const [items, setItems] = useState<ItemRow[]>(initial.items);
  const [comments, setComments] = useState<CommentRow[]>(initial.comments);
  const [participants, setParticipants] = useState<ParticipantRow[]>(initial.participants);
  const [stageParticipants, setStageParticipants] = useState<StageParticipantRow[]>(
    initial.stageParticipants
  );
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Refit to screen whenever the set of stages changes (initial mount, board
  // switch, add/delete). A tiny delay lets React Flow measure the new layout.
  useEffect(() => {
    const t = setTimeout(() => {
      rf.fitView({ padding: 0.2, duration: 250 });
    }, 60);
    return () => clearTimeout(t);
  }, [rf, stages.length, processId]);

  const accentColor = useMemo(() => {
    if (initial.process.type === "department" && initial.process.department_role) {
      return ROLE_COLOR_HEX[initial.process.department_role];
    }
    return "#7c5cff";
  }, [initial.process]);

  const itemsByStage = useMemo(() => {
    const m = new Map<string, ItemRow[]>();
    for (const it of items) {
      if (!m.has(it.stage_id)) m.set(it.stage_id, []);
      m.get(it.stage_id)!.push(it);
    }
    return m;
  }, [items]);

  const commentsByStage = useMemo(() => {
    const m = new Map<string, CommentRow[]>();
    for (const c of comments) {
      if (!m.has(c.stage_id)) m.set(c.stage_id, []);
      m.get(c.stage_id)!.push(c);
    }
    return m;
  }, [comments]);

  const participantIdsByStage = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const sp of stageParticipants) {
      if (!m.has(sp.stage_id)) m.set(sp.stage_id, new Set());
      m.get(sp.stage_id)!.add(sp.participant_id);
    }
    return m;
  }, [stageParticipants]);

  const rfNodes: Node<StageNodeData>[] = useMemo(
    () =>
      stages.map((s) => {
        const its = itemsByStage.get(s.id) ?? [];
        const counts = {
          participant: participantIdsByStage.get(s.id)?.size ?? 0,
          task: 0,
          pain_point: 0,
          missing: 0,
        };
        const tagCounts = { drop: 0, automate: 0, hybrid: 0, own: 0 };
        let decisionTagged = 0;
        let decisionTotal = 0;
        for (const it of its) {
          // participants are now counted from the join table above
          if (it.kind !== "participant" && it.kind in counts) {
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
          position: { x: s.x, y: s.y },
          data: {
            name: s.name,
            description: s.description,
            tag: s.tag,
            ownerRole: s.owner_role,
            itemCounts: counts,
            tagCounts,
            taggedCount: decisionTagged,
            totalItems: decisionTotal,
            commentCount: (commentsByStage.get(s.id) ?? []).length,
            accentColor,
            departmentRole: initial.process.department_role ?? undefined,
          } as StageNodeData,
        };
      }),
    [stages, itemsByStage, commentsByStage, participantIdsByStage, accentColor, initial.process.department_role]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source_stage_id,
        target: e.target_stage_id,
        type: "smoothstep",
        animated: false,
        style: { stroke: `${accentColor}aa`, strokeWidth: 2 },
      })),
    [edges, accentColor]
  );

  // Drag positions are batched and saved on drag end
  const pendingMove = useRef<Map<string, { x: number; y: number }>>(new Map());

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setStages((prev) => {
        let next = prev;
        for (const ch of changes) {
          if (ch.type === "position" && ch.position) {
            next = next.map((s) =>
              s.id === ch.id ? { ...s, x: ch.position!.x, y: ch.position!.y } : s
            );
            if (!ch.dragging) {
              pendingMove.current.set(ch.id, ch.position);
            }
          }
        }
        return next;
      });

      // Persist any positions where dragging just ended
      for (const ch of changes) {
        if (ch.type === "position" && ch.position && ch.dragging === false) {
          const pos = pendingMove.current.get(ch.id);
          if (pos) {
            pendingMove.current.delete(ch.id);
            fetch(`/api/stages/${ch.id}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(pos),
            }).catch((err) => console.warn("[Shift] save position failed", err));
          }
        }
      }
    },
    []
  );

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Removal handled via onEdgeClick (we don't allow direct change ops)
  }, []);

  const onConnect = useCallback(
    async (c: Connection) => {
      if (!canEdit || !c.source || !c.target || c.source === c.target) return;
      try {
        const res = await fetch("/api/edges", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ processId, source: c.source, target: c.target }),
        });
        const json = await res.json();
        if (json.edge) setEdges((es) => [...es, json.edge]);
      } catch (err) {
        console.warn("[Shift] create edge failed", err);
      }
    },
    [canEdit, processId]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_e, n) => {
    setSelectedStageId(n.id);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback(
    async (e, edge) => {
      if (!canEdit) return;
      if (e.altKey || confirm("Remove this connection?")) {
        try {
          await fetch(`/api/edges/${edge.id}`, { method: "DELETE" });
          setEdges((es) => es.filter((x) => x.id !== edge.id));
        } catch (err) {
          console.warn("[Shift] delete edge failed", err);
        }
      }
    },
    [canEdit]
  );

  const onAddStage = useCallback(async () => {
    if (!canEdit) return;
    const maxX = stages.reduce((a, s) => Math.max(a, s.x), 0);
    const x = stages.length === 0 ? 200 : maxX + 320;
    const y = 200;
    try {
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ processId, name: "New stage", x, y }),
      });
      const json = await res.json();
      if (json.stage) {
        setStages((s) => [...s, json.stage]);
        setSelectedStageId(json.stage.id);
      }
    } catch (err) {
      console.warn("[Shift] add stage failed", err);
    }
  }, [canEdit, processId, stages]);

  const selectedStage = stages.find((s) => s.id === selectedStageId) ?? null;
  const selectedItems = selectedStage ? itemsByStage.get(selectedStage.id) ?? [] : [];
  const selectedComments = selectedStage ? commentsByStage.get(selectedStage.id) ?? [] : [];
  const selectedParticipantIds = selectedStage
    ? Array.from(participantIdsByStage.get(selectedStage.id) ?? [])
    : [];

  const updateStage = useCallback(
    async (patch: Partial<StageRow>) => {
      if (!selectedStage) return;
      setStages((prev) => prev.map((s) => (s.id === selectedStage.id ? { ...s, ...patch } : s)));
      try {
        await fetch(`/api/stages/${selectedStage.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
      } catch (err) {
        console.warn("[Shift] update stage failed", err);
      }
    },
    [selectedStage]
  );

  const deleteStage = useCallback(async () => {
    if (!selectedStage) return;
    const id = selectedStage.id;
    setStages((s) => s.filter((x) => x.id !== id));
    setEdges((es) => es.filter((e) => e.source_stage_id !== id && e.target_stage_id !== id));
    setItems((it) => it.filter((i) => i.stage_id !== id));
    setSelectedStageId(null);
    try {
      await fetch(`/api/stages/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[Shift] delete stage failed", err);
    }
  }, [selectedStage]);

  const addItem = useCallback(
    async (kind: ItemKind, content: string, initialTag: string | null = null) => {
      if (!selectedStage) return;
      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stageId: selectedStage.id, kind, content, tag: initialTag }),
        });
        const json = await res.json();
        if (json.item) setItems((arr) => [...arr, json.item]);
      } catch (err) {
        console.warn("[Shift] add item failed", err);
      }
    },
    [selectedStage]
  );

  const updateItem = useCallback(async (id: string, patch: Partial<ItemRow>) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    try {
      await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.warn("[Shift] update item failed", err);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((arr) => arr.filter((it) => it.id !== id));
    try {
      await fetch(`/api/items/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[Shift] delete item failed", err);
    }
  }, []);

  const addComment = useCallback(
    async (content: string) => {
      if (!selectedStage) return;
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stageId: selectedStage.id, content }),
        });
        const json = await res.json();
        if (json.comment) setComments((arr) => [...arr, json.comment]);
      } catch (err) {
        console.warn("[Shift] add comment failed", err);
      }
    },
    [selectedStage]
  );

  const deleteComment = useCallback(async (id: string) => {
    setComments((arr) => arr.filter((c) => c.id !== id));
    try {
      await fetch(`/api/comments/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[Shift] delete comment failed", err);
    }
  }, []);

  /* ---------- Participant link / create / unlink ---------- */

  const linkParticipantToSelected = useCallback(
    async (participantId: string) => {
      if (!selectedStage) return;
      const stageId = selectedStage.id;
      setStageParticipants((arr) =>
        arr.some((sp) => sp.stage_id === stageId && sp.participant_id === participantId)
          ? arr
          : [...arr, { stage_id: stageId, participant_id: participantId, created_at: Date.now() }]
      );
      try {
        await fetch("/api/stage-participants", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stageId, participantId }),
        });
      } catch (err) {
        console.warn("[Shift] link participant failed", err);
      }
    },
    [selectedStage]
  );

  const unlinkParticipantFromSelected = useCallback(
    async (participantId: string) => {
      if (!selectedStage) return;
      const stageId = selectedStage.id;
      setStageParticipants((arr) =>
        arr.filter((sp) => !(sp.stage_id === stageId && sp.participant_id === participantId))
      );
      try {
        await fetch(
          `/api/stage-participants?stageId=${encodeURIComponent(stageId)}&participantId=${encodeURIComponent(participantId)}`,
          { method: "DELETE" }
        );
      } catch (err) {
        console.warn("[Shift] unlink participant failed", err);
      }
    },
    [selectedStage]
  );

  const createAndLinkParticipant = useCallback(
    async (label: string) => {
      if (!selectedStage) return;
      const trimmed = label.trim();
      if (!trimmed) return;
      try {
        const res = await fetch("/api/participants", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ label: trimmed }),
        });
        const json = await res.json();
        const p: ParticipantRow | undefined = json.participant;
        if (p) {
          setParticipants((arr) => (arr.some((x) => x.id === p.id) ? arr : [...arr, p]));
          await linkParticipantToSelected(p.id);
        }
      } catch (err) {
        console.warn("[Shift] create+link participant failed", err);
      }
    },
    [selectedStage, linkParticipantToSelected]
  );

  // Delete a participant from the GLOBAL dictionary — cascades to every stage
  // they were linked to via the stage_participants FK ON DELETE CASCADE.
  const deleteParticipantGlobally = useCallback(async (participantId: string) => {
    setParticipants((arr) => arr.filter((p) => p.id !== participantId));
    setStageParticipants((arr) => arr.filter((sp) => sp.participant_id !== participantId));
    try {
      await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
    } catch (err) {
      console.warn("[Shift] delete participant failed", err);
    }
  }, []);

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        edgesFocusable={canEdit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} color={palette.gridDot} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={() => accentColor}
          maskColor={palette.maskColor}
        />
      </ReactFlow>

      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
        <div className="pointer-events-auto rounded-xl border border-line bg-card/90 px-4 py-3 backdrop-blur">
          <div className="text-xs uppercase tracking-wider text-muted">
            {initial.process.type === "main" ? "Main workflow" : "Department workflow"}
          </div>
          <div className="text-lg font-semibold text-fg">{initial.process.name}</div>
          <div className="mt-1 text-xs text-muted">
            {stages.length} stage{stages.length === 1 ? "" : "s"} ·{" "}
            {items.length} item{items.length === 1 ? "" : "s"}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={onAddStage}
            className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink shadow-card hover:brightness-110"
          >
            + Add stage
          </button>
        )}
        {!canEdit && (
          <div className="pointer-events-auto rounded-md border border-line bg-card/80 px-3 py-2 text-xs text-muted">
            Read-only — switch role to edit
          </div>
        )}
      </div>

      <CanvasTip canEdit={canEdit} />

      {selectedStage && (
        <StageDrawer
          stage={selectedStage}
          items={selectedItems}
          comments={selectedComments}
          participants={participants}
          selectedParticipantIds={selectedParticipantIds}
          mainStages={mainStages}
          isDepartmentProcess={initial.process.type === "department"}
          canEdit={canEdit}
          onClose={() => setSelectedStageId(null)}
          onUpdateStage={updateStage}
          onDeleteStage={deleteStage}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          onLinkParticipant={linkParticipantToSelected}
          onUnlinkParticipant={unlinkParticipantFromSelected}
          onCreateParticipant={createAndLinkParticipant}
          onDeleteParticipant={deleteParticipantGlobally}
        />
      )}
    </div>
  );
}
