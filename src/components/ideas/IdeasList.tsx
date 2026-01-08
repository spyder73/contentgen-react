import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Idea } from '../../api/structs/clip';
import { ImageProvider, VideoProvider, AudioProvider, ChatProvider } from '../../api/structs/providers';
import IdeaForm from './IdeaForm';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  onRefresh: number;
  // Chat (for generating ideas)
  chatProvider: ChatProvider;
  chatModel: string;
  // Media generators (passed when creating clip from idea)
  imageProvider: ImageProvider;
  imageModel: string;
  videoProvider: VideoProvider;
  videoModel: string;
  audioProvider: AudioProvider;
  audioModel: string;
}

const IdeasList: React.FC<IdeasListProps> = ({
  onRefresh,
  chatProvider,
  chatModel,
  imageProvider,
  imageModel,
  videoProvider,
  videoModel,
  audioProvider,
  audioModel,
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

  // Use chatProvider/chatModel for idea generation
  const handleCreateSingleIdea = async (idea: string) => {
    setIsLoading(true);
    try {
      await API.createNewIdea(idea, chatProvider, chatModel || undefined);
      setTimeout(fetchIdeas, 1000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBulkIdeas = async (ideasPrompt: string) => {
    setIsLoading(true);
    try {
      await API.createMultipleIdeas(ideasPrompt, chatProvider, chatModel || undefined);
      setTimeout(fetchIdeas, 2000);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (clip_idea: string) => {
    try {
      await API.deleteIdea(clip_idea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  // Use media providers when creating clip from idea
  const handleCreatePrompt = async (idea: Idea) => {
    if (!idea.clip_prompt_json) {
      alert('Idea still generating...');
      return;
    }
    try {
      await API.createClipPromptFromJson(
        idea.clip_prompt_json,
        imageProvider,
        imageModel,
        videoProvider,
        videoModel,
        audioProvider,
        audioModel
      );
      await API.deleteIdea(idea.clip_idea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="section-title">💡 Ideas ({ideas.length})</h2>
      </div>

      <div className="shrink-0">
        <IdeaForm
          onSubmitSingle={handleCreateSingleIdea}
          onSubmitBulk={handleCreateBulkIdeas}
          isLoading={isLoading}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {ideas.length === 0 ? (
          <div className="list-empty">
            <p>No ideas yet. Create one above!</p>
          </div>
        ) : (
          <div className="list-container">
            {ideas.map((idea) => (
              <IdeaItem
                key={idea.id}
                idea={idea}
                onCreatePrompt={handleCreatePrompt}
                onDelete={() => handleDelete(idea.clip_idea)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeasList;