"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import { SEED_GRAPH, type I2Graph } from "@/lib/iteration2";

type NodeData = { title: string; body?: string };

/* ---------- Graph <-> React Flow mapping ---------- */

function toRfNodes(g: I2Graph): Node<NodeData>[] {
  return g.nodes.map((n) => ({
    id: n.id,
    type: "editable",
    position: n.position,
    data: { title: n.data.title, body: n.data.body },
  }));
}

const ARROW = { type: MarkerType.ArrowClosed, width: 18, height: 18 } as const;

function toRfEdges(g: I2Graph): Edge[] {
  return g.edges.map((e) => ({
    id: e.id,
    type: "editable",
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: e.label,
    animated: e.animated,
    markerEnd: ARROW,
    markerStart: e.bidirectional ? ARROW : undefined,
    style: e.dashed ? { strokeDasharray: "6 4" } : undefined,
  }));
}

function toGraph(nodes: Node<NodeData>[], edges: Edge[]): I2Graph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: { title: n.data.title ?? "", body: n.data.body },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: (e.sourceHandle as string | null) ?? null,
      targetHandle: (e.targetHandle as string | null) ?? null,
      label: typeof e.label === "string" ? e.label : undefined,
      animated: !!e.animated,
      dashed: !!(e.style && (e.style as { strokeDasharray?: string }).strokeDasharray),
      bidirectional: !!e.markerStart,
    })),
  };
}

/* ---------- Editable edge (click to reveal a toolbar) ---------- */

