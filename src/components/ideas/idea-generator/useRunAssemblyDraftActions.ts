import { useCallback, useState } from 'react';
import ClipAPI from '../../../api/clip';
import { PipelineRun } from '../../../api/structs/pipeline';
import { buildAssembledClipPromptPayload } from './assemblyPayload';
import { extractMissingSceneErrors, getBlockingReferenceCount, toAssemblyErrorMessage } from './assemblyErrors';
import { ClipAssemblyDraft, RunAssemblyById, RunAssemblyState } from './types';

interface UseRunAssemblyDraftActionsArgs {
  runs: PipelineRun[];
  assemblyByRunId: RunAssemblyById;
  setAssemblyByRunId: React.Dispatch<React.SetStateAction<RunAssemblyById>>;
  onClipsCreated?: () => void;
}

const updateRunDrafts = (
  runState: RunAssemblyState,
  draftId: string,
  updateDraft: (draft: ClipAssemblyDraft) => ClipAssemblyDraft
): RunAssemblyState => ({
  ...runState,
  drafts: runState.drafts.map((draft) => (draft.id === draftId ? updateDraft(draft) : draft)),
});

export const useRunAssemblyDraftActions = ({
  runs,
  assemblyByRunId,
  setAssemblyByRunId,
  onClipsCreated,
}: UseRunAssemblyDraftActionsArgs) => {
  const [copiedPreviewDraftId, setCopiedPreviewDraftId] = useState<string | null>(null);

  const updateDraftRows = useCallback(
    (
      runId: string,
      draftId: string,
      updater: (rows: ClipAssemblyDraft['rows']) => ClipAssemblyDraft['rows']
    ) => {
      setAssemblyByRunId((previous) => {
        const runState = previous[runId];
        if (!runState || runState.status !== 'ready') return previous;

        const nextDrafts = runState.drafts.map((draft) => {
          if (draft.id !== draftId) return draft;
          return {
            ...draft,
            rows: updater(draft.rows),
            errorMessage: undefined,
            status: (draft.status === 'assembled' ? draft.status : 'pre_assembly') as ClipAssemblyDraft['status'],
          };
        });

        return {
          ...previous,
          [runId]: {
            ...runState,
            drafts: nextDrafts,
          },
        };
      });
    },
    [setAssemblyByRunId]
  );

  const handleSceneSelection = useCallback(
    (runId: string, draftId: string, rowKey: string, selectedOptionKey: string) => {
      updateDraftRows(runId, draftId, (rows) =>
        rows.map((row) =>
          row.key === rowKey
            ? {
                ...row,
                selectedOptionKey,
                error: undefined,
              }
            : row
        )
      );
    },
    [updateDraftRows]
  );

  const copyPreviewJson = useCallback(async (draftId: string, payload: Record<string, unknown>) => {
    if (!navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedPreviewDraftId(draftId);
    } catch {
      setCopiedPreviewDraftId(null);
    }
  }, []);

  const handleAssembleDraft = useCallback(
    async (runId: string, draftId: string) => {
      const run = runs.find((item) => item.id === runId);
      const runState = assemblyByRunId[runId];
      if (!run || !runState || runState.status !== 'ready') return;

      const draft = runState.drafts.find((item) => item.id === draftId);
      if (!draft) return;

      const blockingCount = getBlockingReferenceCount(draft.rows);
      if (blockingCount > 0) {
        setAssemblyByRunId((previous) => {
          const latest = previous[runId];
          if (!latest || latest.status !== 'ready') return previous;

          return {
            ...previous,
            [runId]: updateRunDrafts(latest, draftId, (item) => ({
              ...item,
              status: 'error',
              errorMessage: `${blockingCount} required scene reference${blockingCount === 1 ? '' : 's'} unresolved.`,
            })),
          };
        });
        return;
      }

      setAssemblyByRunId((previous) => {
        const latest = previous[runId];
        if (!latest || latest.status !== 'ready') return previous;

        return {
          ...previous,
          [runId]: updateRunDrafts(latest, draftId, (item) => ({
            ...item,
            status: 'assembling',
            errorMessage: undefined,
          })),
        };
      });

      try {
        const assembledPayload = buildAssembledClipPromptPayload(
          draft.promptJson,
          run,
          runState.runProvenance,
          draft.rows,
          runState.options
        );

        await ClipAPI.createClipPromptFromJson(JSON.stringify(assembledPayload));
        onClipsCreated?.();

        setAssemblyByRunId((previous) => {
          const latest = previous[runId];
          if (!latest || latest.status !== 'ready') return previous;

          return {
            ...previous,
            [runId]: updateRunDrafts(latest, draftId, (item) => ({
              ...item,
              status: 'assembled',
              errorMessage: undefined,
            })),
          };
        });
      } catch (error) {
        const sceneErrors = extractMissingSceneErrors(error);

        setAssemblyByRunId((previous) => {
          const latest = previous[runId];
          if (!latest || latest.status !== 'ready') return previous;

          return {
            ...previous,
            [runId]: updateRunDrafts(latest, draftId, (item) => {
              const nextRows = item.rows.map((row) => {
                const issue = sceneErrors.byKey[row.key];
                if (!issue) return row;
                return {
                  ...row,
                  selectedOptionKey: '',
                  error: issue,
                };
              });

              const unresolvedCount = Math.max(
                getBlockingReferenceCount(nextRows),
                sceneErrors.unresolvedCount
              );

              return {
                ...item,
                status: 'error',
                rows: nextRows,
                errorMessage:
                  unresolvedCount > 0
                    ? `${unresolvedCount} required scene reference${unresolvedCount === 1 ? '' : 's'} unresolved.`
                    : toAssemblyErrorMessage(error),
              };
            }),
          };
        });
      }
    },
    [assemblyByRunId, onClipsCreated, runs, setAssemblyByRunId]
  );

  return {
    copiedPreviewDraftId,
    handleSceneSelection,
    copyPreviewJson,
    handleAssembleDraft,
  };
};
