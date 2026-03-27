import React, { useCallback, useEffect, useRef, useState } from 'react';
import PipelineAPI from '../../../api/pipeline';
import { constructMediaUrl } from '../../../api/helpers';
import { MediaLibraryItem } from '../../../api/media';
import { PipelineRun, PipelineTemplate } from '../../../api/structs';
import { CheckpointInjectionMode, ChainConnection } from '../../../api/structs/pipeline';
import AttachmentLibraryModal from '../AttachmentLibraryModal';
import ConnectorSceneReferences, { toConnectorSceneReferenceEntries } from './ConnectorSceneReferences';
import SceneChainCablesEditor from './SceneChainCablesEditor';
import { mediaLibraryItemToAttachment } from './helpers';

interface DistributorConnectorBlockProps {
  run: PipelineRun;
  template: PipelineTemplate;
  distributorIndex: number;
  connectorIndex: number;
  isTerminal: boolean;
  isPaused: boolean;
  connectorInteraction: {
    progressionLoading: boolean;
    progressionError: string;
  };
  onConnectorContinue: () => void;
  onConnectorRegenerate: () => void;
  onConnectorInject: () => void;
}

// --- helpers ---

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

function findImageCheckpointIndex(childRun: PipelineRun, template: PipelineTemplate): number {
  for (let i = childRun.results.length - 1; i >= 0; i--) {
    const result = childRun.results[i];
    const hasImage = (result.attachments || []).some((a) =>
      (a.type || '').toLowerCase().includes('image')
    );
    if (hasImage) {
      const tIdx = template.checkpoints.findIndex((cp) => cp.id === result.checkpoint_id);
      return tIdx >= 0 ? tIdx : i;
    }
  }
  if (childRun.results.length > 0) {
    const last = childRun.results[childRun.results.length - 1];
    const tIdx = template.checkpoints.findIndex((cp) => cp.id === last.checkpoint_id);
    return tIdx >= 0 ? tIdx : childRun.results.length - 1;
  }
  return 0;
}

function getGeneratedImageUrl(childRun: PipelineRun): string | null {
  // Iterate results in reverse — generated reference_frame images come after seed_image uploads
  for (let i = childRun.results.length - 1; i >= 0; i--) {
    const result = childRun.results[i];
    for (const att of result.attachments || []) {
      const type = (att.type || '').toLowerCase();
      const role = (att.role || '').toLowerCase();
      if (type.includes('image') && role === 'reference_frame' && att.url) {
        return constructMediaUrl(att.url);
      }
    }
  }
  return null;
}

// --- useChildRun hook ---

