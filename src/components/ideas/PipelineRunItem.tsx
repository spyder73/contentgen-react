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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<number | null>(null);

  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const isPaused = run.status === 'paused';

  const getStatusBadge = () => {
    switch (run.status) {
      case 'running':
        return <Badge variant="blue">Running</Badge>;
      case 'paused':
        return <Badge variant="yellow">Awaiting Review</Badge>;
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      case 'failed':
        return <Badge variant="red">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{run.status}</Badge>;
    }
  };

  const getProgressPercent = () => {
    const total = template.checkpoints.length || 1;
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
    <div className="bg-black/50 border border-white/15 overflow-hidden">
      <div
        className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {run.initial_input.slice(0, 56)}
              {run.initial_input.length > 56 ? '...' : ''}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              {template.name} | Step {run.current_checkpoint + 1}/{template.checkpoints.length}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 ml-3">
          {!isTerminal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </Button>
          )}
          <span className="text-slate-400 text-xs uppercase tracking-wide">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>

      <div className="h-1 bg-white/10">
        <div
          className={`h-full transition-all duration-300 pipeline-progress ${
            run.status === 'completed' ? 'bg-white' : 'bg-zinc-400'
          }`}
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>

      {isExpanded && (
        <div>
          <div className="p-3 space-y-2">
            {template.checkpoints.map((checkpoint, index) => {
              const result = run.results?.[index];
              const isCurrent = index === run.current_checkpoint;
              const isComplete = result?.status === 'completed';
              const isFailed = result?.status === 'failed';
              const isPending = !result;

              return (
                <div
                  key={checkpoint.id}
                  className={`rounded border ${
                    isCurrent && !isTerminal
                      ? 'bg-white/10 border-white/40'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div
                    className="flex items-center justify-between p-2.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (result) {
                        setSelectedCheckpoint(selectedCheckpoint === index ? null : index);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          isComplete
                            ? 'bg-white text-black'
                            : isFailed
                            ? 'bg-zinc-500 text-black'
                            : isCurrent && !isTerminal
                            ? 'bg-zinc-200 text-black animate-pulse'
                            : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {isComplete ? 'OK' : isFailed ? 'X' : isPending ? '-' : index + 1}
                      </span>
                      <span className="text-white font-medium text-xs">{checkpoint.name}</span>
                    </div>

                    {result && (
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                        {selectedCheckpoint === index ? 'Hide' : 'Show'}
                      </span>
                    )}
                  </div>

                  {selectedCheckpoint === index && result && (
                    <div className="px-2.5 pb-2.5 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <pre className="text-[11px] text-slate-300 bg-black/70 p-2 rounded overflow-auto max-h-56 border border-white/10">
                        {formatOutput(result.output)}
                      </pre>

                      {isCurrent && isPaused && (
                        <div className="flex items-center gap-2 p-2 border border-white/20 bg-white/5 rounded">
                          <p className="text-xs text-zinc-300 flex-1">Review output before continuing.</p>
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
                                Regenerate
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
                              Continue
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isCurrent && checkpoint.allow_regenerate && !isTerminal && isComplete && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate(index);
                          }}
                        >
                          Regenerate Step
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isTerminal && (
            <div className="px-3 pb-3">
              <div className="flex justify-between items-center p-2.5 bg-black/40 border border-white/15 rounded">
                {run.status === 'completed' && (
                  <p className="text-xs text-zinc-200 uppercase tracking-wide">Pipeline completed</p>
                )}
                {run.status === 'failed' && (
                  <p className="text-xs text-zinc-200 uppercase tracking-wide">Pipeline failed</p>
                )}
                {run.status === 'cancelled' && (
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Pipeline cancelled</p>
                )}
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  Remove
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
