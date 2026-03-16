import React from 'react';
import { CheckpointConfig } from '../../../api/structs';
import PipelineExtendedBuses from './PipelineExtendedBuses';
import PipelineExtendedNode from './PipelineExtendedNode';
import { buildPipelineGraph } from './graph';
import { BusFamily, BUS_TOP, CHECKPOINT_AREA_TOP, CHECKPOINT_ROW_Y } from './layout';

interface PipelineExtendedViewProps {
  checkpoints: CheckpointConfig[];
  selectedCheckpointId: string | null;
  onSelectCheckpoint: (checkpointId: string) => void;
}

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.2;
const STEP = 0.15;
const SNAP = 24;
const filterLabels: Record<BusFamily, string> = { source: 'Source', prompt: 'Prompts', media: 'Media', payload: 'Payloads' };
const snapX = (value: number) => Math.round(value / SNAP) * SNAP;

const PipelineExtendedView: React.FC<PipelineExtendedViewProps> = ({ checkpoints, selectedCheckpointId, onSelectCheckpoint }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const [settingsCheckpointId, setSettingsCheckpointId] = React.useState<string | null>(null);
  const [positions, setPositions] = React.useState<Record<string, { x: number; y: number }>>({});
  const [dragState, setDragState] = React.useState<{ id: string; dx: number; dy: number; width: number; height: number } | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [fitZoom, setFitZoom] = React.useState(1);
  const [filters, setFilters] = React.useState<Record<BusFamily, boolean>>({ source: true, prompt: true, media: true, payload: true });
  const graph = React.useMemo(() => buildPipelineGraph(checkpoints), [checkpoints]);

  React.useEffect(() => setPositions(Object.fromEntries(graph.nodes.map((node) => [node.checkpoint.id, { x: node.x, y: node.y }]))), [graph]);
  React.useEffect(() => {
    const width = containerRef.current?.clientWidth || 0;
    const height = containerRef.current?.clientHeight || 0;
    if (!width || !height) return;
    const widthFit = (width - 24) / graph.width;
    const heightFit = (height - 84) / graph.height;
    const next = Math.max(MIN_ZOOM, Math.min(1.05, Number(Math.min(widthFit, heightFit).toFixed(2))));
    setFitZoom(next);
    setZoom(next);
  }, [graph.height, graph.width]);
  React.useEffect(() => {
    if (!dragState) return;
    const handlePointerMove = (event: PointerEvent) => {
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rawX = (event.clientX - rect.left) / zoom - dragState.dx;
      const rawY = (event.clientY - rect.top) / zoom - dragState.dy;
      setPositions((current) => ({
        ...current,
        [dragState.id]: {
          x: Math.max(176, Math.min(graph.width - dragState.width - 40, snapX(rawX))),
          y: Math.max(CHECKPOINT_AREA_TOP, Math.min(BUS_TOP - dragState.height - 56, snapX(rawY))),
        },
      }));
    };
    const handlePointerUp = () => setDragState(null);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, graph.width, zoom]);

  const nodes = graph.nodes.map((node) => ({ ...node, ...(positions[node.checkpoint.id] || { x: node.x, y: node.y }) }));
  const nodesById = new Map(nodes.map((node) => [node.checkpoint.id, node]));
  const orderedNodes = nodes;
  const setClampedZoom = (next: number) => setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(next.toFixed(2)))));

  return (
    <div ref={containerRef} className="h-full min-h-0 overflow-auto rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_35%),linear-gradient(rgba(255,255,255,0.03)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:auto,32px_32px,32px_32px] bg-black/40">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-black/55 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span className="text-white/55">Checkpoint Rail</span>
          <span className="text-white/30">/</span>
          <span className="text-white/55">Artifact Buses</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/65">
            {(Object.keys(filterLabels) as BusFamily[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-label={`Toggle ${filterLabels[key]}`}
                aria-pressed={filters[key]}
                className={`rounded border px-2 py-1 ${filters[key] ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/40'}`}
                onClick={() => setFilters((current) => ({ ...current, [key]: !current[key] }))}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/65">
            <button type="button" className="rounded border border-white/10 px-2 py-1 hover:border-white/30" onClick={() => setClampedZoom(zoom - STEP)} aria-label="Zoom out">-</button>
            <button type="button" className="rounded border border-white/10 px-2 py-1 hover:border-white/30" onClick={() => setZoom(fitZoom)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" className="rounded border border-white/10 px-2 py-1 hover:border-white/30" onClick={() => setClampedZoom(zoom + STEP)} aria-label="Zoom in">+</button>
          </div>
        </div>
      </div>

      <div style={{ width: graph.width * zoom, height: graph.height * zoom }}>
        <div ref={sceneRef} className="relative origin-top-left" style={{ width: graph.width, height: graph.height, transform: `scale(${zoom})` }}>
          <div className="pointer-events-none absolute left-6 right-6 border-t border-white/10" style={{ top: CHECKPOINT_ROW_Y + 52 }} />
          <div className="pointer-events-none absolute left-0 right-0 border-t border-white/10" style={{ top: graph.busTop - 18 }} />
          <div className="pointer-events-none absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/28">Checkpoint Rail</div>
          <div className="pointer-events-none absolute left-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/28" style={{ top: graph.busTop - 48 }}>Artifact Lanes</div>

          <PipelineExtendedBuses anchors={graph.anchors} buses={graph.buses} filters={filters} nodesById={nodesById} />

          {graph.anchors.map((anchor) => (
            <div key={anchor.id} className="absolute border border-white/12 bg-black/75 px-3 py-2 text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)]" style={{ left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Source</div>
              <div className="mt-1 text-sm font-semibold">{anchor.title}</div>
              {anchor.subtitle && <div className="mt-1 text-xs text-white/55">{anchor.subtitle}</div>}
            </div>
          ))}

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {orderedNodes.slice(0, -1).map((node, index) => {
              const nextNode = orderedNodes[index + 1];
              return (
                <path
                  key={`${node.checkpoint.id}:${nextNode.checkpoint.id}`}
                  d={`M ${node.x + node.width} ${node.y + node.height / 2} L ${nextNode.x} ${nextNode.y + nextNode.height / 2}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="1.4"
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <PipelineExtendedNode
              key={node.checkpoint.id}
              node={node}
              isSelected={selectedCheckpointId === node.checkpoint.id}
              isSettingsOpen={settingsCheckpointId === node.checkpoint.id}
              onSelect={onSelectCheckpoint}
              onToggleSettings={(checkpointId) => {
                onSelectCheckpoint(checkpointId);
                setSettingsCheckpointId((current) => (current === checkpointId ? null : checkpointId));
              }}
              onPointerDown={(checkpointId, event) => {
                if ((event.target as HTMLElement).closest('button')) return;
                const currentNode = nodesById.get(checkpointId);
                const rect = sceneRef.current?.getBoundingClientRect();
                if (!currentNode || !rect) return;
                onSelectCheckpoint(checkpointId);
                setDragState({
                  id: checkpointId,
                  dx: (event.clientX - rect.left) / zoom - currentNode.x,
                  dy: (event.clientY - rect.top) / zoom - currentNode.y,
                  width: currentNode.width,
                  height: currentNode.height,
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PipelineExtendedView;
