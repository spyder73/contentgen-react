import React, { useState } from 'react';
import { PipelineRun, PipelineTemplate } from '../../api/structs';
import { Button, Badge } from '../ui';

interface Props {
  run: PipelineRun;
  template: PipelineTemplate;
  onContinue: () => void;
  onRegenerate: (checkpoint: number) => void;
  onCancel: () => void;
  onRemove: () => void;
}

const PipelineRunItem: React.FC<Props> = ({
  run,
  template,
  onContinue,
  onRegenerate,
  onCancel,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);

  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const isPaused = run.status === 'paused';

  const getStatusBadge = () => {
    switch (run.status) {
      case 'running':
        return <Badge variant="blue">⏳ Running</Badge>;
      case 'paused':
        return <Badge variant="yellow">⏸ Awaiting Review</Badge>;
      case 'completed':
        return <Badge variant="green">✓ Completed</Badge>;
      case 'failed':
        return <Badge variant="red">✗ Failed</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{run.status}</Badge>;
    }
  };

  const getProgressPercent = () => {
    const total = template.checkpoints.length;
    if (isTerminal) return 100;
    return Math.round((run.current_checkpoint / total) * 100);
  };

  const formatOutput = (output: string): string => {
    try {
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg">🔄</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {run.initial_input.slice(0, 50)}
              {run.initial_input.length > 50 ? '...' : ''}
            </p>
            <p className="text-xs text-slate-500">
              {template.name} • Step {run.current_checkpoint + 1}/{template.checkpoints.length}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 ml-3">
          {!isTerminal && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
              ✕
            </Button>
          )}
          <span className="text-slate-400 text-sm">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-700">
        <div
          className={`h-full transition-all duration-300 ${
            run.status === 'failed' ? 'bg-red-500' :
            run.status === 'completed' ? 'bg-green-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>

      {/* Expanded Content - Scrollable */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          <div className="p-4 space-y-2">
            {/* Checkpoint Steps */}
            {template.checkpoints.map((checkpoint, index) => {
              const result = run.results?.[index];
              const isCurrent = index === run.current_checkpoint;
              const isComplete = result?.status === 'completed';
              const isFailed = result?.status === 'failed';
              const isPending = !result;

              return (
                <div
                  key={checkpoint.id}
                  className={`
                    rounded border transition-colors
                    ${isCurrent && !isTerminal
                      ? 'bg-blue-900/30 border-blue-600'
                      : isComplete
                        ? 'bg-green-900/20 border-green-800/50'
                        : isFailed
                          ? 'bg-red-900/20 border-red-800/50'
                          : 'bg-slate-800/50 border-slate-700'
                    }
                  `}
                >
                  {/* Checkpoint Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (result) {
                        setSelectedCheckpoint(selectedCheckpoint === index ? null : index);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${isComplete ? 'bg-green-600 text-white' :
                          isFailed ? 'bg-red-600 text-white' :
                          isCurrent && !isTerminal ? 'bg-blue-600 text-white animate-pulse' :
                          'bg-slate-600 text-slate-400'
                        }
                      `}>
                        {isComplete ? '✓' : isFailed ? '✗' : isPending ? '○' : index + 1}
                      </span>
                      <span className="text-white font-medium text-sm">{checkpoint.name}</span>
                    </div>

                    {result && (
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {selectedCheckpoint === index ? '▲' : '▼'}
                      </span>
                    )}
                  </div>

                  {/* Expanded Result with Actions */}
                  {selectedCheckpoint === index && result && (
                    <div className="px-3 pb-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Output */}
                      <div className="relative">
                        <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-auto max-h-64 border border-slate-700">
                          {formatOutput(result.output)}
                        </pre>
                      </div>

                      {/* Actions directly below output */}
                      {isCurrent && isPaused && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
                          <span className="text-yellow-400 text-lg flex-shrink-0">⏸</span>
                          <p className="text-sm text-yellow-300 flex-1">
                            Review the output above
                          </p>
                          <div className="flex gap-2 flex-shrink-0">
                            {checkpoint.allow_regenerate && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRegenerate(index);
                                }}
                              >
                                🔄 Regenerate
                              </Button>
                            )}
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                onContinue();
                              }}
                            >
                              ✓ Continue
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Regenerate button for completed steps (not current) */}
                      {!isCurrent && checkpoint.allow_regenerate && !isTerminal && isComplete && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate(index);
                          }}
                        >
                          🔄 Regenerate this step
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Terminal State Actions */}
          {isTerminal && (
            <div className="px-4 pb-4">
              <div className="flex justify-between items-center p-3 bg-slate-800/50 border border-slate-700 rounded">
                {run.status === 'completed' && (
                  <p className="text-sm text-green-400">✓ Pipeline completed successfully</p>
                )}
                {run.status === 'failed' && (
                  <p className="text-sm text-red-400">✗ Pipeline failed</p>
                )}
                {run.status === 'cancelled' && (
                  <p className="text-sm text-slate-400">Pipeline was cancelled</p>
                )}
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  🗑️ Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PipelineRunItem;