import React, { useEffect, useState } from 'react';
import API, { Idea } from '../api/api';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  onRefresh: number;
}

const IdeasList: React.FC<IdeasListProps> = ({ onRefresh }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const fetchIdeas = async () => {
    try {
      const data = await API.getIdeas();
      setIdeas(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch ideas:', error);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [onRefresh]);

  const handleDelete = async (videoIdea: string) => {
    if (!window.confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      await API.deleteIdea(videoIdea);
    } catch (error: any) {
      console.error('Failed to delete idea:', error);
      alert(`Failed to delete idea: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCreatePrompt = async (idea: Idea) => {
    try {
      // Parse and re-stringify to ensure valid JSON
      const parsed = JSON.parse(idea.video_prompt_json);
      await API.createVideoPromptFromJson(parsed);
      await API.deleteIdea(idea.video_idea);
    } catch (error: any) {
      console.error('Failed to create video prompt:', error);
      alert(`Failed to create video prompt: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">💡 Ideas ({ideas.length})</h2>
      
      {ideas.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No ideas yet. Create one above!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map((idea) => (
            <IdeaItem
              key={idea.id}
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