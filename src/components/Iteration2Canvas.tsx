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

type NodeData = {
  title: string;
  details?: string;
  inputs?: string;
  outputs?: string;
  color?: string;
};

const DEFAULT_COLOR = "#7c5cff";
const CARD_COLORS = [
  "#7c5cff",
  "#22d3ee",
  "#3b82f6",
  "#10b981",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
];

const ARROW = { type: MarkerType.ArrowClosed, width: 18, height: 18 } as const;
const EDGE_COLOR = "#8b9cff";

/* ---------- Graph <-> React Flow ---------- */

function toRfNodes(g: I2Graph): Node<NodeData>[] {
  return g.nodes.map((n) => ({
    id: n.id,
    type: "card",
    position: n.position,
    data: { ...n.data },
  }));
}

function edgeStyle(dashed?: boolean) {
  return {
    stroke: EDGE_COLOR,
    strokeWidth: 2,
    ...(dashed ? { strokeDasharray: "1 9", strokeLinecap: "round" as const } : {}),
  };
}

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
    style: edgeStyle(e.dashed),
  }));
}

function toGraph(nodes: Node<NodeData>[], edges: Edge[]): I2Graph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: {
        title: n.data.title ?? "",
        details: n.data.details,
        inputs: n.data.inputs,
        outputs: n.data.outputs,
        color: n.data.color,
      },
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

/* ---------- Circular node ---------- */

const SIDES = [
  { id: "left", pos: Position.Left },
  { id: "right", pos: Position.Right },
  { id: "top", pos: Position.Top },
  { id: "bottom", pos: Position.Bottom },
] as const;

function CardNode({ data, selected }: NodeProps<Node<NodeData>>) {
  const hasMore = !!(data.details || data.inputs || data.outputs);
  const c = data.color || DEFAULT_COLOR;
  return (
    <div
      className="group relative grid place-items-center rounded-2xl border transition"
      style={{
        width: 122,
        height: 122,
        borderColor: selected ? c : `${c}88`,
        background: `radial-gradient(circle at 50% 35%, ${c}3d, rgba(18,22,40,0.55))`,
        boxShadow: selected
          ? `0 0 0 2px ${c}, 0 0 34px ${c}88`
          : `0 0 24px ${c}3d`,
      }}
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
      <span className="px-2 text-center text-[13px] font-semibold uppercase tracking-[0.2em] text-fg">
        {data.title || "—"}
      </span>
      {hasMore && (
        <span
          className="absolute bottom-3 h-1 w-1 rounded-full"
          style={{ background: c }}
          aria-hidden
        />
      )}
    </div>
  );
}

/* ---------- Editable edge ---------- */

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
      eds.map((e) => (e.id === id ? { ...e, markerStart: bidi ? undefined : ARROW } : e))
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
      <BaseEdge id={id} path={path} markerEnd={markerEnd} markerStart={markerStart} style={style} />
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
            <EdgeBtn onClick={toggleDirection} title={bidi ? "Make one-way" : "Make two-way"} label={bidi ? "↔" : "→"} />
            <EdgeBtn onClick={toggleAnimated} title={animated ? "Stop animation" : "Animate flow"} label="⟿" active={!!animated} />
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

/* ---------- Node edit panel ---------- */

