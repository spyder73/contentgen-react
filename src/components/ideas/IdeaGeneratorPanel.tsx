import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PipelineTemplate } from '../../api/structs';
import PipelineAPI from '../../api/pipeline';
import ClipAPI from '../../api/clip';
import IdeaInputForm from './IdeaInputForm';
import PipelineRunItem from './PipelineRunItem';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';
import { MediaProfile } from '../../api/structs/media-spec';
import { extractClipPromptJsonList } from './ideaOutput';
import { PipelineInputAttachment, PipelineRun } from '../../api/structs/pipeline';
import { AssetPoolItem, pipelineAttachmentToPoolItem } from './assetPool';
import {
  AttachmentProvenanceItem,
  collectRunAttachmentProvenance,
  isGeneratedAttachmentSource,
  mergeAttachmentProvenance,
  readMetadataAttachmentProvenance,
} from '../clips/attachmentProvenance';

interface IdeaGeneratorPanelProps {
  chatProvider: string;
  chatModel: string;
  mediaProfile: MediaProfile;
  openLibrarySignal?: number;
  onIdeasCreated: () => void;
  onClipsCreated?: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const enrichClipPromptJsonForRun = (
  rawPromptJson: string,
  run: PipelineRun,
  runProvenance: AttachmentProvenanceItem[]
): string => {
  try {
    const parsed = JSON.parse(rawPromptJson) as unknown;
    if (!isRecord(parsed)) return rawPromptJson;

    const metadata = isRecord(parsed.metadata) ? { ...parsed.metadata } : {};
    const existing = readMetadataAttachmentProvenance(metadata);
    const merged = mergeAttachmentProvenance(existing, runProvenance);
    const generated = merged.filter(
      (item) =>
        isGeneratedAttachmentSource(item.source) ||
        Boolean(item.source_checkpoint_id)
    );

    metadata.attachment_provenance = merged;
    metadata.inherited_attachments = merged;
    metadata.generated_reference_assets = generated;
    metadata.pipeline_run_id = toStringValue(metadata.pipeline_run_id) || run.id;

    if (!Array.isArray(metadata.reference_assets) || metadata.reference_assets.length === 0) {
      metadata.reference_assets = generated;
    }

    const runMusicMediaId = toStringValue(run.music_media_id);
    const requestMusicMediaId = toStringValue(parsed.music_media_id);
    const resolvedMusicMediaId = requestMusicMediaId || runMusicMediaId;
    if (resolvedMusicMediaId) {
      metadata.music_media_id = resolvedMusicMediaId;
    }

    return JSON.stringify({
      ...parsed,
      music_media_id: resolvedMusicMediaId || undefined,
      metadata,
    });
  } catch {
    return rawPromptJson;
  }
};

const IdeaGeneratorPanel: React.FC<IdeaGeneratorPanelProps> = ({
  chatProvider,
  chatModel,
  mediaProfile,
  openLibrarySignal = 0,
  onIdeasCreated,
  onClipsCreated,
}) => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<AssetPoolItem[]>([]);
  const [workspaceResetSignal, setWorkspaceResetSignal] = useState(0);
  const processingRef = useRef<Set<string>>(new Set());
  const {
    runs,
    startRun,
    continueRun,
    regenerateCheckpoint,
    injectCheckpointPrompt,
    addCheckpointAttachment,
    cancelRun,
    removeRun,
  } = usePipelineRuns();

  // Load templates
  useEffect(() => {
    PipelineAPI.listPipelineTemplates().then(setTemplates);
  }, []);

  const upsertGeneratedAssets = useCallback((assets: AssetPoolItem[]) => {
    if (assets.length === 0) return;
    setGeneratedAssets((prev) => {
      const deduped = new Map(prev.map((item) => [item.id, item]));
      assets.forEach((asset) => {
        deduped.set(asset.id, asset);
      });
      return Array.from(deduped.values());
    });
  }, []);

  const collectGeneratedFromRun = useCallback(
    (run: PipelineRun): AssetPoolItem[] => {
      const template = templates.find((item) => item.id === run.pipeline_template_id);
      const items: AssetPoolItem[] = [];

      (run.results || []).forEach((result, checkpointIndex) => {
        const checkpointName =
          template?.checkpoints?.[checkpointIndex]?.name || result.checkpoint_id || `Checkpoint ${checkpointIndex + 1}`;
        (result.attachments || []).forEach((attachment) => {
          items.push(
            pipelineAttachmentToPoolItem(attachment, {
              source: 'generated',
              runId: run.id,
              checkpointId: result.checkpoint_id,
              checkpointName,
              checkpointIndex,
            })
          );
        });
      });

      return items;
    },
    [templates]
  );

