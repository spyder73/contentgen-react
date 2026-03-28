import React, { useMemo, useState } from 'react';
import { PipelineRun, PipelineTemplate } from '../../api/structs';
import { CheckpointInjectionMode, MediaAttachment } from '../../api/structs/pipeline';
import {
  AssetPoolItem,
  evaluateCheckpointRequirements,
  extractCheckpointRequirements,
  normalizeAssetSource,
  pipelineAttachmentToPoolItem,
} from './assetPool';
import CheckpointList from './pipeline-run/CheckpointList';
import PricingSummary from './pipeline-run/PricingSummary';
import { getRunProgressPercent } from './pipeline-run/helpers';
import RunHeader from './pipeline-run/RunHeader';
import RunTerminalFooter from './pipeline-run/RunTerminalFooter';

interface Props {
  run: PipelineRun;
  template: PipelineTemplate;
  onContinue: () => Promise<void> | void;
  onRegenerate: (checkpoint: number) => Promise<void> | void;
  onInjectPrompt: (
    checkpoint: number,
    text: string,
    options?: {
      autoRegenerate?: boolean;
      source?: string;
      mode?: CheckpointInjectionMode;
    }
  ) => Promise<void>;
  onAddAttachment: (
    checkpoint: number,
    attachment: Omit<MediaAttachment, 'id' | 'created_at'>
  ) => Promise<void>;
  onCancel: () => void;
  onRemove: () => void;
}

const PipelineRunItem: React.FC<Props> = ({
  run,
  template,
  onContinue,
  onRegenerate,
  onInjectPrompt,
  onAddAttachment,
  onCancel,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isTerminal = ['completed', 'failed', 'cancelled'].includes(run.status);
  const isPaused = run.status === 'paused';
  const progressPercent = getRunProgressPercent(run, template.checkpoints.length);

  const checkpointRequirements = useMemo(
    () => template.checkpoints.map((checkpoint) => extractCheckpointRequirements(checkpoint)),
    [template.checkpoints]
  );

  const reusablePoolAssets = useMemo(() => {
    const items: AssetPoolItem[] = [];

    (run.results || []).forEach((result, checkpointIndex) => {
      const checkpointName =
        template.checkpoints[checkpointIndex]?.name || result.checkpoint_id || `Checkpoint ${checkpointIndex + 1}`;
      (result.attachments || []).forEach((attachment) => {
        const normalizedSource = normalizeAssetSource(attachment.source);
        items.push(
          pipelineAttachmentToPoolItem(attachment, {
            source: normalizedSource === 'unknown' ? 'generated' : normalizedSource,
            runId: run.id,
            checkpointId: result.checkpoint_id,
            checkpointName,
            checkpointIndex,
          })
        );
      });
    });

    const deduped = new Map<string, AssetPoolItem>();
    items.forEach((item) => deduped.set(item.id, item));
    return Array.from(deduped.values());
  }, [run.id, run.results, template.checkpoints]);

  const evaluateRequirementDetails = (
    index: number,
    attachments: PipelineRun['results'][number]['attachments'] | undefined
  ) =>
    evaluateCheckpointRequirements(
      checkpointRequirements[index],
      (attachments || []).map((attachment) =>
        pipelineAttachmentToPoolItem(attachment, {
          source: (() => {
            const normalizedSource = normalizeAssetSource(attachment.source);
            return normalizedSource === 'unknown' ? 'generated' : normalizedSource;
          })(),
          runId: run.id,
          checkpointId: template.checkpoints[index]?.id,
          checkpointName: template.checkpoints[index]?.name,
          checkpointIndex: index,
        })
      )
    );

  return (
    <div className="pipeline-run-item bg-black/50 border border-white/15 overflow-hidden">
      <RunHeader
        run={run}
        templateName={template.name}
        checkpointCount={template.checkpoints.length}
        isExpanded={isExpanded}
        isTerminal={isTerminal}
        onToggleExpand={() => setIsExpanded((value) => !value)}
        onCancel={onCancel}
      />

      <div className="h-1 bg-white/10">
        <div
          className={`h-full transition-all duration-300 pipeline-progress ${
            run.status === 'completed' ? 'bg-white' : 'bg-zinc-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isExpanded && (
        <div>
          <div className="p-3 space-y-2">
            <PricingSummary run={run} />

            <CheckpointList
              run={run}
              template={template}
              isTerminal={isTerminal}
              isPaused={isPaused}
              checkpointRequirements={checkpointRequirements}
              evaluateRequirementDetails={evaluateRequirementDetails}
              reusablePoolAssets={reusablePoolAssets}
              onContinue={onContinue}
              onRegenerate={onRegenerate}
              onInjectPrompt={onInjectPrompt}
              onAddAttachment={onAddAttachment}
            />
          </div>

          {isTerminal && <RunTerminalFooter status={run.status} onRemove={onRemove} />}
        </div>
      )}
    </div>
  );
};

export default PipelineRunItem;