function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  style,
  selected,
  animated,
  label,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const bidi = !!markerStart;

  function toggleDirection() {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id ? { ...e, markerStart: bidi ? undefined : ARROW } : e
      )
    );
  }
  function toggleAnimated() {
    setEdges((eds) =>
      eds.map((e) => (e.id === id ? { ...e, animated: !e.animated } : e))
    );
  }
  function remove() {
    setEdges((eds) => eds.filter((e) => e.id !== id));
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
      />
      <EdgeLabelRenderer>
        {label && !selected && (
          <div
            className="pointer-events-none rounded-md border border-line bg-card/90 px-1.5 py-0.5 text-[10px] text-muted shadow-sm backdrop-blur"
            style={{
              position: "absolute",
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label as string}
          </div>
        )}
        {selected && (
          <div
            className="nodrag nopan flex items-center gap-0.5 rounded-full border border-accent/50 bg-card px-1 py-0.5 shadow-card"
            style={{
              position: "absolute",
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <EdgeBtn
              onClick={toggleDirection}
              title={bidi ? "Make one-way" : "Make two-way"}
              label={bidi ? "↔" : "→"}
            />
            <EdgeBtn
              onClick={toggleAnimated}
              title={animated ? "Stop animation" : "Animate flow"}
              label="⟿"
              active={!!animated}
            />
            <EdgeBtn onClick={remove} title="Delete connection" label="✕" danger />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

function EdgeBtn({
  onClick,
  title,
  label,
  active,
  danger,
}: {
  onClick: () => void;
  title: string;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12px] font-bold leading-none transition " +
        (danger
          ? "text-drop hover:bg-drop/15"
          : active
          ? "bg-accent text-ink"
          : "text-muted hover:bg-line/50 hover:text-fg")
      }
    >
      {label}
    </button>
  );
}

/* ---------- Editable node ---------- */

const SIDES = [
  { id: "left", pos: Position.Left },
  { id: "right", pos: Position.Right },
  { id: "top", pos: Position.Top },
  { id: "bottom", pos: Position.Bottom },
] as const;

function EditableNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.title ?? "");
  const [body, setBody] = useState(data.body ?? "");

  useEffect(() => {
    if (!editing) {
      setTitle(data.title ?? "");
      setBody(data.body ?? "");
    }
  }, [data.title, data.body, editing]);

  const commit = useCallback(() => {
    setEditing(false);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, title: title.trim(), body: body.trim() || undefined } }
          : n
      )
    );
  }, [id, title, body, setNodes]);

  return (
    <div
      className={
        "group rounded-xl border bg-card px-3 py-2 text-fg shadow-card transition " +
        (selected ? "border-accent ring-1 ring-accent/40" : "border-line")
      }
      style={{ minWidth: 132, maxWidth: 230 }}
      onDoubleClick={() => setEditing(true)}
    >
      {SIDES.map((s) => (
        <Fragment key={s.id}>
          <Handle
            id={`t-${s.id}`}
            type="target"
            position={s.pos}
            className="!h-2.5 !w-2.5 !border-2 !border-bg !bg-accent/50 opacity-0 transition group-hover:opacity-100"
          />
          <Handle
            id={`s-${s.id}`}
            type="source"
            position={s.pos}
            className="!h-2.5 !w-2.5 !border-2 !border-bg !bg-accent opacity-0 transition group-hover:opacity-100"
          />
        </Fragment>
      ))}

      {editing ? (
        <div
          className="flex flex-col gap-1"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="Title"
            className="rounded border border-line bg-bg px-1.5 py-0.5 text-[12.5px] font-bold text-fg focus:border-accent focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={commit}
            rows={3}
            placeholder="Details (optional)"
            className="resize-none rounded border border-line bg-bg px-1.5 py-0.5 text-[11px] text-muted focus:border-accent focus:outline-none"
          />
        </div>
      ) : (
        <>
          <div className="text-[12.5px] font-bold leading-tight">
            {data.title || <span className="text-muted">Untitled</span>}
          </div>
          {data.body && (
            <div className="mt-1 whitespace-pre-line text-[10.5px] leading-snug text-muted">
              {data.body}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Canvas ---------- */

let idc = 0;
function newId() {
  idc += 1;
  return `n_${Date.now().toString(36)}_${idc}`;
}

function CanvasInner({ initialGraph }: { initialGraph: I2Graph }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(
    toRfNodes(initialGraph)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    toRfEdges(initialGraph)
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const { screenToFlowPosition } = useReactFlow();
  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodeTypes = useMemo(() => ({ editable: EditableNode }), []);
  const edgeTypes = useMemo(() => ({ editable: EditableEdge }), []);

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            id: `e_${Date.now().toString(36)}`,
            type: "editable",
            markerEnd: ARROW,
          },
          eds
        )
      ),
    [setEdges]
  );

  // Debounced autosave whenever the graph changes
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      const graph = toGraph(nodes, edges);
      fetch("/api/iteration2", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(graph),
      })
        .then((r) => setSaveState(r.ok ? "saved" : "error"))
        .catch(() => setSaveState("error"));
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges]);

  function addStage() {
    const pos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setNodes((nds) => [
      ...nds,
      {
        id: newId(),
        type: "editable",
        position: pos,
        data: { title: "New stage" },
      },
    ]);
  }

  function resetToWhiteboard() {
    setNodes(toRfNodes(SEED_GRAPH));
    setEdges(toRfEdges(SEED_GRAPH));
  }

  return (
    <div className="relative h-[74vh] w-full overflow-hidden rounded-2xl border border-line bg-bg">
      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={addStage}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-ink shadow-card transition hover:brightness-110"
          >
            + Add stage
          </button>
          <button
            type="button"
            onClick={resetToWhiteboard}
            className="rounded-full border border-line bg-card/90 px-3 py-1.5 text-xs font-medium text-muted shadow-card backdrop-blur transition hover:border-accent/40 hover:text-fg"
          >
            Reset to whiteboard
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-card/90 px-3 py-1.5 text-[11px] shadow-card backdrop-blur">
          <SaveDot state={saveState} />
          <span className="text-muted">{SAVE_LABEL[saveState]}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-line bg-card/80 px-3 py-1 text-[10.5px] text-muted shadow-card backdrop-blur">
        Drag to move · hover a box &amp; drag a dot to connect · double-click a box to edit · click a connection for one-way / two-way / animate / delete
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="system"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "editable", markerEnd: ARROW }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

const SAVE_LABEL: Record<string, string> = {
  idle: "All changes saved",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

function SaveDot({ state }: { state: string }) {
  const color =
    state === "error" ? "#ef4444" : state === "saving" ? "#f59e0b" : "#10b981";
  return (
    <span
      className="h-1.5 w-1.5 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

export default function Iteration2Canvas({
  initialGraph,
}: {
  initialGraph: I2Graph;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner initialGraph={initialGraph} />
    </ReactFlowProvider>
  );
}
