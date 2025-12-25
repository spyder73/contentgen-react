import React, { useEffect, useState } from 'react';
import API, { Idea, ImageGenerator, VideoGenerator } from '../api/api';
import ModelSelector, { Provider } from './ModelSelector';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  onRefresh: number;
  imageGenerator: ImageGenerator;
  videoGenerator: VideoGenerator;
  imageModel: string;
  videoModel: string;
}

const IdeasList: React.FC<IdeasListProps> = ({ 
  onRefresh,
  imageGenerator,
  videoGenerator,
  imageModel,
  videoModel
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [bulkIdeas, setBulkIdeas] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Model selection state
  const [provider, setProvider] = useState<Provider>('google');
  const [model, setModel] = useState('x-ai/grok-4-fast');

  const fetchIdeas = async () => {
    try {
      const data = await API.getIdeas();
      setIdeas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [onRefresh]);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim()) return;

    setIsLoading(true);
    try {
      await API.createNewIdea(
        newIdea,
        provider,
        provider === 'openrouter' ? model : undefined
      );
      setNewIdea('');
      setTimeout(fetchIdeas, 1000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkIdeas.trim()) return;

    setIsLoading(true);
    try {
      await API.createMultipleIdeas(
        bulkIdeas,
        provider,
        provider === 'openrouter' ? model : undefined
      );
      setBulkIdeas('');
      setShowBulk(false);
      setTimeout(fetchIdeas, 1000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (videoIdea: string) => {
    try {
      await API.deleteIdea(videoIdea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  const handleCreatePrompt = async (idea: Idea) => {
    if (!idea.clip_prompt_json) {
      alert('Idea still generating...');
      return;
    }
    try {
      await API.createClipPrompt(
        // TODO: We need to specify the videoModel here
        idea.clip_prompt_json,
        imageGenerator,
        videoGenerator,
        imageGenerator === 'openrouter' ? imageModel : undefined,
      );
      await API.deleteIdea(idea.clip_idea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">💡 Ideas ({ideas.length})</h2>
        <button
          onClick={() => setShowBulk(!showBulk)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {showBulk ? '📝 Single' : '📋 Bulk'} Mode
        </button>
      </div>

      {/* Model Selector */}
      <ModelSelector
        provider={provider}
        model={model}
        onProviderChange={setProvider}
        onModelChange={setModel}
      />

      {/* Input Forms */}
      {showBulk ? (
        <form onSubmit={handleBulkCreate} className="space-y-2">
          <textarea
            value={bulkIdeas}
            onChange={(e) => setBulkIdeas(e.target.value)}
            placeholder="Enter a theme to generate multiple video ideas..."
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={isLoading || !bulkIdeas.trim()}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? '⏳ Generating...' : '🚀 Generate Multiple Ideas'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreateIdea} className="flex gap-2">
          <input
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="Enter a video idea..."
            className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !newIdea.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isLoading ? '⏳' : '➕'}
          </button>
        </form>
      )}

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No ideas yet. Create one above!</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto">
          {ideas.map((idea, idx) => (
            <IdeaItem
              key={idea.id || idx}
              idea={idea}
              onCreatePrompt={handleCreatePrompt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeasList;