import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Idea } from '../../api/structs/clip';
import { ImageProvider, VideoProvider, AudioProvider, ChatProvider } from '../../api/structs/providers';
import IdeaGeneratorPanel from './IdeaGeneratorPanel';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  refreshTrigger: number;
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
  refreshTrigger,
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
  }, [refreshTrigger]);

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
      console.log('idea', idea);
      console.log('idea.clip_idea', idea.clip_idea);
      await API.deleteIdea(idea.clip_idea);
      fetchIdeas();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 pb-3 border-b border-slate-700">
        <h2 className="section-title">💡 Ideas ({ideas.length})</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4">
          {/* Generator Panel */}
          <div className="flex-shrink-0">
            <IdeaGeneratorPanel
              chatProvider={chatProvider}
              chatModel={chatModel}
              onIdeasCreated={fetchIdeas}
            />
          </div>

          {/* Ideas List */}
          {ideas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">💡</div>
              <p>No ideas yet. Create one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
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
    </div>
  );
};

export default IdeasList;