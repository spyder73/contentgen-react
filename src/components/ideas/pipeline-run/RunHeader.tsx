import React from 'react';
import { PipelineRun } from '../../../api/structs';
import { Badge, Button } from '../../ui';

interface RunHeaderProps {
  run: PipelineRun;
  templateName: string;
  checkpointCount: number;
  isExpanded: boolean;
  isTerminal: boolean;
  onToggleExpand: () => void;
  onCancel: () => void;
}

const renderStatusBadge = (status: PipelineRun['status']) => {
  switch (status) {
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
      return <Badge variant="gray">{status}</Badge>;
  }
};

const RunHeader: React.FC<RunHeaderProps> = ({
  run,
  templateName,
  checkpointCount,
  isExpanded,
  isTerminal,
  onToggleExpand,
  onCancel,
}) => {
  return (
    <div
      className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5"
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {run.initial_input.slice(0, 56)}
            {run.initial_input.length > 56 ? '...' : ''}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            {templateName} | Step {run.current_checkpoint + 1}/{checkpointCount}
          </p>
        </div>
        {renderStatusBadge(run.status)}
      </div>

      <div className="flex items-center gap-2 ml-3">
        {!isTerminal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
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
  );
};

export default RunHeader;
