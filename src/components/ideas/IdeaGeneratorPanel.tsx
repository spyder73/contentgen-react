import React, { useEffect, useMemo } from 'react';
import PipelineAPI from '../../api/pipeline';
import ModelsAPI from '../../api/models';
import { PipelineTemplate } from '../../api/structs';
import { PipelineInputAttachment } from '../../api/structs/pipeline';
import IdeaInputForm from './IdeaInputForm';
import PipelineRunItem from './PipelineRunItem';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';
import CompletedRunAssembly from './idea-generator/CompletedRunAssembly';
import { useRunAssemblyData } from './idea-generator/useRunAssemblyData';
import { useRunAssemblyDraftActions } from './idea-generator/useRunAssemblyDraftActions';

const toCleanString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const normalizeAttachmentType = (value: string): string => {
  const normalized = toCleanString(value).toLowerCase();
  if (normalized.includes('image')) return 'image';
  if (normalized === 'ai_video' || normalized.includes('video')) return 'video';
  if (normalized.includes('audio') || normalized.includes('music')) return 'audio';
  return normalized;
};

const hasImageAttachment = (attachments: PipelineInputAttachment[]): boolean =>
  attachments.some((attachment) => normalizeAttachmentType(attachment.type || '') === 'image');

const hasInitialImageRequirement = (template: PipelineTemplate): boolean =>
  template.checkpoints.some((checkpoint) =>
    (checkpoint.required_assets || []).some((requirement) => {
      const type = toCleanString(requirement.type).toLowerCase();
      const source = toCleanString(requirement.source).toLowerCase();
      return source === 'initial' && (type === 'image' || type.includes('image'));
    })
  );

const normalizeGeneratorMediaType = (value: string): 'image' | 'video' | 'audio' | '' => {
  const normalized = toCleanString(value).toLowerCase();
  if (normalized === 'video' || normalized === 'ai_video') return 'video';
  if (normalized === 'audio' || normalized === 'music') return 'audio';
  if (normalized === 'image') return 'image';
  return '';
};

const modelSupportsSeedImage = (capabilities: Record<string, unknown> | undefined): boolean =>
  Boolean(capabilities && capabilities.supports_seed_image === true);

interface IdeaGeneratorPanelProps {
  openLibrarySignal?: number;
  onIdeasCreated: () => void;
  onClipsCreated?: () => void;
}

const IdeaGeneratorPanel: React.FC<IdeaGeneratorPanelProps> = ({
  openLibrarySignal = 0,
  onIdeasCreated,
  onClipsCreated,
}) => {
  const [templates, setTemplates] = React.useState<PipelineTemplate[]>([]);
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

  useEffect(() => {
    PipelineAPI.listPipelineTemplates().then(setTemplates);
  }, []);

  const {
    generatedAssets,
    workspaceResetSignal,
    assemblyByRunId,
    setAssemblyByRunId,
    prepareCompletedRun,
    closeRunWorkspace,
  } = useRunAssemblyData({ runs, templates, removeRun });

  const {
    copiedPreviewDraftId,
    handleSceneSelection,
    copyPreviewJson,
    handleAssembleDraft,
  } = useRunAssemblyDraftActions({
    runs,
    assemblyByRunId,
    setAssemblyByRunId,
    onClipsCreated,
  });

  const handleStart = async (
    input: string,
    templateId: string,
    autoMode: boolean,
    attachments: PipelineInputAttachment[],
    musicMediaId?: string | null
  ) => {
    const selectedTemplate = templates.find((template) => template.id === templateId) || null;

    if (selectedTemplate && hasInitialImageRequirement(selectedTemplate) && hasImageAttachment(attachments)) {
      const generatorCheckpoints = selectedTemplate.checkpoints.filter(
        (checkpoint) =>
          (checkpoint.type || 'prompt') === 'generator' &&
          normalizeGeneratorMediaType(checkpoint.generator?.media_type || '') === 'image'
      );

      for (const checkpoint of generatorCheckpoints) {
        const effectiveModel =
          toCleanString(checkpoint.generator?.model) ||
          toCleanString(selectedTemplate.output_format?.image_model);
        if (!effectiveModel) {
          continue;
        }
        const constraints = await ModelsAPI.getModelConstraints(effectiveModel, 'image');
        if (!modelSupportsSeedImage(constraints.capabilities)) {
          throw new Error(
            `Model "${effectiveModel}" does not support seed/reference images (checkpoint: ${checkpoint.name}). Choose a seed-compatible image model in Pipeline Manager.`
          );
        }
      }
    }

    await startRun(templateId, input, {
      autoMode,
      initialAttachments: attachments,
      musicMediaId,
    });
    onIdeasCreated();
  };

  const templatesById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates]
  );

  return (
    <div className="space-y-2">
      <IdeaInputForm
        templates={templates}
        onStart={handleStart}
        generatedAssets={generatedAssets}
        openLibrarySignal={openLibrarySignal}
        workspaceResetSignal={workspaceResetSignal}
      />

      {runs.length > 0 && (
        <div className="space-y-2">
          {runs.map((run) => {
            const template = templatesById.get(run.pipeline_template_id);
            if (!template) return null;

            const runAssembly = assemblyByRunId[run.id];

            return (
              <div key={run.id} className="space-y-2">
                <PipelineRunItem
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
                  onRemove={() => closeRunWorkspace(run.id)}
                />

                {run.status === 'completed' && (
                  <CompletedRunAssembly
                    run={run}
                    runAssembly={runAssembly}
                    copiedPreviewDraftId={copiedPreviewDraftId}
                    onCopyPreview={copyPreviewJson}
                    onRetryLoad={async () => prepareCompletedRun(run)}
                    onSceneSelection={(draftId, rowKey, selectedOptionKey) =>
                      handleSceneSelection(run.id, draftId, rowKey, selectedOptionKey)
                    }
                    onAssembleDraft={(draftId) => handleAssembleDraft(run.id, draftId)}
                    onCloseWorkspace={() => closeRunWorkspace(run.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdeaGeneratorPanel;