function useChildRun(runId: string) {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await PipelineAPI.getPipeline(runId);
      setRun(data);
      if (TERMINAL_STATUSES.has(data.status)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (!intervalRef.current) {
        // Restart polling if it was stopped (e.g. after regeneration)
        intervalRef.current = setInterval(() => void fetch(), 2000);
      }
    } catch {
      setError('Failed to load');
    }
  }, [runId]);

  useEffect(() => {
    void fetch();
    intervalRef.current = setInterval(() => void fetch(), 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return { run, error, refetch: fetch };
}

// --- ChildPipelineCard ---

interface ChildPipelineCardProps {
  runId: string;
  sceneNumber: number;
  template: PipelineTemplate;
}

const ChildPipelineCard: React.FC<ChildPipelineCardProps> = ({ runId, sceneNumber, template }) => {
  const { run, error, refetch } = useChildRun(runId);
  const [injectText, setInjectText] = useState('');
  const [injectMode, setInjectMode] = useState<CheckpointInjectionMode>('guidance_only');
  const [showInject, setShowInject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickedImageUrl, setPickedImageUrl] = useState<string | null>(null);

  const isComplete = run?.status === 'completed';
  const isFailed = run?.status === 'failed';
  const isRunning = Boolean(run && !TERMINAL_STATUSES.has(run.status));
  const displayUrl = pickedImageUrl || (run ? getGeneratedImageUrl(run) : null);

  const handleRegenerate = async () => {
    if (!run) return;
    setActionLoading(true);
    setActionError('');
    setPickedImageUrl(null);
    try {
      const idx = findImageCheckpointIndex(run, template);
      await PipelineAPI.regenerateCheckpoint(runId, idx);
      await refetch();
    } catch {
      setActionError('Regenerate failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLibraryPick = async (items: MediaLibraryItem[]) => {
    if (!run || items.length === 0) return;
    setActionLoading(true);
    setActionError('');
    try {
      const idx = findImageCheckpointIndex(run, template);
      const role = template.checkpoints[idx]?.generator?.role || 'reference_frame';
      const attachment = mediaLibraryItemToAttachment(items[0], role);
      await PipelineAPI.addAttachment(runId, idx, attachment);
      setLibraryOpen(false);
      const previewUrl = items[0].url || items[0].preview_url || '';
      if (previewUrl) setPickedImageUrl(constructMediaUrl(previewUrl));
      await refetch();
    } catch {
      setActionError('Library pick failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInject = async () => {
    if (!run || !injectText.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      const idx = findImageCheckpointIndex(run, template);
      await PipelineAPI.injectCheckpointPrompt(runId, idx, injectText.trim(), {
        autoRegenerate: true,
        source: 'distributor_block',
        mode: injectMode,
      });
      setInjectText('');
      setShowInject(false);
      await refetch();
    } catch {
      setActionError('Inject failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col rounded border border-white/15 bg-black/50 overflow-hidden w-full">
      {/* Card header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 bg-white/5">
        <span className="text-[11px] text-zinc-200 font-medium">Scene {sceneNumber}</span>
        <span
          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
            isComplete
              ? 'bg-white text-black'
              : isFailed
              ? 'bg-zinc-500 text-black'
              : isRunning
              ? 'bg-zinc-200 text-black animate-pulse'
              : 'bg-zinc-700 text-zinc-300'
          }`}
        >
          {error ? 'error' : !run ? '...' : run.status}
        </span>
      </div>

      {/* Image area */}
      <div className="relative bg-black/40 flex items-center justify-center min-h-28">
        {displayUrl ? (
          <img
            key={displayUrl}
            src={displayUrl}
            alt={`Scene ${sceneNumber} reference`}
            className="w-full max-h-44 object-contain"
          />
        ) : (
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
            {error || (!run ? 'loading…' : isRunning ? 'generating…' : 'no image')}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="p-2 space-y-1.5 border-t border-white/10">
        <div className="flex flex-col gap-1.5">
          <button
            className="btn btn-sm btn-secondary w-full text-[10px]"
            onClick={() => void handleRegenerate()}
            disabled={actionLoading || isRunning}
          >
            {actionLoading && !showInject ? 'Regenerating…' : 'Regenerate'}
          </button>
          <button
            className={`btn btn-sm w-full text-[10px] ${showInject ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowInject((v) => !v)}
            disabled={actionLoading}
          >
            {showInject ? 'Cancel' : 'Inject Prompt'}
          </button>
        </div>
        <button
          className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
          onClick={() => setLibraryOpen(true)}
          disabled={actionLoading || isRunning}
        >
          Pick from library
        </button>

        {showInject && (
          <div className="space-y-1.5">
            <textarea
              value={injectText}
              onChange={(e) => setInjectText(e.target.value)}
              className="w-full input text-[11px] min-h-14"
              placeholder="Guidance to inject before regenerating…"
            />
            <div className="flex gap-3 text-[10px] text-zinc-400">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  checked={injectMode === 'guidance_only'}
                  onChange={() => setInjectMode('guidance_only')}
                />
                Guidance only
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  checked={injectMode === 'with_prior_output_context'}
                  onChange={() => setInjectMode('with_prior_output_context')}
                />
                + prior context
              </label>
            </div>
            <button
              className="btn btn-sm btn-primary w-full text-[10px]"
              onClick={() => void handleInject()}
              disabled={actionLoading || !injectText.trim()}
            >
              {actionLoading ? 'Injecting…' : 'Inject + Regenerate'}
            </button>
          </div>
        )}

        {actionError && <p className="text-[10px] text-red-300">{actionError}</p>}
      </div>
      {libraryOpen && (
        <AttachmentLibraryModal
          isOpen={libraryOpen}
          mode="select"
          onClose={() => setLibraryOpen(false)}
          onConfirmSelection={handleLibraryPick}
        />
      )}
    </div>
  );
};

// --- SceneChainSection ---

interface SceneChainSectionProps {
  connectorOutput: string;
  template: PipelineTemplate;
  onSave: (connections: ChainConnection[]) => Promise<void>;
  saving: boolean;
}

const SceneChainSection: React.FC<SceneChainSectionProps> = ({
  connectorOutput,
  template,
  onSave,
  saving,
}) => {
  const scenes = React.useMemo(() => {
    const entries = toConnectorSceneReferenceEntries(connectorOutput);
    return entries
      .filter((e) => e.scene_id)
      .map((e) => ({
        scene_id: e.scene_id,
        order: e.order ?? 0,
        reference_url: e.reference_url || undefined,
      }));
  }, [connectorOutput]);

  const initialConnections = React.useMemo((): ChainConnection[] => {
    for (const cp of template.checkpoints) {
      if (cp.chain_connections && cp.chain_connections.length > 0) {
        return cp.chain_connections;
      }
    }
    return [];
  }, [template]);

  const [connections, setConnections] = React.useState<ChainConnection[]>(initialConnections);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');

  React.useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  const handleSave = async () => {
    await onSave(connections);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (scenes.length < 2) return null;

  return (
    <div className="mt-3 p-2.5 rounded border border-white/10 bg-black/20 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-300 font-medium">Scene Chain Connections</p>
        <button
          className="btn btn-sm btn-secondary text-[10px] px-2 py-0.5"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      <SceneChainCablesEditor
        scenes={scenes}
        connections={connections}
        onChange={setConnections}
        saving={saving}
      />
    </div>
  );
};

// --- DistributorConnectorBlock ---

const DistributorConnectorBlock: React.FC<DistributorConnectorBlockProps> = ({
  run,
  template,
  distributorIndex,
  connectorIndex,
  isTerminal,
  isPaused,
  connectorInteraction,
  onConnectorContinue,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [chainSaving, setChainSaving] = useState(false);

  const handleSaveChainConnections = async (newConnections: ChainConnection[]) => {
    setChainSaving(true);
    try {
      const updatedCheckpoints = template.checkpoints.map((cp, idx) => {
        if (idx === connectorIndex) {
          return { ...cp, chain_connections: newConnections, chain_last_frames: false };
        }
        return cp;
      });
      await PipelineAPI.updatePipelineTemplate(template.id, { checkpoints: updatedCheckpoints });
    } finally {
      setChainSaving(false);
    }
  };

  const distributorCheckpoint = template.checkpoints[distributorIndex];
  const connectorCheckpoint = template.checkpoints[connectorIndex];
  const distributorResult = run.results?.[distributorIndex];
  const connectorResult = run.results?.[connectorIndex];

  const childPipelineIds: string[] = distributorResult?.child_pipeline_ids || [];

  const distributorComplete = distributorResult?.status === 'completed';
  const distributorFailed = distributorResult?.status === 'failed';
  const distributorPending = !distributorResult;
  const distributorCurrent = distributorIndex === run.current_checkpoint && !isTerminal;

  const connectorComplete = connectorResult?.status === 'completed';
  const connectorFailed = connectorResult?.status === 'failed';
  const connectorPending = !connectorResult;
  const connectorCurrent = connectorIndex === run.current_checkpoint && !isTerminal;

  const hasSceneReferences =
    connectorComplete &&
    Boolean(connectorResult?.output) &&
    toConnectorSceneReferenceEntries(connectorResult.output).length > 0;

  // Group child IDs into rows of 3
  const rows: string[][] = [];
  for (let i = 0; i < childPipelineIds.length; i += 3) {
    rows.push(childPipelineIds.slice(i, i + 3));
  }

  return (
    <div className="rounded border border-white/20 bg-black/40 overflow-hidden">
      {/* Distributor header */}
      <div
        className={`flex items-center justify-between p-2.5 cursor-pointer ${
          distributorCurrent ? 'bg-white/10 border-b border-white/20' : ''
        }`}
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              distributorComplete
                ? 'bg-white text-black'
                : distributorFailed
                ? 'bg-zinc-500 text-black'
                : distributorCurrent
                ? 'bg-zinc-200 text-black animate-pulse'
                : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            {distributorComplete
              ? 'OK'
              : distributorFailed
              ? 'X'
              : distributorPending
              ? '-'
              : distributorIndex + 1}
          </span>
          <span className="text-white font-medium text-xs">{distributorCheckpoint.name}</span>
          <span className="text-[10px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">
            Distributor
          </span>
          {childPipelineIds.length > 0 && (
            <span className="text-[10px] text-zinc-400">
              {childPipelineIds.length} scene{childPipelineIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          {isExpanded ? 'Hide' : 'Show'}
        </span>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Child pipeline grid */}
          {rows.length > 0 && (
            <div className="p-3 space-y-3 border-b border-white/10">
              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
                >
                  {row.map((childId, idxInRow) => {
                    const sceneNumber = rowIdx * 3 + idxInRow + 1;
                    return (
                      <ChildPipelineCard
                        key={childId}
                        runId={childId}
                        sceneNumber={sceneNumber}
                        template={template}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Distributor continue (paused for scene review) */}
          {isPaused && distributorCurrent && (
            <div className="space-y-2 p-3 border-b border-white/10">
              <p className="text-xs text-zinc-300">Review and regenerate scenes, then continue.</p>
              <button
                className="btn btn-sm btn-primary w-full"
                onClick={() => void onConnectorContinue()}
                disabled={connectorInteraction.progressionLoading}
              >
                {connectorInteraction.progressionLoading ? 'Continuing…' : 'Continue'}
              </button>
              {connectorInteraction.progressionError && (
                <p className="text-[10px] text-red-300">{connectorInteraction.progressionError}</p>
              )}
            </div>
          )}

          {/* Connector section */}
          <div className={`px-2.5 py-2 space-y-2 ${connectorCurrent ? 'bg-white/5' : ''}`}>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  connectorComplete
                    ? 'bg-white text-black'
                    : connectorFailed
                    ? 'bg-zinc-500 text-black'
                    : connectorCurrent
                    ? 'bg-zinc-200 text-black animate-pulse'
                    : 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {connectorComplete
                  ? 'OK'
                  : connectorFailed
                  ? 'X'
                  : connectorPending
                  ? '-'
                  : connectorIndex + 1}
              </span>
              <span className="text-white font-medium text-xs">{connectorCheckpoint.name}</span>
              <span className="text-[10px] uppercase tracking-wide bg-zinc-800 border border-white/20 text-zinc-200 px-1.5 py-0.5 rounded">
                Connector
              </span>
            </div>

            {hasSceneReferences && (
              <>
                <ConnectorSceneReferences output={connectorResult.output} />
                <SceneChainSection
                  connectorOutput={connectorResult.output}
                  template={template}
                  onSave={handleSaveChainConnections}
                  saving={chainSaving}
                />
              </>
            )}

            {connectorResult && !hasSceneReferences && connectorResult.output && (
              <pre className="text-[11px] text-slate-300 bg-black/70 p-2 rounded overflow-auto max-h-56 border border-white/10">
                {connectorResult.output}
              </pre>
            )}

            {connectorResult?.status === 'failed' && connectorResult.error && (
              <div className="attachment-surface space-y-1 border-amber-400/30">
                <p className="attachment-state">Connector Error</p>
                <p className="attachment-meta text-amber-100">{connectorResult.error}</p>
              </div>
            )}

            {isPaused && connectorCurrent && (
              <div className="space-y-2 p-2 border border-white/20 bg-white/5 rounded">
                <p className="text-xs text-zinc-300">Review scene references before continuing.</p>
                <button
                  className="btn btn-sm btn-primary w-full"
                  onClick={() => void onConnectorContinue()}
                  disabled={connectorInteraction.progressionLoading}
                >
                  {connectorInteraction.progressionLoading ? 'Continuing…' : 'Continue'}
                </button>
                {connectorInteraction.progressionError && (
                  <p className="text-[10px] text-red-300">{connectorInteraction.progressionError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorConnectorBlock;
