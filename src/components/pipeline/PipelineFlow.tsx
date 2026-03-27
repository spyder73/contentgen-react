import React from 'react';
import { CheckpointConfig, PromptTemplate } from '../../api/structs';
import {
  checkpointType,
  normalizeGeneratorMediaType,
  resolveCheckpointDisplay,
} from './utils';

interface PipelineFlowProps {
  checkpoints: CheckpointConfig[];
  promptTemplates: PromptTemplate[];
  selectedCheckpointId: string | null;
  onCheckpointClick: (id: string) => void;
  onCheckpointRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const PipelineFlow: React.FC<PipelineFlowProps> = ({
  checkpoints,
  promptTemplates,
  selectedCheckpointId,
  onCheckpointClick,
  onCheckpointRemove,
  onReorder,
}) => {
  const getPromptName = (promptId: string): string => {
    const template = promptTemplates.find((t) => t.id === promptId);
    return template?.name || promptId || 'No prompt';
  };

  return (
    <div className="space-y-2">
      {/* Start Node */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-white/25 bg-black/60 flex items-center justify-center text-zinc-300 text-xs font-semibold">
          IN
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-400">User Input</span>
      </div>

      {/* Connector */}
      {checkpoints.length > 0 && (
        <div className="ml-5 w-0.5 h-4 bg-gray-600" />
      )}

      {/* Checkpoints */}
      {checkpoints.map((checkpoint, index) => {
        const resolved = resolveCheckpointDisplay(checkpoints, index);
        const type = checkpointType(checkpoint);

        return (
          <div key={checkpoint.id}>
            {/* Checkpoint Node */}
            <div
              onClick={() => onCheckpointClick(checkpoint.id)}
              className={`
                group flex items-start gap-2 p-2.5 rounded cursor-pointer transition-all
                ${type === 'generator' && selectedCheckpointId !== checkpoint.id
                  ? 'bg-sky-500/10 border border-sky-400/40 hover:border-sky-300/60'
                  : ''
                }
                ${selectedCheckpointId === checkpoint.id
                  ? 'bg-white/10 border border-white/35'
                  : 'bg-black/50 border border-white/15 hover:border-white/25 hover:bg-white/5'
                }
              `}
            >
              {/* Step number badge */}
              <div
                className={`
                  w-8 h-8 border flex items-center justify-center text-xs font-semibold flex-shrink-0
                  ${selectedCheckpointId === checkpoint.id
                    ? 'bg-white text-black border-white'
                    : type === 'generator'
                    ? 'bg-sky-200 text-sky-950 border-sky-200'
                    : 'bg-black border-white/20 text-gray-300'
                  }
                `}
              >
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {checkpoint.name}
                  </span>
                  {type !== 'prompt' && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-white/20 text-gray-400">
                      {type === 'distributor' ? 'Distributor' : type === 'connector' ? 'Connector' : 'Generator'}
                    </span>
                  )}
                </div>

                {/* Prompt template */}
                {checkpoint.prompt_template_id && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    prompt: {getPromptName(checkpoint.prompt_template_id)}
                  </div>
                )}

                {/* Input sources */}
                {resolved.inputSources.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {resolved.inputSources.map((source, i) => (
                      <div key={i} className="text-[11px] text-gray-500">
                        {source}
                      </div>
                    ))}
                  </div>
                )}

                {/* Distributor fan-out info */}
                {type === 'distributor' && checkpoint.distributor && (
                  <div className="text-[11px] text-amber-400/80 mt-1">
                    Fan-out: delimiter {checkpoint.distributor.delimiter} | max {checkpoint.distributor.max_children} children
                  </div>
                )}

                {/* Connector fan-in info */}
                {type === 'connector' && resolved.connectorSources.length > 0 && (
                  <div className="text-[11px] text-emerald-400/80 mt-1">
                    Fan-in from {resolved.connectorSources.join(', ')}
                  </div>
                )}

                {/* Generator output info */}
                {type === 'generator' && checkpoint.generator?.media_type && (
                  <div className="text-[11px] text-sky-400/80 mt-1">
                    Output: {normalizeGeneratorMediaType(checkpoint.generator.media_type)}
                  </div>
                )}

                {/* Required assets */}
                {resolved.requiredAssetCount > 0 && (
                  <div className="text-[11px] text-purple-400/70 mt-1">
                    Req {resolved.requiredAssetCount}
                  </div>
                )}

                {/* Flags */}
                <div className="flex gap-2 mt-1">
                  {checkpoint.requires_confirm && (
                    <span className="text-[10px] text-yellow-500/70">⏸ Confirm</span>
                  )}
                  {checkpoint.allow_regenerate && (
                    <span className="text-[10px] text-blue-400/70">🔄 Regen</span>
                  )}
                  {checkpoint.type === 'upload' && (
                    <span className="text-[10px] text-green-400/70">📎 Attach</span>
                  )}
                </div>
              </div>

              {/* Reorder + remove */}
              <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(index, index - 1); }}
                  disabled={index === 0}
                  className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs px-1 py-0.5 leading-none"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReorder(index, index + 1); }}
                  disabled={index === checkpoints.length - 1}
                  className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs px-1 py-0.5 leading-none"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCheckpointRemove(checkpoint.id); }}
                  className="text-zinc-500 hover:text-red-400 text-xs px-1 py-0.5 leading-none mt-0.5"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Connector to next */}
            {index < checkpoints.length - 1 && (
              <div className="ml-5 w-0.5 h-4 bg-gray-600" />
            )}
          </div>
        );
      })}

      {/* End Node */}
      {checkpoints.length > 0 && (
        <>
          <div className="ml-5 w-0.5 h-4 bg-gray-600" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/25 bg-black/60 flex items-center justify-center text-zinc-300 text-xs font-semibold">
              OUT
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">Pipeline Output</span>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineFlow;
