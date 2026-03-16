import { useCallback, useEffect, useRef, useState } from 'react';
import ClipAPI from '../../../api/clip';
import PipelineAPI from '../../../api/pipeline';
import { PipelineTemplate } from '../../../api/structs';
import { PipelineRun } from '../../../api/structs/pipeline';
import { AssetPoolItem, pipelineAttachmentToPoolItem } from '../assetPool';
import { extractClipPromptJsonList } from '../ideaOutput';
import { collectRunAttachmentProvenance } from '../../clips/attachmentProvenance';
import { buildSceneReferenceOptions, createSceneReferenceRows } from '../sceneReferenceMapping';
import { dedupeReferenceOptions } from './assemblyPayload';
import { toAssemblyErrorMessage } from './assemblyErrors';
import { ClipAssemblyDraft, RunAssemblyById } from './types';
import { getClipPromptTitle, isPlainObject } from './valueReaders';

interface UseRunAssemblyDataArgs {
  runs: PipelineRun[];
  templates: PipelineTemplate[];
  removeRun: (runId: string) => void;
}

export const useRunAssemblyData = ({ runs, templates, removeRun }: UseRunAssemblyDataArgs) => {
  const [generatedAssets, setGeneratedAssets] = useState<AssetPoolItem[]>([]);
  const [workspaceResetSignal, setWorkspaceResetSignal] = useState(0);
  const [assemblyByRunId, setAssemblyByRunId] = useState<RunAssemblyById>({});
  const preparingRunsRef = useRef<Set<string>>(new Set());

  const upsertGeneratedAssets = useCallback((assets: AssetPoolItem[]) => {
    if (assets.length === 0) return;
    setGeneratedAssets((previous) => {
      const deduped = new Map(previous.map((item) => [item.id, item]));
      assets.forEach((asset) => deduped.set(asset.id, asset));
      return Array.from(deduped.values());
    });
  }, []);

  const collectGeneratedFromRun = useCallback(
    (run: PipelineRun): AssetPoolItem[] => {
      const template = templates.find((item) => item.id === run.pipeline_template_id);
      const items: AssetPoolItem[] = [];

      (run.results || []).forEach((result, checkpointIndex) => {
        const checkpointName =
          template?.checkpoints?.[checkpointIndex]?.name ||
          result.checkpoint_id ||
          `Checkpoint ${checkpointIndex + 1}`;

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

  const closeRunWorkspace = useCallback(
    (runId: string) => {
      removeRun(runId);
      setAssemblyByRunId((previous) => {
        const next = { ...previous };
        delete next[runId];
        return next;
      });
      setWorkspaceResetSignal((value) => value + 1);
    },
    [removeRun]
  );

  const prepareCompletedRun = useCallback(
    async (run: PipelineRun) => {
      const runId = run.id;
      preparingRunsRef.current.add(runId);

      setAssemblyByRunId((previous) => ({
        ...previous,
        [runId]: {
          status: 'loading',
          runProvenance: [],
          options: [],
          drafts: [],
        },
      }));

      try {
        const { ready, output } = await PipelineAPI.getPipelineOutput(runId);
        if (!ready || !output) {
          setAssemblyByRunId((previous) => ({
            ...previous,
            [runId]: {
              status: 'error',
              loadError: 'Pipeline output is not ready for clip assembly yet.',
              runProvenance: [],
              options: [],
              drafts: [],
            },
          }));
          return;
        }

        const template = templates.find((item) => item.id === run.pipeline_template_id);
        const runProvenance = collectRunAttachmentProvenance(run, template);
        upsertGeneratedAssets(collectGeneratedFromRun(run));

        const availableMedia = await ClipAPI.getAvailableMedia().catch(() => []);
        const mutableOptions = [...buildSceneReferenceOptions(runProvenance, availableMedia)];
        const clipPromptList = extractClipPromptJsonList(output);
        const candidatePrompts = clipPromptList.length > 0 ? clipPromptList : [output];

        const drafts: ClipAssemblyDraft[] = candidatePrompts.map((promptJson, index) => {
          try {
            const parsed = JSON.parse(promptJson) as unknown;
            const parsedRecord = isPlainObject(parsed) ? parsed : {};
            return {
              id: `${runId}:${index}`,
              title: getClipPromptTitle(parsedRecord, index),
              promptJson,
              rows: createSceneReferenceRows(parsedRecord, mutableOptions),
              status: 'pre_assembly',
            };
          } catch {
            return {
              id: `${runId}:${index}`,
              title: `Clip Prompt ${index + 1}`,
              promptJson,
              rows: [],
              status: 'pre_assembly',
            };
          }
        });

        setAssemblyByRunId((previous) => ({
          ...previous,
          [runId]: {
            status: 'ready',
            runProvenance,
            options: dedupeReferenceOptions(mutableOptions),
            drafts,
          },
        }));
      } catch (error) {
        setAssemblyByRunId((previous) => ({
          ...previous,
          [runId]: {
            status: 'error',
            loadError: toAssemblyErrorMessage(error),
            runProvenance: [],
            options: [],
            drafts: [],
          },
        }));
      } finally {
        preparingRunsRef.current.delete(runId);
      }
    },
    [collectGeneratedFromRun, templates, upsertGeneratedAssets]
  );

  useEffect(() => {
    const observedAssets = runs.flatMap((run) => collectGeneratedFromRun(run));
    upsertGeneratedAssets(observedAssets);
  }, [collectGeneratedFromRun, runs, upsertGeneratedAssets]);

  useEffect(() => {
    const completedRuns = runs.filter((run) => run.status === 'completed');
    completedRuns.forEach((run) => {
      const hasState = Boolean(assemblyByRunId[run.id]);
      const preparing = preparingRunsRef.current.has(run.id);
      if (!hasState && !preparing) {
        void prepareCompletedRun(run);
      }
    });

    setAssemblyByRunId((previous) => {
      const activeRunIds = new Set(runs.map((run) => run.id));
      const next = { ...previous };
      let changed = false;

      Object.keys(next).forEach((runId) => {
        if (!activeRunIds.has(runId)) {
          delete next[runId];
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [assemblyByRunId, prepareCompletedRun, runs]);

  return {
    generatedAssets,
    workspaceResetSignal,
    assemblyByRunId,
    setAssemblyByRunId,
    prepareCompletedRun,
    closeRunWorkspace,
  };
};