  const handleCompleted = useCallback(
    async (runId: string) => {
      const clearRunWorkspace = () => {
        removeRun(runId);
        setWorkspaceResetSignal((value) => value + 1);
      };

      try {
        const { ready, output } = await PipelineAPI.getPipelineOutput(runId);
        if (!ready || !output) {
          clearRunWorkspace();
          return;
        }

        const run = runs.find((r) => r.id === runId);
        if (!run) return;
        const template = templates.find((item) => item.id === run.pipeline_template_id);
        const runProvenance = collectRunAttachmentProvenance(run, template);
        upsertGeneratedAssets(collectGeneratedFromRun(run));

        const clipPromptList = extractClipPromptJsonList(output);
        const candidatePrompts = clipPromptList.length > 0 ? clipPromptList : [output];
        let createdCount = 0;

        for (const promptJson of candidatePrompts) {
          try {
            await ClipAPI.createClipPromptFromJson(
              enrichClipPromptJsonForRun(promptJson, run, runProvenance),
              mediaProfile
            );
            createdCount += 1;
          } catch (error) {
            console.error('Failed to create clip prompt from run output:', error);
          }
        }

        if (createdCount > 0) {
          onClipsCreated?.();
        } else if (clipPromptList.length <= 1) {
          await ClipAPI.createIdea(run.initial_input, clipPromptList[0] || output);
          onIdeasCreated();
        } else {
          await ClipAPI.createIdeas(run.initial_input, clipPromptList);
          onIdeasCreated();
        }

        clearRunWorkspace();
      } catch (err) {
        console.error('Failed to transition completed run output:', err);
        clearRunWorkspace();
      } finally {
        processingRef.current.delete(runId);
      }
    },
    [
      collectGeneratedFromRun,
      mediaProfile,
      onClipsCreated,
      onIdeasCreated,
      removeRun,
      runs,
      templates,
      upsertGeneratedAssets,
    ]
  );

  // Handle completed runs
  useEffect(() => {
    const completedRuns = runs.filter((r) => r.status === 'completed');
    for (const run of completedRuns) {
      if (!processingRef.current.has(run.id)) {
        processingRef.current.add(run.id);
        handleCompleted(run.id);
      }
    }
  }, [runs, handleCompleted]);

  useEffect(() => {
    const observedAssets = runs.flatMap((run) => collectGeneratedFromRun(run));
    upsertGeneratedAssets(observedAssets);
  }, [collectGeneratedFromRun, runs, upsertGeneratedAssets]);

  const handleStart = async (
    input: string,
    templateId: string,
    autoMode: boolean,
    attachments: PipelineInputAttachment[],
    musicMediaId?: string | null
  ) => {
    await startRun(templateId, input, {
      autoMode,
      initialAttachments: attachments,
      musicMediaId,
      provider: chatProvider,
      model: chatModel,
      mediaProfile,
    });
  };

  const getTemplate = (templateId: string) =>
    templates.find((t) => t.id === templateId);

  // All runs (active and terminal) shown together
  const visibleRuns = runs.filter((r) => r.status !== 'completed');

  return (
    <div className="space-y-2">
      {/* Input Form */}
      <IdeaInputForm
        templates={templates}
        onStart={handleStart}
        generatedAssets={generatedAssets}
        openLibrarySignal={openLibrarySignal}
        workspaceResetSignal={workspaceResetSignal}
      />

      {/* Pipeline Runs */}
      {visibleRuns.length > 0 && (
        <div className="space-y-2">
          {visibleRuns.map((run) => {
            const template = getTemplate(run.pipeline_template_id);
            if (!template) return null;

            return (
              <PipelineRunItem
                key={run.id}
                run={run}
                template={template}
                onContinue={() => continueRun(run.id)}
                onRegenerate={(checkpoint) => regenerateCheckpoint(run.id, checkpoint)}
                onInjectPrompt={async (checkpoint, text, options) => {
                  await injectCheckpointPrompt(run.id, checkpoint, text, options);
                }}
                onAddAttachment={async (checkpoint, attachment) => {
                  await addCheckpointAttachment(run.id, checkpoint, attachment);
                }}
                onCancel={() => cancelRun(run.id)}
                onRemove={() => removeRun(run.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdeaGeneratorPanel;
