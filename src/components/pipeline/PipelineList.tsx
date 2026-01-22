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
      <div className="p-4 text-gray-400 text-center">
        Loading pipelines...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">Pipelines</span>
        <button
          onClick={onCreate}
          className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pipelines.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No pipelines yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {pipelines.map((pipeline) => (
              <li key={pipeline.id}>
                <button
                  onClick={() => onSelect(pipeline.id)}
                  className={`
                    w-full text-left p-3 transition-colors
                    ${selectedId === pipeline.id
                      ? 'bg-blue-600/20 border-l-2 border-blue-500'
                      : 'hover:bg-gray-700/50'
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
                      className="text-red-400 hover:text-red-300 text-xs px-1 opacity-0 group-hover:opacity-100"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {pipeline.checkpoints.length} checkpoint(s) • v{pipeline.version}
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