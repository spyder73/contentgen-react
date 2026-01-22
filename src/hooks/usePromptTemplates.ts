import { useState, useEffect, useCallback } from 'react';
import { PromptTemplate } from '../api/structs';
import PipelineAPI from '../api/pipeline';

export function usePromptTemplates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PipelineAPI.listPromptTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompt templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    id: string,
    name: string,
    content: string,
    description?: string
  ) => {
    const created = await PipelineAPI.createPromptTemplate(id, name, content, description);
    setTemplates((prev) => [...prev, created]);
    return created;
  };

  const updateTemplate = async (id: string, updates: Partial<PromptTemplate>) => {
    const updated = await PipelineAPI.updatePromptTemplate(id, updates);
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTemplate = async (id: string) => {
    await PipelineAPI.deletePromptTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    templates,
    isLoading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}