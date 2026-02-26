import React, { useState, useEffect, useRef } from 'react';
import { PipelineTemplate } from '../../api/structs';
import PipelineAPI from '../../api/pipeline';
import ClipAPI from '../../api/clip';
import IdeaInputForm from './IdeaInputForm';
import PipelineRunItem from './PipelineRunItem';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';

interface Props {
  chatProvider: string;
  chatModel: string;
  onIdeasCreated: () => void;
}

const IdeaGeneratorPanel: React.FC<Props> = ({
  chatProvider,
  chatModel,
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

  // Handle completed runs
  useEffect(() => {
    const completedRuns = runs.filter((r) => r.status === 'completed');
    for (const run of completedRuns) {
      if (!processingRef.current.has(run.id)) {
        processingRef.current.add(run.id);
        handleCompleted(run.id);
      }
    }
  }, [runs]);

  const handleStart = async (input: string, templateId: string, autoMode: boolean) => {
    await startRun(templateId, input, {
      autoMode,
      provider: chatProvider,
      model: chatModel,
    });
  };

  const handleCompleted = async (runId: string) => {
    try {
      const { ready, output } = await PipelineAPI.getPipelineOutput(runId);
      if (!ready || !output) {
        removeRun(runId);
        return;
      }

      // Find the run to get initial input
      const run = runs.find((r) => r.id === runId);
      if (!run) return;

      // Create idea(s) from output
      /*if (output.startsWith('[')) {
        const list = JSON.parse(output) as string[];
        await ClipAPI.createIdeas(run.initial_input, list);
      } else {
        await ClipAPI.createIdea(run.initial_input, output);
      }*/
     await ClipAPI.createIdea(run.initial_input, output);

      onIdeasCreated();
      removeRun(runId);
    } catch (err) {
      console.error('Failed to create ideas:', err);
      removeRun(runId);
    } finally {
      processingRef.current.delete(runId);
    }
  };

  const getTemplate = (templateId: string) =>
    templates.find((t) => t.id === templateId);

  // All runs (active and terminal) shown together
  const visibleRuns = runs.filter((r) => r.status !== 'completed');

  return (
    <div className="space-y-3">
      {/* Input Form */}
      <IdeaInputForm templates={templates} onStart={handleStart} />

      {/* Pipeline Runs */}
      {visibleRuns.length > 0 && (
        <div className="space-y-3">
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