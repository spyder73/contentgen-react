import React from 'react';
import { CheckpointConfig, PromptTemplate } from '../../api/structs';

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

  const distributorById = checkpoints.reduce<Record<string, CheckpointConfig>>((acc, checkpoint) => {
    if ((checkpoint.type || 'prompt') === 'distributor') {
      acc[checkpoint.id] = checkpoint;
    }
    return acc;
  }, {});

  const getInputSources = (checkpoint: CheckpointConfig): string[] => {
    return Object.entries(checkpoint.input_mapping || {}).map(([key, value]) => {
      if (value === 'initial_input') return `${key}: user input`;
      if (value.startsWith('checkpoint:')) {
        const sourceId = value.replace('checkpoint:', '');
        const source = distributorById[sourceId];
        if (source) {
          return `${key}: ${sourceId} (distributor output)`;
        }
        return `${key}: ${sourceId}`;
      }
      return `${key}: ${value}`;
    });
  };

  const getConnectorSources = (checkpoint: CheckpointConfig): string[] => {
    const checkpointType = checkpoint.type || 'prompt';
    if (checkpointType === 'connector') {
      const configuredSource = checkpoint.connector?.source_checkpoint_id;
      if (configuredSource && distributorById[configuredSource]) {
        return [configuredSource];
      }

      const allDistributorIds = previousDistributors(checkpoint.id);
      if (allDistributorIds.length > 0) {
        return [allDistributorIds[allDistributorIds.length - 1]];
      }
      return [];
    }
    return [];
  };

  const previousDistributors = (checkpointId: string): string[] => {
    const current = checkpoints.findIndex((item) => item.id === checkpointId);
    if (current <= 0) return [];
    return checkpoints
      .slice(0, current)
      .filter((item) => (item.type || 'prompt') === 'distributor')
      .map((item) => item.id);
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
      {checkpoints.map((checkpoint, index) => (
        <div key={checkpoint.id}>
          {/* Checkpoint Node */}
          <div
            onClick={() => onCheckpointClick(checkpoint.id)}
            className={`
              flex items-start gap-2 p-2.5 rounded cursor-pointer transition-all
              ${selectedCheckpointId === checkpoint.id
                ? 'bg-white/10 border border-white/35'
                : 'bg-black/50 border border-white/15 hover:border-white/25 hover:bg-white/5'
              }
            `}
          >
            {/* Step Number */}
            <div
              className={`
                w-8 h-8 border flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${selectedCheckpointId === checkpoint.id
                  ? 'bg-white text-black border-white'
                  : 'bg-black border-white/20 text-gray-300'
                }
              `}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {(() => {
                const checkpointType = checkpoint.type || 'prompt';
                const isConnector = checkpointType === 'connector';
                return (
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {checkpointType === 'distributor' && (
                      <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold">
                        Distributor
                      </span>
                    )}
                    {isConnector && (
                      <span className="text-[10px] bg-zinc-800 border border-white/20 text-zinc-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Connector
                      </span>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white truncate text-xs uppercase tracking-wide">
                  {checkpoint.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckpointRemove(checkpoint.id);
                  }}
                  className="text-gray-500 hover:text-white p-1 rounded border border-transparent hover:border-white/20 transition-colors text-[10px]"
                  title="Remove checkpoint"
                >
                  Remove
                </button>
              </div>

              <p className="text-[10px] text-gray-500 truncate mt-0.5 uppercase tracking-wide">
                {getPromptName(checkpoint.prompt_template_id)}
              </p>

              {/* Input Sources */}
              {getInputSources(checkpoint).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getInputSources(checkpoint).map((source, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}

              {(checkpoint.type || 'prompt') === 'distributor' && (
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  Fan-out: delimiter {checkpoint.distributor?.delimiter || 'newline'} | max{' '}
                  {checkpoint.distributor?.max_children || 8} children
                </p>
              )}

              {getConnectorSources(checkpoint).length > 0 && (
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-wide">
                  Fan-in from {getConnectorSources(checkpoint).join(', ')}
                </p>
              )}

              {/* Badges */}
              <div className="flex gap-1 mt-2">
                {checkpoint.requires_confirm && (
                  <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wide">
                    Confirm
                  </span>
                )}
                {checkpoint.allow_regenerate && (
                  <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wide">
                    Regen
                  </span>
                )}
                {checkpoint.allow_attachments && (
                  <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wide">
                    Files
                  </span>
                )}
              </div>
            </div>

            {/* Reorder Handles */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) onReorder(index, index - 1);
                }}
                disabled={index === 0}
                className={`text-xs px-1.5 py-0.5 rounded ${
                  index === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Up
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < checkpoints.length - 1) onReorder(index, index + 1);
                }}
                disabled={index === checkpoints.length - 1}
                className={`text-xs px-1.5 py-0.5 rounded ${
                  index === checkpoints.length - 1
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Down
              </button>
            </div>
          </div>

          {/* Connector to next */}
          {index < checkpoints.length - 1 && (
            <div className="ml-5 w-0.5 h-4 bg-gray-600" />
          )}
        </div>
      ))}

      {/* End Node */}
      {checkpoints.length > 0 && (
        <>
          <div className="ml-5 w-0.5 h-4 bg-gray-600" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/25 bg-black/60 flex items-center justify-center text-zinc-300 text-xs font-semibold">
              OUT
            </div>
            <span className="text-xs uppercase tracking-wide text-gray-400">Output</span>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineFlow;
