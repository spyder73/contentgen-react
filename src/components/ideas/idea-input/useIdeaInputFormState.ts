import React, { useCallback, useMemo, useState } from 'react';
import { PipelineTemplate } from '../../../api/structs';
import { PipelineInputAttachment } from '../../../api/structs/pipeline';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import {
  AssetPoolItem,
  evaluateCheckpointRequirements,
  extractCheckpointRequirements,
  toPipelineInputAttachment,
} from '../assetPool';
import { toActionableErrorMessage } from './helpers';
import { CheckpointBindingRow, TemplateOption } from './types';
import { useAssetPoolState } from './useAssetPoolState';

interface UseIdeaInputFormStateArgs {
  templates: PipelineTemplate[];
  onStart: (
    input: string,
    templateId: string,
    autoMode: boolean,
    attachments: PipelineInputAttachment[],
    musicMediaId?: string | null
  ) => Promise<void>;
  generatedAssets?: AssetPoolItem[];
  disabled?: boolean;
}

export const useIdeaInputFormState = ({
  templates,
  onStart,
  generatedAssets = [],
  disabled,
}: UseIdeaInputFormStateArgs) => {
  const [input, setInput] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [autoMode, setAutoMode] = useLocalStorage('pipeline_auto_mode', true);
  const [loading, setLoading] = useState(false);
  const [checkpointBindings, setCheckpointBindings] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState('');

  const pool = useAssetPoolState({
    disabled,
    onError: setSubmitError,
  });
  const addAssetToPool = pool.addAssetToPool;

  React.useEffect(() => {
    if (templates.length && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) || null,
    [templateId, templates]
  );

  React.useEffect(() => {
    const validCheckpointIds = new Set((selectedTemplate?.checkpoints || []).map((checkpoint) => checkpoint.id));
    const validAssetIds = new Set(pool.assetPool.map((asset) => asset.id));

    setCheckpointBindings((previous) => {
      const nextEntries = Object.entries(previous)
        .filter(([checkpointId]) => validCheckpointIds.has(checkpointId))
        .map(([checkpointId, assetIds]) => [
          checkpointId,
          assetIds.filter((assetId) => validAssetIds.has(assetId)),
        ]);
      return Object.fromEntries(nextEntries);
    });
  }, [pool.assetPool, selectedTemplate]);

  const checkpointBindingRows = useMemo<CheckpointBindingRow[]>(() => {
    if (!selectedTemplate) return [];

    return selectedTemplate.checkpoints
      .map((checkpoint, checkpointIndex) => {
        const requirements = extractCheckpointRequirements(checkpoint);
        const boundAssetIds = checkpointBindings[checkpoint.id] || [];
        const boundAssets = boundAssetIds
          .map((id) => pool.assetPoolById.get(id))
          .filter((item): item is AssetPoolItem => Boolean(item));
        const requirementSummary = evaluateCheckpointRequirements(requirements, boundAssets);

        return {
          checkpoint,
          checkpointIndex,
          requirements,
          boundAssets,
          requirementSummary,
        };
      })
      .filter((row) => row.checkpoint.allow_attachments || row.requirements.length > 0);
  }, [checkpointBindings, pool.assetPoolById, selectedTemplate]);

  const unmetRequiredCheckpoints = checkpointBindingRows.filter(
    (row) => row.requirements.length > 0 && !row.requirementSummary.satisfied
  );

  const pipelineAttachments = useMemo(() => {
    const attachments = pool.assetPool.map((asset) => toPipelineInputAttachment(asset));

    checkpointBindingRows.forEach((row) => {
      row.boundAssets.forEach((asset) => {
        attachments.push(
          toPipelineInputAttachment(asset, {
            checkpointId: row.checkpoint.id,
            checkpointIndex: row.checkpointIndex,
          })
        );
      });
    });

    if (pool.musicMediaId && !attachments.some((item) => item.media_id === pool.musicMediaId)) {
      attachments.unshift({
        type: 'music',
        source: 'media',
        state: 'selected',
        media_id: pool.musicMediaId,
        name: pool.selectedMusic?.name || 'Selected music',
        filename: pool.selectedMusic?.name || 'selected-music',
        mime_type: pool.selectedMusic?.mime_type,
        url: pool.selectedMusic?.url,
      });
    }

    return attachments;
  }, [checkpointBindingRows, pool.assetPool, pool.musicMediaId, pool.selectedMusic]);

  const toggleCheckpointBinding = (checkpointId: string, assetId: string) => {
    setCheckpointBindings((previous) => {
      const existing = previous[checkpointId] || [];
      const next = existing.includes(assetId)
        ? existing.filter((id) => id !== assetId)
        : [...existing, assetId];
      return { ...previous, [checkpointId]: next };
    });
  };

  const bindAssetToCheckpoint = useCallback(
    (checkpointId: string, asset: AssetPoolItem) => {
      addAssetToPool(asset);
      setCheckpointBindings((previous) => {
        const existing = previous[checkpointId] || [];
        if (existing.includes(asset.id)) return previous;
        return {
          ...previous,
          [checkpointId]: [...existing, asset.id],
        };
      });
    },
    [addAssetToPool]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !templateId) return;
    setSubmitError('');

    if (unmetRequiredCheckpoints.length > 0) {
      const details = unmetRequiredCheckpoints
        .map((row) => {
          const missing = row.requirementSummary.details
            .filter((item) => !item.satisfied)
            .map((item) => `${item.requirement.label} (missing ${item.missing_count})`)
            .join(', ');
          return `${row.checkpoint.name}: ${missing}`;
        })
        .join(' | ');
      setSubmitError(`Missing required checkpoint assets: ${details}`);
      return;
    }

    setLoading(true);
    try {
      await onStart(input.trim(), templateId, autoMode, pipelineAttachments, pool.musicMediaId || null);
      setInput('');
    } catch (error) {
      setSubmitError(toActionableErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const templateOptions: TemplateOption[] = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }));

  return {
    input,
    setInput,
    templateId,
    setTemplateId,
    templateOptions,
    autoMode,
    setAutoMode,
    loading,
    submitError,
    unmetRequiredCheckpoints,
    handleSubmit,
    checkpointBindingRows,
    checkpointBindings,
    toggleCheckpointBinding,
    bindAssetToCheckpoint,
    submitDisabled: !input.trim() || loading || disabled || unmetRequiredCheckpoints.length > 0,
    disabled,
    generatedAssets,
    pipelineAttachmentCount: pipelineAttachments.length,
    ...pool,
  };
};