function NodePanel({
  node,
  onChange,
  onDelete,
  onClose,
}: {
  node: Node<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="absolute right-0 top-0 z-20 flex h-full w-[320px] max-w-[88%] flex-col border-l border-line bg-card/95 shadow-xl backdrop-blur">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          Edit card
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:bg-line/40 hover:text-fg"
        >
          ✕
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Name">
          <input
            value={node.data.title ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Card name"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm font-semibold text-fg focus:border-accent focus:outline-none"
          />
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((col) => {
              const active = (node.data.color || DEFAULT_COLOR) === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => onChange({ color: col })}
                  aria-label={`Color ${col}`}
                  className={
                    "h-7 w-7 rounded-full border-2 transition " +
                    (active ? "scale-110" : "opacity-80 hover:opacity-100")
                  }
                  style={{
                    background: col,
                    borderColor: active ? "rgb(var(--fg))" : "transparent",
                  }}
                />
              );
            })}
          </div>
        </Field>
        <Field label="Details">
          <textarea
            value={node.data.details ?? ""}
            onChange={(e) => onChange({ details: e.target.value })}
            rows={3}
            placeholder="What happens in this stage…"
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </Field>
        <Field label="Inputs" help="what this stage needs — one per line">
          <textarea
            value={node.data.inputs ?? ""}
            onChange={(e) => onChange({ inputs: e.target.value })}
            rows={3}
            placeholder="e.g. usage signals&#10;support tickets"
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </Field>
        <Field label="Outputs" help="what this stage produces — one per line">
          <textarea
            value={node.data.outputs ?? ""}
            onChange={(e) => onChange({ outputs: e.target.value })}
            rows={3}
            placeholder="e.g. prioritized backlog&#10;shipped release"
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </Field>
      </div>

      <footer className="border-t border-line p-4">
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-lg border border-drop/40 py-2 text-sm font-semibold text-drop transition hover:bg-drop/10"
        >
          Delete card
        </button>
      </footer>
    </aside>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg">
          {label}
        </span>
        {help && <span className="text-[10px] text-muted">· {help}</span>}
      </div>
      {children}
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
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toRfEdges(initialGraph));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const { screenToFlowPosition } = useReactFlow();
  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFull(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void containerRef.current?.requestFullscreen?.();
    }
  }

  const nodeTypes = useMemo(() => ({ card: CardNode }), []);
  const edgeTypes = useMemo(() => ({ editable: EditableEdge }), []);

  const editingNode = nodes.find((n) => n.id === editingId) ?? null;

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            id: `e_${Date.now().toString(36)}`,
            type: "editable",
            markerEnd: ARROW,
            style: edgeStyle(false),
          },
          eds
        )
      ),
    [setEdges]
  );

  // Debounced autosave
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

  function updateNodeData(id: string, patch: Partial<NodeData>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  }

  function deleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setEditingId(null);
  }

  function addCard() {
    const pos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const id = newId();
    setNodes((nds) => [
      ...nds,
      { id, type: "card", position: pos, data: { title: "New card" } },
    ]);
    setEditingId(id);
  }

  function reset() {
    setNodes(toRfNodes(SEED_GRAPH));
    setEdges(toRfEdges(SEED_GRAPH));
    setEditingId(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-line bg-bg"
      style={{ height: isFull ? "100vh" : "76vh" }}
    >
      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-ink shadow-card transition hover:brightness-110"
          >
            + Add card
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-line bg-card/90 px-3 py-1.5 text-xs font-medium text-muted shadow-card backdrop-blur transition hover:border-accent/40 hover:text-fg"
          >
            Reset loop
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full border border-line bg-card/90 px-3 py-1.5 text-xs font-medium text-muted shadow-card backdrop-blur transition hover:border-accent/40 hover:text-fg"
          >
            {isFull ? "Exit full screen" : "Full screen"}
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-card/90 px-3 py-1.5 text-[11px] shadow-card backdrop-blur">
          <SaveDot state={saveState} />
          <span className="text-muted">{SAVE_LABEL[saveState]}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-line bg-card/80 px-3 py-1 text-center text-[10.5px] text-muted shadow-card backdrop-blur">
        Click a card to edit it · drag to move · hover a card &amp; drag a dot to connect · click a line for direction / animation / delete
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => setEditingId(n.id)}
        onPaneClick={() => setEditingId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        colorMode="system"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "editable", markerEnd: ARROW }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {editingNode && (
        <NodePanel
          node={editingNode}
          onChange={(patch) => updateNodeData(editingNode.id, patch)}
          onDelete={() => deleteNode(editingNode.id)}
          onClose={() => setEditingId(null)}
        />
      )}
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
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />;
}

export default function Iteration2Canvas({ initialGraph }: { initialGraph: I2Graph }) {
  return (
    <ReactFlowProvider>
      <CanvasInner initialGraph={initialGraph} />
    </ReactFlowProvider>
  );
}
