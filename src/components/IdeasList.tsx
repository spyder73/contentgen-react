import React, { useEffect, useState } from 'react';
import API, { Idea } from '../api/api';

interface IdeasListProps {
  onRefresh: number;
}

const IdeasList: React.FC<IdeasListProps> = ({ onRefresh }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.getIdeas();
      console.log('Fetched ideas:', data);
      setIdeas(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch ideas:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load ideas');
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [onRefresh]);

  const handleCreateVideoPrompt = async (idea: Idea) => {
    if (!idea.video_prompt_json || idea.video_prompt_json === '') {
      alert('Please wait for the AI to generate the video structure. The idea is still being processed.');
      return;
    }

    try {
      await API.createVideoPrompt(idea.video_prompt_json);
      await API.deleteIdea(idea.video_idea);
      await fetchIdeas();
    } catch (error: any) {
      console.error('Failed to create video prompt:', error);
      alert(`Failed to create video prompt: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditIdea = async (idea: Idea) => {
    const newIdea = window.prompt('Edit Idea:', idea.video_idea);
    if (!newIdea || newIdea === idea.video_idea) return;

    try {
      await API.deleteIdea(idea.video_idea);
      await API.createNewPrompt(newIdea);
      await fetchIdeas();
    } catch (error: any) {
      console.error('Failed to edit idea:', error);
      alert(`Failed to edit idea: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDeleteIdea = async (videoIdea: string) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      await API.deleteIdea(videoIdea);
      await fetchIdeas();
    } catch (error: any) {
      console.error('Failed to delete idea:', error);
      alert(`Failed to delete idea: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchIdeas}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">💡 Ideas ({ideas.length})</h2>
      
      {ideas.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No ideas yet. Create one above!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => {
            const hasJsonResponse = idea.video_prompt_json && idea.video_prompt_json !== '';
            const isProcessing = !hasJsonResponse;

            return (
              <div
                key={idea.id}
                className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors"
              >
                {/* Action buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleEditIdea(idea)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Edit Video Prompt"
                  >
                    <span className="text-slate-300">✏️</span>
                  </button>
                  
                  <button
                    onClick={() => handleCreateVideoPrompt(idea)}
                    disabled={isProcessing}
                    className={`p-2 rounded-lg transition-colors ${
                      isProcessing 
                        ? 'text-slate-500 cursor-not-allowed' 
                        : 'text-green-400 hover:bg-slate-600'
                    }`}
                    title={isProcessing ? 'Wait for AI to finish processing' : 'Send off to Prompts'}
                  >
                    <span>✅</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteIdea(idea.video_idea)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-red-400"
                    title="Delete Video Prompt"
                  >
                    <span>🗑️</span>
                  </button>

                  <span className="flex-1 text-slate-100 font-bold self-center ml-2">
                    {idea.video_idea}
                  </span>
                </div>

                {/* JSON Response */}
                <div className="max-h-[150px] overflow-y-auto bg-slate-900 rounded p-3">
                  {isProcessing ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                      {idea.video_prompt_json}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdeasList;