import React from 'react';
import { GraphAnchor, GraphBus, GraphNode } from './graph';
import { BusFamily } from './layout';

interface PipelineExtendedBusesProps {
  anchors: GraphAnchor[];
  buses: GraphBus[];
  filters: Record<BusFamily, boolean>;
  nodesById: Map<string, GraphNode>;
}

const familyStyles = {
  source: { stroke: '#94a3b8', fill: '#cbd5e1' },
  prompt: { stroke: '#e5e7eb', fill: '#e5e7eb' },
  media: { stroke: '#38bdf8', fill: '#7dd3fc' },
  payload: { stroke: '#f472b6', fill: '#f9a8d4' },
} as const;

const marker = (kind: 'spawn' | 'read', x: number, y: number, color: string, id: string) =>
  kind === 'spawn'
    ? <polygon key={id} points={`${x},${y - 7} ${x + 11},${y} ${x},${y + 7}`} fill={color} />
    : <circle key={id} cx={x} cy={y} r={5} fill="black" stroke={color} strokeWidth="2.5" />;

const PipelineExtendedBuses: React.FC<PipelineExtendedBusesProps> = ({ anchors, buses, filters, nodesById }) => {
  const anchorsById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
  const visibleBuses = buses.filter((bus) => filters[bus.family]);

  return (
    <svg className="absolute inset-0 h-full w-full">
      {visibleBuses.map((bus) => {
        const style = familyStyles[bus.family];
        const sourceNode = nodesById.get(bus.sourceId);
        const sourceAnchor = anchorsById.get(bus.sourceId);
        const sourceY = sourceNode ? sourceNode.y + sourceNode.height : sourceAnchor ? sourceAnchor.y + sourceAnchor.height : bus.y;

        return (
          <g key={bus.id}>
            <path d={`M ${bus.fromX} ${sourceY} L ${bus.fromX} ${bus.y} L ${bus.toX} ${bus.y}`} fill="none" stroke={style.stroke} strokeWidth="2.4" />
            <rect x={Math.max(18, bus.fromX - 74)} y={bus.y - 25} width="148" height="18" rx="9" fill="rgba(0,0,0,0.78)" stroke="rgba(255,255,255,0.08)" />
            <text x={Math.max(92, bus.fromX)} y={bus.y - 13} textAnchor="middle" className="fill-white/75 text-[10px] uppercase tracking-[0.18em]">
              {bus.title}
            </text>
            {bus.markers.map((entry) => (
              <g key={entry.id}>
                {entry.kind === 'read' && entry.checkpointId && nodesById.get(entry.checkpointId) && (
                  <path
                    d={`M ${entry.x} ${bus.y} L ${entry.x} ${nodesById.get(entry.checkpointId)!.y + nodesById.get(entry.checkpointId)!.height}`}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth="1.4"
                    strokeDasharray="5 5"
                    strokeOpacity="0.85"
                  />
                )}
                {marker(entry.kind, entry.x, bus.y, style.fill, entry.id)}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default PipelineExtendedBuses;
