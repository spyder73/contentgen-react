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

  const getInputSources = (checkpoint: CheckpointConfig): string[] => {
    return Object.entries(checkpoint.input_mapping || {}).map(([key, value]) => {
      if (value === 'initial_input') return `${key}: user input`;
      if (value.startsWith('checkpoint:')) {
        return `${key}: ${value.replace('checkpoint:', '')}`;
      }
      return `${key}: ${value}`;
    });
  };

  return (
    <div className="space-y-2">
      {/* Start Node */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          ▶
        </div>
        <span className="text-sm text-gray-400">User Input</span>
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
              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
              ${selectedCheckpointId === checkpoint.id
                ? 'bg-blue-900/50 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                : 'bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-750'
              }
            `}
          >
            {/* Step Number */}
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
                ${selectedCheckpointId === checkpoint.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
                }
              `}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white truncate">
                  {checkpoint.name}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckpointRemove(checkpoint.id);
                  }}
                  className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-900/30 transition-colors"
                  title="Remove checkpoint"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-gray-500 truncate mt-0.5">
                {getPromptName(checkpoint.prompt_template_id)}
              </p>

              {/* Input Sources */}
              {getInputSources(checkpoint).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getInputSources(checkpoint).map((source, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              <div className="flex gap-1 mt-2">
                {checkpoint.requires_confirm && (
                  <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                    ⏸ Confirm
                  </span>
                )}
                {checkpoint.allow_regenerate && (
                  <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                    🔄 Regen
                  </span>
                )}
                {checkpoint.allow_attachments && (
                  <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded">
                    📎 Files
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
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                ▲
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
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                ▼
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
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              ■
            </div>
            <span className="text-sm text-gray-400">Output</span>
          </div>
        </>
      )}
    </div>
  );
};

export default PipelineFlow;