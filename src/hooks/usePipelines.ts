import { useState, useEffect, useCallback } from 'react';
import { PipelineTemplate, CheckpointConfig } from '../api/structs';
import PipelineAPI from '../api/pipeline';

export function usePipelines() {
  const [pipelines, setPipelines] = useState<PipelineTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PipelineAPI.listPipelineTemplates();
      setPipelines(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipelines');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const createPipeline = async (
    id: string,
    name: string,
    checkpoints: CheckpointConfig[],
    description?: string
  ) => {
    const created = await PipelineAPI.createPipelineTemplate(id, name, checkpoints, description);
    setPipelines((prev) => [...prev, created]);
    return created;
  };

  const updatePipeline = async (id: string, updates: Partial<PipelineTemplate>) => {
    const updated = await PipelineAPI.updatePipelineTemplate(id, updates);
    setPipelines((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePipeline = async (id: string) => {
    await PipelineAPI.deletePipelineTemplate(id);
    setPipelines((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    pipelines,
    isLoading,
    error,
    refetch: fetchPipelines,
    createPipeline,
    updatePipeline,
    deletePipeline,
  };
}