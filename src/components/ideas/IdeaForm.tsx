import React, { useState } from 'react';
import { Button, TextArea } from '../ui';

interface IdeaFormProps {
  onSubmitSingle: (idea: string) => void;
  onSubmitBulk: (ideasPrompt: string) => void;
  isLoading: boolean;
}

const IdeaForm: React.FC<IdeaFormProps> = ({
  onSubmitSingle,
  onSubmitBulk,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isBulkMode) {
      onSubmitBulk(input.trim());
    } else {
      onSubmitSingle(input.trim());
    }
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setIsBulkMode(false)}
          className={`text-sm px-3 py-1 rounded ${
            !isBulkMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Single Idea
        </button>
        <button
          type="button"
          onClick={() => setIsBulkMode(true)}
          className={`text-sm px-3 py-1 rounded ${
            isBulkMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}
        >
          Bulk Generate
        </button>
      </div>

      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          isBulkMode
            ? 'Describe a theme to generate multiple ideas...'
            : 'Describe your clip idea...'
        }
        rows={3}
      />

      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        disabled={!input.trim()}
        className="w-full"
      >
        {isBulkMode ? '🎯 Generate Ideas' : '💡 Create Idea'}
      </Button>
    </form>
  );
};

export default IdeaForm;