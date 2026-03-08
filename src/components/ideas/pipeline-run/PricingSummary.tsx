import React from 'react';
import { PipelineRun } from '../../../api/structs';
import { formatCost, parsePricingSummary } from './helpers';

interface PricingSummaryProps {
  run: PipelineRun;
}

const providerLabel = (provider: string): string =>
  provider === 'openrouter' ? 'OpenRouter' : provider === 'runware' ? 'Runware' : provider;

const PricingSummary: React.FC<PricingSummaryProps> = ({ run }) => {
  const summary = React.useMemo(() => parsePricingSummary(run), [run]);
  if (!summary) return null;

  return (
    <div className="attachment-surface space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="attachment-state">Pricing Summary</p>
        {summary.hasEstimated && <p className="attachment-meta text-amber-300">Estimated values</p>}
      </div>

      {summary.run.length > 0 && (
        <div className="space-y-1">
          <p className="attachment-meta uppercase tracking-wide">Per Run</p>
          {summary.run.map((line) => (
            <p key={`run-${line.provider}`} className="attachment-meta">
              {providerLabel(line.provider)}: {formatCost(line.value, line.currency)}
              {line.estimated ? ' (estimated)' : ''}
            </p>
          ))}
        </div>
      )}

      {summary.perClip.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/10">
          <p className="attachment-meta uppercase tracking-wide">Per Clip</p>
          {summary.perClip.map((line) => (
            <p key={`clip-${line.provider}`} className="attachment-meta">
              {providerLabel(line.provider)}: {formatCost(line.value, line.currency)}
              {line.clipCount ? ` · ${line.clipCount} clip${line.clipCount === 1 ? '' : 's'}` : ''}
              {line.estimated ? ' (estimated)' : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PricingSummary;
