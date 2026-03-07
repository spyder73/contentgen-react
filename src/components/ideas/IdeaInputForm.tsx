import React, { useState } from 'react';
import { Button, TextArea, Select } from '../ui';
import { PipelineTemplate } from '../../api/structs';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface Props {
  templates: PipelineTemplate[];
  onStart: (input: string, templateId: string, autoMode: boolean) => Promise<void>;
  disabled?: boolean;
}

const IdeaInputForm: React.FC<Props> = ({ templates, onStart, disabled }) => {
  const [input, setInput] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [autoMode, setAutoMode] = useLocalStorage('pipeline_auto_mode', true);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (templates.length && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !templateId) return;

    setLoading(true);
    try {
      await onStart(input.trim(), templateId, autoMode);
      setInput('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your video idea..."
        rows={3}
        disabled={disabled}
      />

      <div className="flex items-center gap-3">
        <Select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={templateOptions}
          selectSize="sm"
          className="flex-1"
          placeholder="Select pipeline..."
          disabled={disabled}
        />

        {/* Auto Mode Toggle */}
        <button
          type="button"
          onClick={() => setAutoMode(!autoMode)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors
            ${autoMode
              ? 'bg-green-600/20 text-green-400 border border-green-600/50'
              : 'bg-slate-700 text-slate-400 border border-slate-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
          `}
          title={autoMode ? 'Auto mode: Pipeline runs automatically' : 'Manual mode: Confirm each step'}
        >
          {autoMode ? 'Auto' : 'Manual'}
        </button>

        <Button
          type="submit"
          disabled={!input.trim() || loading || disabled}
          loading={loading}
        >
          Generate
        </Button>
      </div>

      {!autoMode && (
        <p className="text-xs text-slate-500">
          Manual mode: You'll review and confirm each pipeline step
        </p>
      )}
    </form>
  );
};

export default IdeaInputForm;
