import React from 'react';
import { PipelineRun } from '../../../api/structs';
import { Button } from '../../ui';

interface RunTerminalFooterProps {
  status: PipelineRun['status'];
  onRemove: () => void;
}

const terminalLabel = (status: PipelineRun['status']) => {
  if (status === 'completed') return 'Pipeline completed';
  if (status === 'failed') return 'Pipeline failed';
  if (status === 'cancelled') return 'Pipeline cancelled';
  return '';
};

const terminalClassName = (status: PipelineRun['status']) => {
  if (status === 'cancelled') return 'text-xs text-slate-400 uppercase tracking-wide';
  return 'text-xs text-zinc-200 uppercase tracking-wide';
};

const RunTerminalFooter: React.FC<RunTerminalFooterProps> = ({ status, onRemove }) => {
  const label = terminalLabel(status);
  if (!label) return null;

  return (
    <div className="px-3 pb-3">
      <div className="flex justify-between items-center p-2.5 bg-black/40 border border-white/15 rounded">
        <p className={terminalClassName(status)}>{label}</p>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
};

export default RunTerminalFooter;

