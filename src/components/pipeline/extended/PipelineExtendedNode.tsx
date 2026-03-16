import React from 'react';
import { GraphNode } from './graph';

interface PipelineExtendedNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isSettingsOpen: boolean;
  onSelect: (checkpointId: string) => void;
  onToggleSettings: (checkpointId: string) => void;
  onPointerDown: (checkpointId: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

const styles = {
  prompt: 'border-white/15 bg-zinc-950/92 text-white',
  distributor: 'border-amber-300/45 bg-amber-500/12 text-amber-50',
  generator: 'border-sky-300/55 bg-sky-500/14 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_0_42px_rgba(56,189,248,0.18)]',
  connector: 'border-emerald-300/45 bg-emerald-500/10 text-emerald-50',
} as const;

const details = (node: GraphNode) => {
  const checkpoint = node.checkpoint;
  const mappings = Object.entries(checkpoint.input_mapping || {}).map(([key, source]) => `${key} -> ${source}`);
  const required = checkpoint.required_assets?.map((asset) => asset.key || asset.media_id || asset.source || asset.type).filter(Boolean) || [];

  return (
    <div className="mt-3 space-y-1 rounded-2xl border border-white/10 bg-black/45 p-3 text-[10px] text-white/75">
      <div>Produces: {node.outputLabel}</div>
      {mappings.length > 0 && <div>Mappings: {mappings.join(' | ')}</div>}
      {required.length > 0 && <div>Required: {required.join(' | ')}</div>}
      {checkpoint.generator?.role && <div>Role: {checkpoint.generator.role}</div>}
      {checkpoint.generator?.mode && <div>Mode: {checkpoint.generator.mode}</div>}
      {checkpoint.distributor && <div>Flow: fan-out child runs</div>}
      {checkpoint.connector?.strategy && <div>Strategy: {checkpoint.connector.strategy}</div>}
      {checkpoint.output_spec && <div>Output Spec Keys: {Object.keys(checkpoint.output_spec).join(', ') || 'none'}</div>}
    </div>
  );
};

const PipelineExtendedNode: React.FC<PipelineExtendedNodeProps> = ({
  node,
  isSelected,
  isSettingsOpen,
  onSelect,
  onToggleSettings,
  onPointerDown,
}) => {
  const type = node.checkpoint.type || 'prompt';
  const isGenerator = type === 'generator';

  return (
    <div
      className={`absolute min-w-0 border px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.34)] ${styles[type]} ${isSelected ? 'ring-2 ring-white/60' : ''} ${node.isSecondary ? 'opacity-55' : ''}`}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height, touchAction: 'none' }}
      onClick={() => onSelect(node.checkpoint.id)}
      onPointerDown={(event) => onPointerDown(node.checkpoint.id, event)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
            {type}
          </div>
          <h4 className="mt-2 max-w-full break-words text-[13px] font-semibold leading-[1.15]" style={{ overflowWrap: 'anywhere' }}>
            {node.checkpoint.name}
          </h4>
        </div>
        <button
          type="button"
          aria-label={`Open ${node.checkpoint.name} settings`}
          className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80 hover:border-white/35"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSettings(node.checkpoint.id);
          }}
        >
          ⚙
        </button>
      </div>

      {node.modelSummary && (
        <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/50">{node.modelSummary}</div>
      )}

      {isGenerator && <div className="pointer-events-none absolute inset-x-4 bottom-3 h-px bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" />}

      {type === 'distributor' && (
        <div className="pointer-events-none absolute -right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {[0, 1, 2].map((item) => <span key={item} className="h-1.5 w-8 rounded-full bg-amber-300/85" />)}
        </div>
      )}

      {type === 'connector' && (
        <div className="pointer-events-none absolute -left-5 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {[0, 1, 2].map((item) => <span key={item} className="h-1.5 w-8 rounded-full bg-emerald-300/85" />)}
        </div>
      )}

      {isSettingsOpen && details(node)}
    </div>
  );
};

export default PipelineExtendedNode;
