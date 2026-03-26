import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Series, Character, Episode, updateEpisode, deleteEpisode } from '../../api/series';
import { useSeriesDetails } from '../../hooks/useSeriesData';
import SeriesHeader from './SeriesHeader';
import CharacterStrip from './CharacterStrip';
import EpisodeCard from './EpisodeCard';
import GenerateEpisodeModal from './GenerateEpisodeModal';
import PipelineAPI from '../../api/pipeline';
import { PipelineRun } from '../../api/structs/pipeline';

interface Props {
  series: Series;
  onBack: () => void;
  onSeriesUpdated: (series: Series) => void;
}

const TERMINAL_STATES = ['completed', 'failed', 'cancelled'];

function tryExtractClipId(output: string): string | undefined {
  const trimmed = output.trim();
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.clip_id ?? parsed?.id ?? undefined;
  } catch {
    return undefined;
  }
}

const SeriesPage: React.FC<Props> = ({ series, onBack, onSeriesUpdated }) => {
  const { characters, episodes, setEpisodes, loading, refresh } = useSeriesDetails(series.id);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeRuns, setActiveRuns] = useState<Map<string, PipelineRun>>(new Map());

  // Ref so polling closure always sees latest episodes
  const episodesRef = useRef<Episode[]>([]);
  useEffect(() => { episodesRef.current = episodes; }, [episodes]);

  const onRunCompleted = useCallback(async (run: PipelineRun) => {
    const episode = episodesRef.current.find((e) => e.metadata?.run_id === run.id);
    if (!episode || episode.metadata?.status === 'complete') return;

    const lastOutput = [...run.results].reverse().find((r) => r.output)?.output ?? '';
    const clipId = lastOutput ? tryExtractClipId(lastOutput) : undefined;

    try {
      const updated = await updateEpisode(episode, {
        metadata: { ...episode.metadata, status: 'complete', clip_id: clipId },
      });
      setEpisodes((prev) => prev.map((e) => (e.id === episode.id ? updated : e)));
    } catch { /* ignore */ }
  }, [setEpisodes]);

  const onRunFailed = useCallback(async (run: PipelineRun) => {
    const episode = episodesRef.current.find((e) => e.metadata?.run_id === run.id);
    if (!episode || episode.metadata?.status === 'failed') return;
    try {
      const updated = await updateEpisode(episode, {
        metadata: { ...episode.metadata, status: 'failed', error: `Pipeline ${run.status}` },
      });
      setEpisodes((prev) => prev.map((e) => (e.id === episode.id ? updated : e)));
    } catch { /* ignore */ }
  }, [setEpisodes]);

  // Restore in-progress runs when episodes first load
  useEffect(() => {
    if (episodes.length === 0) return;
    const generatingEps = episodes.filter((e) => e.metadata?.status === 'generating' && e.metadata?.run_id);
    generatingEps.forEach(async (ep) => {
      const runId = ep.metadata.run_id!;
      if (activeRuns.has(runId)) return;
      try {
        const run = await PipelineAPI.getPipeline(runId);
        setActiveRuns((prev) => new Map(prev).set(runId, run));
        if (run.status === 'completed') onRunCompleted(run);
        else if (run.status === 'failed' || run.status === 'cancelled') onRunFailed(run);
      } catch {
        try {
          const updated = await updateEpisode(ep, {
            metadata: { ...ep.metadata, status: 'failed', error: 'Run interrupted — retry to regenerate' },
          });
          setEpisodes((prev) => prev.map((e) => (e.id === ep.id ? updated : e)));
        } catch { /* ignore */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes.length]);

  // Poll non-terminal runs
  useEffect(() => {
    const active = Array.from(activeRuns.values()).filter((r) => !TERMINAL_STATES.includes(r.status));
    if (active.length === 0) return;
    const interval = setInterval(async () => {
      for (const run of active) {
        try {
          const updated = await PipelineAPI.getPipeline(run.id);
          setActiveRuns((prev) => new Map(prev).set(updated.id, updated));
          if (updated.status === 'completed') onRunCompleted(updated);
          else if (updated.status === 'failed' || updated.status === 'cancelled') onRunFailed(updated);
        } catch { /* ignore */ }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRuns, onRunCompleted, onRunFailed]);

  const handleCharacterSaved = useCallback((_char: Character) => { refresh(); }, [refresh]);

  const handleEpisodeStarted = useCallback((episode: Episode, runId: string) => {
    setEpisodes((prev) => {
      const exists = prev.find((e) => e.id === episode.id);
      return exists ? prev.map((e) => (e.id === episode.id ? episode : e)) : [...prev, episode];
    });
    PipelineAPI.getPipeline(runId)
      .then((run) => setActiveRuns((prev) => new Map(prev).set(runId, run)))
      .catch(() => {});
  }, [setEpisodes]);

  const handleRetry = useCallback((episode: Episode) => {
    updateEpisode(episode, {
      metadata: { ...episode.metadata, status: 'draft', run_id: undefined, error: undefined },
    })
      .then((updated) => setEpisodes((prev) => prev.map((e) => (e.id === episode.id ? updated : e))))
      .catch(() => {});
  }, [setEpisodes]);

  const handleDeleteEpisode = useCallback((episode: Episode) => {
    deleteEpisode(episode.id)
      .then(() => setEpisodes((prev) => prev.filter((e) => e.id !== episode.id)))
      .catch(() => {});
  }, [setEpisodes]);

  return (
    <div className="space-y-4">
      <SeriesHeader
        series={series}
        onBack={onBack}
        onUpdated={onSeriesUpdated}
        onGenerate={() => setShowGenerate(true)}
      />

      <div>
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Characters</h3>
        <CharacterStrip
          seriesId={series.id}
          characters={characters}
          onCharacterSaved={handleCharacterSaved}
        />
      </div>

      <div>
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Episodes</h3>

        {loading && episodes.length === 0 && (
          <p className="text-slate-500 text-sm">Loading…</p>
        )}

        {!loading && episodes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
            <p className="text-sm">No episodes yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowGenerate(true)}>
              Generate First Episode
            </button>
          </div>
        )}

        <div className="space-y-3">
          {episodes.map((episode) => {
            const runId = episode.metadata?.run_id;
            const activeRun = runId ? (activeRuns.get(runId) ?? null) : null;
            return (
              <EpisodeCard
                key={episode.id}
                episode={episode}
                activeRun={activeRun}
                onGenerate={() => setShowGenerate(true)}
                onRetry={() => handleRetry(episode)}
                onDelete={() => handleDeleteEpisode(episode)}
              />
            );
          })}
        </div>
      </div>

      <GenerateEpisodeModal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        series={series}
        characters={characters}
        episodes={episodes}
        onStarted={handleEpisodeStarted}
      />
    </div>
  );
};

export default SeriesPage;
