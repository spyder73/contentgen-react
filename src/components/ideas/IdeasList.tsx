import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { Idea } from '../../api/structs/clip';
import IdeaGeneratorPanel from './IdeaGeneratorPanel';
import IdeaItem from './IdeaItem';
import { useToast } from '../../hooks/useToast';

interface IdeasListProps {
  refreshTrigger: number;
  openLibrarySignal?: number;
  onClipsCreated?: () => void;
}

const IdeasList: React.FC<IdeasListProps> = ({
  refreshTrigger,
  openLibrarySignal = 0,
  onClipsCreated,
}) => {
  const toast = useToast();
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
      toast({ text: `Failed: ${error.message}`, level: 'error' });
    }
  };

  const handleCreatePrompt = async (idea: Idea) => {
    if (!idea.clip_prompt_json) {
      toast({ text: 'Idea still generating...', level: 'warning' });
      return;
    }
    try {
      await API.createClipPromptFromJson(idea.clip_prompt_json);
      await API.deleteIdea(idea.clip_idea);
      fetchIdeas();
    } catch (error: any) {
      toast({ text: `Failed: ${error.message}`, level: 'error' });
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
              openLibrarySignal={openLibrarySignal}
              onIdeasCreated={fetchIdeas}
              onClipsCreated={onClipsCreated}
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
