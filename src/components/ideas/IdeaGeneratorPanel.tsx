import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PipelineTemplate } from '../../api/structs';
import PipelineAPI from '../../api/pipeline';
import ClipAPI from '../../api/clip';
import IdeaInputForm from './IdeaInputForm';
import PipelineRunItem from './PipelineRunItem';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';
import { MediaProfile } from '../../api/structs/media-spec';
import { extractClipPromptJsonList } from './ideaOutput';
import { PipelineInputAttachment } from '../../api/structs/pipeline';

interface IdeaGeneratorPanelProps {
  chatProvider: string;
  chatModel: string;
  mediaProfile: MediaProfile;
  onIdeasCreated: () => void;
}

const IdeaGeneratorPanel: React.FC<IdeaGeneratorPanelProps> = ({
  chatProvider,
  chatModel,
  mediaProfile,
  onIdeasCreated,
}) => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const processingRef = useRef<Set<string>>(new Set());
  const {
    runs,
    startRun,
    continueRun,
    regenerateCheckpoint,
    cancelRun,
    removeRun,
  } = usePipelineRuns();

  // Load templates
  useEffect(() => {
    PipelineAPI.listPipelineTemplates().then(setTemplates);
  }, []);

  const handleCompleted = useCallback(
    async (runId: string) => {
      try {
        const { ready, output } = await PipelineAPI.getPipelineOutput(runId);
        if (!ready || !output) {
          removeRun(runId);
          return;
        }

        const run = runs.find((r) => r.id === runId);
        if (!run) return;

        const clipPromptList = extractClipPromptJsonList(output);
        if (clipPromptList.length <= 1) {
          await ClipAPI.createIdea(run.initial_input, clipPromptList[0] || output);
        } else {
          await ClipAPI.createIdeas(run.initial_input, clipPromptList);
        }

        onIdeasCreated();
        removeRun(runId);
      } catch (err) {
        console.error('Failed to create ideas:', err);
        removeRun(runId);
      } finally {
        processingRef.current.delete(runId);
      }
    },
    [runs, onIdeasCreated, removeRun]
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
      <IdeaInputForm templates={templates} onStart={handleStart} />

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
