import { useState, useEffect, useCallback } from 'react';
import { PipelineRun } from '../api/structs';
import PipelineAPI from '../api/pipeline';
import { MediaProfile } from '../api/structs/media-spec';
import { MediaAttachment, PipelineInputAttachment } from '../api/structs/pipeline';

const STORAGE_KEY = 'active_pipeline_runs';
const TERMINAL_STATES = ['completed', 'failed', 'cancelled'];

interface StoredRun {
  id: string;
  templateId: string;
  initialInput: string;
  startedAt: string;
}

export function usePipelineRuns() {
  const [runs, setRuns] = useState<Map<string, PipelineRun>>(new Map());
  const [storedRuns, setStoredRuns] = useState<StoredRun[]>([]);

  // Load stored runs on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredRun[] = JSON.parse(stored);
        setStoredRuns(parsed);
      }
    } catch (err) {
      console.error('Failed to load stored runs:', err);
    }
  }, []);

  // Restore runs from storage
  useEffect(() => {
    const restoreRuns = async () => {
      for (const stored of storedRuns) {
        try {
          const run = await PipelineAPI.getPipeline(stored.id);
          if (run && !TERMINAL_STATES.includes(run.status)) {
            setRuns((prev) => new Map(prev).set(run.id, run));
          } else {
            // Remove completed/failed runs from storage
            removeStoredRun(stored.id);
          }
        } catch (err) {
          console.error(`Failed to restore run ${stored.id}:`, err);
          removeStoredRun(stored.id);
        }
      }
    };

    if (storedRuns.length > 0) {
      restoreRuns();
    }
  }, [storedRuns]);

  // Poll active runs
  useEffect(() => {
    const activeRuns = Array.from(runs.values()).filter(
      (r) => !TERMINAL_STATES.includes(r.status)
    );

    if (activeRuns.length === 0) return;

    const poll = setInterval(async () => {
      for (const run of activeRuns) {
        try {
          const updated = await PipelineAPI.getPipeline(run.id);
          setRuns((prev) => new Map(prev).set(updated.id, updated));

          if (TERMINAL_STATES.includes(updated.status)) {
            removeStoredRun(updated.id);
          }
        } catch (err) {
          console.error(`Poll failed for ${run.id}:`, err);
        }
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [runs]);

  const saveStoredRun = (run: StoredRun) => {
    setStoredRuns((prev) => {
      const updated = [...prev.filter((r) => r.id !== run.id), run];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeStoredRun = (runId: string) => {
    setStoredRuns((prev) => {
      const updated = prev.filter((r) => r.id !== runId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const startRun = useCallback(
    async (
      templateId: string,
      input: string,
      options: {
        autoMode: boolean;
        initialAttachments?: PipelineInputAttachment[];
        musicMediaId?: string | null;
        provider: string;
        model: string;
        mediaProfile?: MediaProfile;
      }
    ): Promise<PipelineRun> => {
      const response = await PipelineAPI.startPipeline(templateId, input, options);
      const fullRun = await PipelineAPI.getPipeline(response.run_id);

      setRuns((prev) => new Map(prev).set(fullRun.id, fullRun));

      saveStoredRun({
        id: fullRun.id,
        templateId,
        initialInput: input,
        startedAt: new Date().toISOString(),
      });

      return fullRun;
    },
    []
  );

  const continueRun = useCallback(async (runId: string) => {
    await PipelineAPI.continuePipeline(runId);
    const updated = await PipelineAPI.getPipeline(runId);
    setRuns((prev) => new Map(prev).set(updated.id, updated));
  }, []);

  const regenerateCheckpoint = useCallback(async (runId: string, checkpoint: number) => {
    await PipelineAPI.regenerateCheckpoint(runId, checkpoint);
    const updated = await PipelineAPI.getPipeline(runId);
    setRuns((prev) => new Map(prev).set(updated.id, updated));
  }, []);

  const injectCheckpointPrompt = useCallback(
    async (
      runId: string,
      checkpointIndex: number,
      text: string,
      options?: { autoRegenerate?: boolean; source?: string }
    ) => {
      await PipelineAPI.injectCheckpointPrompt(runId, checkpointIndex, text, options);
      const updated = await PipelineAPI.getPipeline(runId);
      setRuns((prev) => new Map(prev).set(updated.id, updated));
      return updated;
    },
    []
  );

  const cancelRun = useCallback(async (runId: string) => {
    await PipelineAPI.cancelPipeline(runId);
    removeStoredRun(runId);
    setRuns((prev) => {
      const next = new Map(prev);
      next.delete(runId);
      return next;
    });
  }, []);

  const removeRun = useCallback((runId: string) => {
    removeStoredRun(runId);
    setRuns((prev) => {
      const next = new Map(prev);
      next.delete(runId);
      return next;
    });
  }, []);

  const addCheckpointAttachment = useCallback(
    async (
      runId: string,
      checkpointIndex: number,
      attachment: Omit<MediaAttachment, 'id' | 'created_at'>
    ) => {
      await PipelineAPI.addAttachment(runId, checkpointIndex, attachment);
      const updated = await PipelineAPI.getPipeline(runId);
      setRuns((prev) => new Map(prev).set(updated.id, updated));
      return updated;
    },
    []
  );

  return {
    runs: Array.from(runs.values()),
    startRun,
    continueRun,
    regenerateCheckpoint,
    injectCheckpointPrompt,
    addCheckpointAttachment,
    cancelRun,
    removeRun,
  };
}
