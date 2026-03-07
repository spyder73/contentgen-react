import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Idea } from '../../api/structs/clip';
import { ChatProvider } from '../../api/structs/providers';
import { MediaProfile } from '../../api/structs/media-spec';
import IdeaGeneratorPanel from './IdeaGeneratorPanel';
import IdeaItem from './IdeaItem';

interface IdeasListProps {
  refreshTrigger: number;
  chatProvider: ChatProvider;
  chatModel: string;
  mediaProfile: MediaProfile;
}

const IdeasList: React.FC<IdeasListProps> = ({
  refreshTrigger,
  chatProvider,
  chatModel,
  mediaProfile,
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);

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

  const handleCreatePrompt = async (idea: Idea) => {
    if (!idea.clip_prompt_json) {
      alert('Idea still generating...');
      return;
    }
    try {
      await API.createClipPromptFromJson(idea.clip_prompt_json, mediaProfile);
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
        <h2 className="section-title">Ideas ({ideas.length})</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 py-4">
          {/* Generator Panel */}
          <div className="flex-shrink-0">
            <IdeaGeneratorPanel
              chatProvider={chatProvider}
              chatModel={chatModel}
              mediaProfile={mediaProfile}
              onIdeasCreated={fetchIdeas}
            />
          </div>

          {/* Ideas List */}
          {ideas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No ideas yet. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-3 motion-stagger">
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
