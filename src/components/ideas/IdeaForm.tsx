import React, { useState } from 'react';
import { ChatProviderSelector } from '../selectors';
import { Button, Input, TextArea } from '../ui';
import { ChatProvider, DEFAULT_CHAT_PROVIDER, DEFAULT_CHAT_MODEL } from '../../api/structs/providers';

interface IdeaFormProps {
  onSubmitSingle: (idea: string, provider: ChatProvider, model: string) => Promise<void>;
  onSubmitBulk: (ideas: string, provider: ChatProvider, model: string) => Promise<void>;
  isLoading: boolean;
}

const IdeaForm: React.FC<IdeaFormProps> = ({
  onSubmitSingle,
  onSubmitBulk,
  isLoading,
}) => {
  const [newIdea, setNewIdea] = useState('');
  const [bulkIdeas, setBulkIdeas] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  // Chat provider state for idea generation
  const [chatProvider, setChatProvider] = useState<ChatProvider>(DEFAULT_CHAT_PROVIDER);
  const [chatModel, setChatModel] = useState(DEFAULT_CHAT_MODEL);

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;
    await onSubmitSingle(newIdea, chatProvider, chatModel);
    setNewIdea('');
  };

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkIdeas.trim()) return;
    await onSubmitBulk(bulkIdeas, chatProvider, chatModel);
    setBulkIdeas('');
    setShowBulk(false);
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Idea Generation Model</span>
        <button
          onClick={() => setShowBulk(!showBulk)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {showBulk ? '📝 Single' : '📋 Bulk'} Mode
        </button>
      </div>

      {/* Chat Provider Selector */}
      <ChatProviderSelector
        provider={chatProvider}
        model={chatModel}
        onProviderChange={setChatProvider}
        onModelChange={setChatModel}
      />

      {/* Forms */}
      {showBulk ? (
        <form onSubmit={handleSubmitBulk} className="space-y-2">
          <TextArea
            value={bulkIdeas}
            onChange={(e) => setBulkIdeas(e.target.value)}
            placeholder="Enter a theme to generate multiple video ideas..."
            rows={3}
          />
          <Button
            type="submit"
            variant="purple"
            disabled={isLoading || !bulkIdeas.trim()}
            loading={isLoading}
            className="w-full"
          >
            🚀 Generate Multiple Ideas
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmitSingle} className="flex gap-2">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Enter a video idea..."
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !newIdea.trim()}
            loading={isLoading}
          >
            ➕
          </Button>
        </form>
      )}
    </div>
  );
};

export default IdeaForm;