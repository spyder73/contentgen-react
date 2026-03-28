import React, { useState } from 'react';
import { Episode } from '../../api/series';
import { PipelineRun } from '../../api/structs/pipeline';
import EpisodeSceneStrip from './EpisodeSceneStrip';
import ClipPlayer from '../clips/ClipPlayer';
import { constructMediaUrl } from '../../api/helpers';

interface Props {
  episode: Episode;
  activeRun: PipelineRun | null;
  onGenerate: () => void;
  onRetry: () => void;
  onDelete?: () => void;
}

// Derive episode status from metadata, with fallback to run state
function resolveStatus(episode: Episode, activeRun: PipelineRun | null) {
  const metaStatus = episode.metadata?.status ?? 'draft';
  if (metaStatus === 'generating' && activeRun) {
    if (activeRun.status === 'completed') return 'complete';
    if (activeRun.status === 'failed' || activeRun.status === 'cancelled') return 'failed';
  }
  return metaStatus;
}

function checkpointStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-500';
    case 'running': return 'bg-blue-400 animate-pulse';
    case 'failed': return 'bg-red-500';
    case 'skipped': return 'bg-white/20';
    default: return 'bg-white/10';
  }
}

const EpisodeCard: React.FC<Props> = ({ episode, activeRun, onGenerate, onRetry, onDelete }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const status = resolveStatus(episode, activeRun);

  // Progress percentage for generating state
  const progress = activeRun
    ? (() => {
        const total = activeRun.results.length;
        if (total === 0) return 0;
        const done = activeRun.results.filter((r) => r.status === 'completed' || r.status === 'skipped').length;
        return Math.round((done / total) * 100);
      })()
    : 0;

  const clipUrl = episode.metadata?.clip_id
    ? constructMediaUrl(`/clips/${episode.metadata.clip_id}/video`)
    : null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/3 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {episode.episode_number > 0 && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ep {episode.episode_number}</span>
            )}
            <h3 className="text-white text-sm font-medium truncate">{episode.title}</h3>
          </div>
          {episode.synopsis && (
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{episode.synopsis}</p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`flex-shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
            status === 'complete'
              ? 'bg-emerald-900/40 text-emerald-400'
              : status === 'generating'
              ? 'bg-blue-900/40 text-blue-400'
              : status === 'failed'
              ? 'bg-red-900/40 text-red-400'
              : 'bg-white/5 text-slate-500'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Draft state */}
      {status === 'draft' && (
        <button className="btn btn-primary btn-sm w-full" onClick={onGenerate}>
          Generate Episode
        </button>
      )}

      {/* Generating state */}
      {status === 'generating' && activeRun && (
        <div className="space-y-2">
          {/* Progress bar */}
          <div className="h-1 bg-white/10 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checkpoint dots */}
          <div className="flex flex-wrap gap-1">
            {activeRun.results.map((result, i) => (
              <div
                key={i}
                title={result.checkpoint_id}
                className={`w-2 h-2 rounded-full ${checkpointStatusColor(result.status)}`}
              />
            ))}
          </div>

          <p className="text-slate-500 text-xs">
            {progress}% — {activeRun.results.filter((r) => r.status === 'completed').length} of {activeRun.results.length} checkpoints
          </p>
        </div>
      )}

      {/* Generating but no run in memory (reload recovery) */}
      {status === 'generating' && !activeRun && (
        <div className="space-y-2">
          <div className="h-1 bg-white/10 rounded overflow-hidden">
            <div className="h-full bg-blue-500/50 w-1/3 animate-pulse" />
          </div>
          <p className="text-slate-500 text-xs">Generation in progress…</p>
        </div>
      )}

      {/* Complete state */}
      {status === 'complete' && (
        <div className="space-y-2">
          <EpisodeSceneStrip run={activeRun} />
          {clipUrl && (
            <button
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              onClick={() => setShowPlayer(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch
            </button>
          )}
        </div>
      )}

      {/* Failed state */}
      {status === 'failed' && (
        <div className="space-y-2">
          {episode.metadata?.error && (
            <p className="text-red-400 text-xs">{episode.metadata.error}</p>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Delete action */}
      {onDelete && (
        <div className="flex justify-end">
          <button onClick={onDelete} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors uppercase tracking-wider">
            Delete
          </button>
        </div>
      )}

      {/* Clip player overlay */}
      {showPlayer && clipUrl && (
        <ClipPlayer
          clipUrl={clipUrl}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

export default EpisodeCard;
