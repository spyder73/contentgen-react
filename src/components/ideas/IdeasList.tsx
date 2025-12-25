import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Idea } from '../../api/structs/clip';
import { ImageProvider, VideoProvider, ChatProvider } from '../../api/structs/providers';
import IdeaForm from './IdeaForm';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  onRefresh: number;
  imageProvider: ImageProvider;
  videoProvider: VideoProvider;
  imageModel: string;
  videoModel: string;
}

const IdeasList: React.FC<IdeasListProps> = ({ 
  onRefresh,
  imageProvider,
  videoProvider,
  imageModel,
  videoModel,
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCreateSingleIdea = async (idea: string, provider: ChatProvider, model: string) => {
    setIsLoading(true);
    try {
      await API.createNewIdea(
        idea,
        provider,
        provider === 'openrouter' ? model : undefined
      );
      setTimeout(fetchIdeas, 1000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBulkIdeas = async (ideas: string, provider: ChatProvider, model: string) => {
    setIsLoading(true);
    try {
      await API.createMultipleIdeas(
        ideas,
        provider,
        provider === 'openrouter' ? model : undefined
      );
      setTimeout(fetchIdeas, 1000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (clipIdea: string) => {
    try {
      await API.deleteIdea(clipIdea);
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
        idea.clip_prompt_json,
        imageProvider,
        videoProvider,
        imageProvider === 'openrouter' ? imageModel : undefined
      );
      await API.deleteIdea(idea.clip_idea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="section-title">💡 Ideas ({ideas.length})</h2>
      </div>

      {/* Form */}
      <div className="shrink-0">
        <IdeaForm
          onSubmitSingle={handleCreateSingleIdea}
          onSubmitBulk={handleCreateBulkIdeas}
          isLoading={isLoading}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {ideas.length === 0 ? (
          <div className="list-empty">
            <p>No ideas yet. Create one above!</p>
          </div>
        ) : (
          <div className="list-container">
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
    </div>
  );
};

export default IdeasList;