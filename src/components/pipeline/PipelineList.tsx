import React from 'react';
import { PipelineListProps } from './types';

const PipelineList: React.FC<PipelineListProps> = ({
  pipelines,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 text-gray-400 text-center text-xs uppercase tracking-wide">
        Loading pipelines...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-gray-300">Pipelines</span>
        <button
          onClick={onCreate}
          className="btn btn-sm btn-ghost"
        >
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pipelines.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No pipelines yet
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {pipelines.map((pipeline) => (
              <li key={pipeline.id} className="group">
                <button
                  onClick={() => onSelect(pipeline.id)}
                  className={`
                    w-full text-left p-3 transition-colors
                    ${selectedId === pipeline.id
                      ? 'bg-white/10 border-l-2 border-white'
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white text-sm truncate">
                      {pipeline.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${pipeline.name}"?`)) {
                          onDelete(pipeline.id);
                        }
                      }}
                      className="text-zinc-300 hover:text-white text-[10px] px-2 py-0.5 border border-white/20 opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {pipeline.checkpoints.length} checkpoint(s) | v{pipeline.version}
                  </div>
                  {pipeline.description && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {pipeline.description}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PipelineList;
