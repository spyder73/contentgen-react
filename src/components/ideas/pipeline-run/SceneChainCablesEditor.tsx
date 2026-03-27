import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChainConnection } from '../../../api/structs/pipeline';

interface SceneNode {
  scene_id: string;
  order: number;
  reference_url?: string;
}

interface Props {
  scenes: SceneNode[];
  connections: ChainConnection[];
  onChange: (connections: ChainConnection[]) => void;
  saving?: boolean;
}

interface PortPosition {
  x: number;
  y: number;
}

const SceneChainCablesEditor: React.FC<Props> = ({ scenes, connections, onChange, saving: _saving }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portPositions, setPortPositions] = useState<Record<string, { left: PortPosition; right: PortPosition }>>({});
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<PortPosition>({ x: 0, y: 0 });

  const sorted = React.useMemo(() => [...scenes].sort((a, b) => a.order - b.order), [scenes]);

  const measurePorts = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions: Record<string, { left: PortPosition; right: PortPosition }> = {};

    sorted.forEach((scene) => {
      const leftEl = containerRef.current!.querySelector(`[data-port-left="${scene.scene_id}"]`);
      const rightEl = containerRef.current!.querySelector(`[data-port-right="${scene.scene_id}"]`);
      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        newPositions[scene.scene_id] = {
          left: {
            x: leftRect.left + leftRect.width / 2 - containerRect.left,
            y: leftRect.top + leftRect.height / 2 - containerRect.top,
          },
          right: {
            x: rightRect.left + rightRect.width / 2 - containerRect.left,
            y: rightRect.top + rightRect.height / 2 - containerRect.top,
          },
        };
      }
    });
    setPortPositions(newPositions);
  }, [sorted]);

  useEffect(() => {
    measurePorts();
    window.addEventListener('resize', measurePorts);
    return () => window.removeEventListener('resize', measurePorts);
  }, [measurePorts]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConnectingFrom(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!connectingFrom || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [connectingFrom]
  );

  const handleRightPortClick = (sceneId: string) => {
    setConnectingFrom(connectingFrom === sceneId ? null : sceneId);
  };

  const handleLeftPortClick = (sceneId: string) => {
    if (!connectingFrom || connectingFrom === sceneId) {
      setConnectingFrom(null);
      return;
    }
    const exists = connections.some(
      (c) => c.from_scene_id === connectingFrom && c.to_scene_id === sceneId
    );
    if (!exists) {
      onChange([...connections, { from_scene_id: connectingFrom, to_scene_id: sceneId }]);
    }
    setConnectingFrom(null);
  };

  const handleDeleteConnection = (idx: number) => {
    onChange(connections.filter((_, i) => i !== idx));
  };

  const getBezierPath = (from: PortPosition, to: PortPosition): string => {
    const dx = Math.abs(to.x - from.x) * 0.5;
    return `M ${from.x},${from.y} C ${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`;
  };

  const isConnectedLeft = (sceneId: string) => connections.some((c) => c.to_scene_id === sceneId);
  const isConnectedRight = (sceneId: string) => connections.some((c) => c.from_scene_id === sceneId);

  return (
    <div ref={containerRef} className="relative select-none" onMouseMove={handleMouseMove}>
      <div className="flex gap-3 flex-wrap">
        {sorted.map((scene) => {
          const connectedRight = isConnectedRight(scene.scene_id);
          const connectedLeft = isConnectedLeft(scene.scene_id);
          const isSource = connectingFrom === scene.scene_id;

          return (
            <div key={scene.scene_id} className="relative flex items-center">
              {/* Left port */}
              <button
                data-port-left={scene.scene_id}
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors z-10 ${
                  connectedLeft
                    ? 'bg-teal-400 border-teal-400'
                    : connectingFrom && connectingFrom !== scene.scene_id
                    ? 'bg-zinc-700 border-teal-400 hover:bg-teal-400 cursor-crosshair animate-pulse'
                    : 'bg-transparent border-zinc-600 cursor-default'
                }`}
                onClick={() => handleLeftPortClick(scene.scene_id)}
                title={connectingFrom ? `Connect to ${scene.scene_id}` : undefined}
              />

              {/* Scene card */}
              <div
                className={`mx-1.5 rounded border text-center overflow-hidden transition-colors ${
                  isSource ? 'border-teal-400 bg-teal-900/20' : 'border-white/15 bg-black/50'
                }`}
                style={{ width: 72 }}
              >
                {scene.reference_url ? (
                  <img
                    src={scene.reference_url}
                    alt={scene.scene_id}
                    className="w-full h-12 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-12 bg-zinc-900 flex items-center justify-center">
                    <span className="text-[9px] text-zinc-600">no ref</span>
                  </div>
                )}
                <p className="text-[9px] text-zinc-400 py-0.5 truncate px-1">{scene.scene_id}</p>
              </div>

              {/* Right port */}
              <button
                data-port-right={scene.scene_id}
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors z-10 ${
                  connectedRight || isSource
                    ? 'bg-teal-400 border-teal-400'
                    : 'bg-transparent border-zinc-600 hover:border-teal-400 cursor-crosshair'
                }`}
                onClick={() => handleRightPortClick(scene.scene_id)}
                title={
                  isSource
                    ? "Click another scene's left port to connect"
                    : `Start connection from ${scene.scene_id}`
                }
              />
            </div>
          );
        })}
      </div>

      {/* SVG overlay for bezier cables */}
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ width: '100%', height: '100%' }}
      >
        {connections.map((conn, idx) => {
          const fromPos = portPositions[conn.from_scene_id]?.right;
          const toPos = portPositions[conn.to_scene_id]?.left;
          if (!fromPos || !toPos) return null;
          const isHovered = hoveredConnection === idx;
          return (
            <path
              key={idx}
              d={getBezierPath(fromPos, toPos)}
              stroke={isHovered ? '#ef4444' : '#2dd4bf'}
              strokeWidth={isHovered ? 2.5 : 2}
              fill="none"
              strokeDasharray={isHovered ? '6 3' : undefined}
              className="pointer-events-auto cursor-pointer transition-colors"
              onMouseEnter={() => setHoveredConnection(idx)}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={() => handleDeleteConnection(idx)}
              title="Click to delete"
            />
          );
        })}

        {/* Active dragging line */}
        {connectingFrom && portPositions[connectingFrom] && (
          <path
            d={getBezierPath(portPositions[connectingFrom].right, mousePos)}
            stroke="#2dd4bf"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="5 4"
            opacity={0.7}
          />
        )}
      </svg>

      <p className="text-[10px] text-zinc-500 mt-2">
        {connectingFrom
          ? 'Click a left port to complete connection. ESC to cancel.'
          : 'Click a right port to start a connection. Click a cable to delete it.'}
      </p>
    </div>
  );
};

export default SceneChainCablesEditor;
